import { randomBytes } from "node:crypto";
import User from "../models/User.js";
import { createAuthSession, syncStreamUser } from "../lib/authSession.js";
import { beginVerifiedLogin } from "../lib/deviceAuth.js";
import { verifyGoogleIdToken } from "../lib/googleIdentity.js";

const isDuplicateKeyError = (error) => error?.code === 11000;

export async function googleAuth(req, res) {
  const credential = typeof req.body?.credential === "string" ? req.body.credential.trim() : "";
  const nonce = typeof req.body?.nonce === "string" ? req.body.nonce.trim() : "";
  if (!credential || !nonce) {
    return res.status(400).json({ message: "A Google credential and nonce are required." });
  }

  let identity;
  try {
    identity = await verifyGoogleIdToken(credential, nonce);
  } catch (error) {
    if (error.code === "GOOGLE_AUTH_NOT_CONFIGURED") {
      return res.status(503).json({ message: error.message });
    }
    console.warn("Google ID token verification failed:", error.message);
    return res.status(401).json({ message: "Google sign-in could not be verified." });
  }

  try {
    let user = await User.findOne({ googleId: identity.googleId });
    let shouldSyncStream = false;
    let isNewAccount = false;

    if (!user) {
      const emailAccount = await User.findOne({ email: identity.email });

      if (emailAccount) {
        if (emailAccount.googleId && emailAccount.googleId !== identity.googleId) {
          return res.status(409).json({ message: "This email is linked to a different Google account." });
        }

        const linkedUser = await User.findOneAndUpdate(
          {
            _id: emailAccount._id,
            $or: [
              { googleId: { $exists: false } },
              { googleId: null },
              { googleId: identity.googleId },
            ],
          },
          { $set: { googleId: identity.googleId } },
          { new: true, runValidators: true },
        );

        if (!linkedUser) {
          return res.status(409).json({ message: "This email is linked to a different Google account." });
        }
        user = linkedUser;
        shouldSyncStream = true;
      } else {
        user = await User.create({
          fullName: identity.fullName,
          email: identity.email,
          googleId: identity.googleId,
          profilePic: identity.profilePic,
          // The required local-password field is never sent to or known by the user.
          password: randomBytes(48).toString("base64url"),
        });
        shouldSyncStream = true;
        isNewAccount = true;
      }
    }

    if (shouldSyncStream) await syncStreamUser(user);
    if (isNewAccount) return await createAuthSession(req, res, user, 200, true);
    return await beginVerifiedLogin(req, res, user);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ message: "This Google account is already linked to another profile." });
    }
    console.error("Google sign-in failed:", error);
    return res.status(error.status || (error.code === "EMAIL_NOT_CONFIGURED" ? 503 : 500)).json({
      message: error.code === "EMAIL_NOT_CONFIGURED" ? "Email verification is not configured yet. Please contact support." : "Could not finish Google sign-in. Please try again.",
    });
  }
}
