import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import AuthSession from "../models/AuthSession.js";
import LoginVerification from "../models/LoginVerification.js";
import TrustedDevice from "../models/TrustedDevice.js";
import User from "../models/User.js";
import { sendNewDeviceLoginCode } from "./email.js";

const SESSION_DAYS = 30;
const TRUST_DAYS = 180;
const CODE_MINUTES = 5;
const RESEND_SECONDS = 60;
const CODE_ATTEMPTS = 5;
const DEVICE_COOKIE = "wog_device";

const digest = (value) => createHmac("sha256", process.env.JWT_SECRET_KEY).update(value).digest("hex");
const secureCookie = process.env.COOKIE_SECURE === "true" || (process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production");

function deviceLabel(req) {
  const agent = req.get("user-agent") || "Unknown browser";
  const browser = agent.includes("Firefox") ? "Firefox" : agent.includes("Edg/") ? "Edge" : agent.includes("Chrome/") ? "Chrome" : agent.includes("Safari/") ? "Safari" : "Browser";
  const os = agent.includes("Android") ? "Android" : agent.includes("iPhone") || agent.includes("iPad") ? "iOS" : agent.includes("Windows") ? "Windows" : agent.includes("Mac OS") ? "macOS" : agent.includes("Linux") ? "Linux" : "device";
  return `${browser} on ${os}`;
}

function writeDeviceCookie(res, rawToken) {
  res.cookie(DEVICE_COOKIE, rawToken, {
    httpOnly: true, secure: secureCookie, sameSite: "strict", path: "/",
    maxAge: TRUST_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearDeviceCookie(res) {
  res.clearCookie(DEVICE_COOKIE, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "strict",
    path: "/",
  });
}

async function trustDevice(req, res, user) {
  const rawToken = randomBytes(32).toString("base64url");
  const now = new Date();
  const record = await TrustedDevice.create({
    user: user._id,
    tokenHash: digest(rawToken),
    label: deviceLabel(req),
    lastUsedAt: now,
    expiresAt: new Date(now.getTime() + TRUST_DAYS * 24 * 60 * 60 * 1000),
  });
  writeDeviceCookie(res, rawToken);
  return record;
}

export async function createAuthSession(req, res, user, status = 200, shouldTrustDevice = false, trustedDeviceId = null) {
  const sessionId = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  if (shouldTrustDevice) trustedDeviceId = (await trustDevice(req, res, user))._id;
  await AuthSession.create({ user: user._id, sessionId, trustedDevice: trustedDeviceId, deviceLabel: deviceLabel(req), lastActiveAt: now, expiresAt });

  const token = jwt.sign({ userId: user._id, tokenVersion: user.tokenVersion || 0, sid: sessionId }, process.env.JWT_SECRET_KEY, { expiresIn: `${SESSION_DAYS}d` });
  res.cookie("jwt", token, {
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: secureCookie,
  });
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  return res.status(status).json({ success: true, user: safeUser });
}

export async function beginVerifiedLogin(req, res, user) {
  const rawDeviceToken = req.cookies?.[DEVICE_COOKIE];
  if (rawDeviceToken) {
    const trusted = await TrustedDevice.findOne({ user: user._id, tokenHash: digest(rawDeviceToken), expiresAt: { $gt: new Date() } });
    if (trusted) {
      const rotatedToken = randomBytes(32).toString("base64url");
      trusted.tokenHash = digest(rotatedToken);
      trusted.lastUsedAt = new Date();
      await trusted.save();
      writeDeviceCookie(res, rotatedToken);
      return createAuthSession(req, res, user, 200, false, trusted._id);
    }
  }

  const now = new Date();
  const prior = await LoginVerification.findOne({ user: user._id }).select("lastSentAt").lean();
  if (prior && now.getTime() - prior.lastSentAt.getTime() < RESEND_SECONDS * 1000) {
    const error = new Error("A verification code was sent recently. Please wait one minute before trying again.");
    error.status = 429;
    throw error;
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const codeHash = digest(`${user._id}:${code}`);
  await LoginVerification.findOneAndUpdate(
    { user: user._id },
    { $set: { email: user.email, codeHash, expiresAt: new Date(now.getTime() + CODE_MINUTES * 60_000), lastSentAt: now, attempts: 0 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  try {
    await sendNewDeviceLoginCode(user.email, code);
  } catch (mailError) {
    await LoginVerification.deleteOne({ user: user._id, codeHash });
    if (mailError.code === "EMAIL_NOT_CONFIGURED") throw mailError;
    console.error("New-device verification email delivery failed:", mailError.message);
    const error = new Error("We could not send a verification email. Please try again later.");
    error.status = 502;
    throw error;
  }
  return res.status(200).json({ requiresVerification: true, email: user.email, message: "We sent a sign-in code to your email." });
}

export async function verifyNewDeviceLogin(req, res) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(code)) return res.status(400).json({ message: "Enter the email and 6-digit code." });

  const record = await LoginVerification.findOne({ email, expiresAt: { $gt: new Date() } });
  if (!record || record.attempts >= CODE_ATTEMPTS) return res.status(400).json({ message: "That code has expired or reached its attempt limit. Sign in again to request a new code." });
  const candidate = Buffer.from(digest(`${record.user}:${code}`), "hex");
  const saved = Buffer.from(record.codeHash, "hex");
  if (candidate.length !== saved.length || !timingSafeEqual(candidate, saved)) {
    await LoginVerification.updateOne(
      { _id: record._id, attempts: { $lt: CODE_ATTEMPTS }, expiresAt: { $gt: new Date() } },
      { $inc: { attempts: 1 } },
    );
    return res.status(400).json({ message: "That sign-in code is incorrect." });
  }

  const user = await User.findById(record.user);
  if (!user) return res.status(400).json({ message: "This account is no longer available." });
  const consumed = await LoginVerification.findOneAndDelete({
    _id: record._id,
    codeHash: record.codeHash,
    attempts: { $lt: CODE_ATTEMPTS },
    expiresAt: { $gt: new Date() },
  });
  if (!consumed) return res.status(400).json({ message: "That code expired or was already used. Sign in again to request a new one." });
  const trusted = await trustDevice(req, res, user);
  return createAuthSession(req, res, user, 200, false, trusted._id);
}

export async function listSessions(userId) {
  return AuthSession.find({ user: userId, revokedAt: null, expiresAt: { $gt: new Date() } })
    .select("sessionId trustedDevice deviceLabel createdAt lastActiveAt expiresAt")
    .sort({ lastActiveAt: -1 }).lean();
}

export async function revokeSession(userId, sessionId) {
  const session = await AuthSession.findOne({ user: userId, sessionId, revokedAt: null }).select("_id trustedDevice");
  if (!session) return null;
  if (session.trustedDevice) await TrustedDevice.deleteOne({ _id: session.trustedDevice, user: userId });
  return AuthSession.findOneAndUpdate({ _id: session._id, revokedAt: null }, { $set: { revokedAt: new Date() } }, { new: true });
}

export async function revokeOtherSessions(userId, currentSessionId) {
  const sessions = await AuthSession.find({ user: userId, sessionId: { $ne: currentSessionId }, revokedAt: null }).select("trustedDevice").lean();
  const deviceIds = sessions.map((session) => session.trustedDevice).filter(Boolean);
  if (deviceIds.length) await TrustedDevice.deleteMany({ _id: { $in: deviceIds }, user: userId });
  await AuthSession.updateMany({ user: userId, sessionId: { $ne: currentSessionId }, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export async function endCurrentSession(req, res) {
  if (req.sessionId) {
    const session = await AuthSession.findOneAndUpdate(
      { user: req.user._id, sessionId: req.sessionId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
      { new: false },
    ).select("trustedDevice");
    if (session?.trustedDevice) {
      await TrustedDevice.deleteOne({ _id: session.trustedDevice, user: req.user._id });
    }
  }
  res.clearCookie("jwt");
  clearDeviceCookie(res);
  return res.status(200).json({ success: true, message: "Logout successful" });
}
