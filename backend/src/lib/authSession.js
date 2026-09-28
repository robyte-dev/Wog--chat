import jwt from "jsonwebtoken";
import { upsertStreamUser } from "./stream.js";

export async function syncStreamUser(user) {
  try {
    await upsertStreamUser({
      id: user._id.toString(),
      name: user.fullName,
      image: user.profilePic || "",
    });
  } catch (error) {
    // Stream profile sync should not prevent a user from signing in.
    console.error("Could not sync the app user with Stream:", error.message);
  }
}

export function createAuthSession(res, user, status = 200) {
  const jwtSecret = process.env.JWT_SECRET_KEY;
  if (!jwtSecret) throw new Error("JWT_SECRET_KEY is not configured.");

  const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: "7d" });
  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  return res.status(status).json({ success: true, user: safeUser });
}
