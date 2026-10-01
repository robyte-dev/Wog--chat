import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AuthSession from "../models/AuthSession.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const session = await AuthSession.findOne({
      user: decoded.userId,
      sessionId: decoded.sid,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).select("_id lastActiveAt");
    if (!session) return res.status(401).json({ message: "This session has ended. Please sign in again." });

    // The schema already excludes `password` by default. Combining an
    // exclusion with an explicit inclusion creates an invalid MongoDB
    // projection, so leave the other fields at their schema defaults.
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }
    if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }

    req.user = user;
    req.sessionId = decoded.sid;
    if (Date.now() - session.lastActiveAt.getTime() > 5 * 60 * 1000) {
      await AuthSession.updateOne({ _id: session._id, revokedAt: null }, { $set: { lastActiveAt: new Date() } });
    }

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError" || error.name === "NotBeforeError") {
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }
    console.error("Error in protectRoute middleware", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
