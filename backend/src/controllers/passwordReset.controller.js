import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import User from "../models/User.js";
import PasswordResetCode from "../models/PasswordResetCode.js";
import { sendPasswordResetCode, sendPasswordResetConfirmation } from "../lib/email.js";
import AuthSession from "../models/AuthSession.js";
import TrustedDevice from "../models/TrustedDevice.js";

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const RESET_TICKET_TTL_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function digest(value) {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) throw new Error("JWT_SECRET_KEY is not configured.");
  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeDigestMatch(a, b) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

function errorResponse(res, status, message) {
  return res.status(status).json({ message });
}

export async function requestPasswordReset(req, res) {
  const email = normalizeEmail(req.body?.email);
  if (!emailPattern.test(email)) return errorResponse(res, 400, "Enter a valid email address.");

  try {
    const user = await User.findOne({ email }).select("_id").lean();
    if (!user) return errorResponse(res, 404, "This email has not been registered before.");

    const previousCode = await PasswordResetCode.findOne({ email }).select("lastSentAt").lean();
    if (previousCode && Date.now() - previousCode.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
      return errorResponse(res, 429, "Please wait one minute before requesting another code.");
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const now = new Date();
    const codeHash = digest(`${email}:${code}`);
    const resetRecord = await PasswordResetCode.findOneAndUpdate(
      { email },
      { $set: {
        user: user._id,
        codeHash,
        expiresAt: new Date(now.getTime() + CODE_TTL_MS),
        lastSentAt: now,
        attempts: 0,
        verifiedAt: null,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );

    try {
      await sendPasswordResetCode(email, code);
    } catch (mailError) {
      await PasswordResetCode.deleteOne({ _id: resetRecord._id, codeHash });
      if (mailError.code === "EMAIL_NOT_CONFIGURED") {
        return errorResponse(res, 503, "Password reset email is not configured yet. Please contact support.");
      }
      console.error("Password reset email delivery failed:", mailError.message);
      return errorResponse(res, 502, "We could not send the verification email. Please try again later.");
    }

    return res.status(200).json({ message: "A 6-digit code was sent to your email. It expires in 5 minutes." });
  } catch (error) {
    console.error("Password reset request failed:", error.message);
    return errorResponse(res, 500, "Could not start password reset. Please try again.");
  }
}

export async function verifyPasswordResetCode(req, res) {
  const email = normalizeEmail(req.body?.email);
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  if (!emailPattern.test(email) || !/^\d{6}$/.test(code)) {
    return errorResponse(res, 400, "Enter the 6-digit code sent to your email.");
  }

  try {
    const record = await PasswordResetCode.findOne({
      email,
      expiresAt: { $gt: new Date() },
      verifiedAt: null,
    }).lean();
    if (!record) return errorResponse(res, 400, "That code is invalid or has expired. Request a new one.");
    if (record.attempts >= MAX_CODE_ATTEMPTS) {
      return errorResponse(res, 429, "Too many incorrect codes. Request a new verification code.");
    }

    const candidateHash = digest(`${email}:${code}`);
    if (!safeDigestMatch(candidateHash, record.codeHash)) {
      await PasswordResetCode.updateOne(
        { _id: record._id, attempts: { $lt: MAX_CODE_ATTEMPTS }, verifiedAt: null, expiresAt: { $gt: new Date() } },
        { $inc: { attempts: 1 } },
      );
      return errorResponse(res, 400, "That code is incorrect. Check it and try again.");
    }

    const resetToken = randomBytes(32).toString("base64url");
    const now = new Date();
    const claimed = await PasswordResetCode.findOneAndUpdate(
      { _id: record._id, codeHash: candidateHash, attempts: { $lt: MAX_CODE_ATTEMPTS }, verifiedAt: null, expiresAt: { $gt: now } },
      { $set: {
        verifiedAt: now,
        expiresAt: new Date(now.getTime() + RESET_TICKET_TTL_MS),
        resetTokenHash: digest(resetToken),
        resetTokenExpiresAt: new Date(now.getTime() + RESET_TICKET_TTL_MS),
      } },
      { new: true },
    );
    if (!claimed) return errorResponse(res, 400, "That code has expired or was already used. Request a new one.");
    return res.status(200).json({ resetToken, message: "Email verified. Choose a new password." });
  } catch (error) {
    console.error("Password reset verification failed:", error.message);
    return errorResponse(res, 500, "Could not verify the code. Please try again.");
  }
}

export async function completePasswordReset(req, res) {
  const resetToken = typeof req.body?.resetToken === "string" ? req.body.resetToken : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (resetToken.length < 32) return errorResponse(res, 400, "Your reset session is invalid. Request a new code.");
  if (password.length < 6 || password.length > 128) {
    return errorResponse(res, 400, "Your password must be between 6 and 128 characters.");
  }

  try {
    const record = await PasswordResetCode.findOneAndDelete({
      resetTokenHash: digest(resetToken),
      verifiedAt: { $ne: null },
      resetTokenExpiresAt: { $gt: new Date() },
    });
    if (!record) return errorResponse(res, 400, "Your reset session has expired. Request a new code.");

    const user = await User.findById(record.user).select("+password email");
    if (!user) return errorResponse(res, 404, "This account no longer exists.");
    user.password = password;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    await Promise.all([
      AuthSession.deleteMany({ user: user._id }),
      TrustedDevice.deleteMany({ user: user._id }),
    ]);

    try {
      await sendPasswordResetConfirmation(user.email);
    } catch (mailError) {
      console.error("Password changed, but confirmation email could not be delivered:", mailError.message);
    }

    return res.status(200).json({ success: true, message: "Your password was reset successfully. Sign in with your new password." });
  } catch (error) {
    console.error("Password reset completion failed:", error.message);
    return errorResponse(res, 500, "Could not reset your password. Please request a new code.");
  }
}
