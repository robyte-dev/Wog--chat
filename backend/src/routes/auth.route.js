import express from "express";
import { rateLimit } from "express-rate-limit";
import { login, logout, onboard, signup } from "../controllers/auth.controller.js";
import { googleAuth } from "../controllers/googleAuth.controller.js";
import {
  completePasswordReset,
  requestPasswordReset,
  verifyPasswordResetCode,
} from "../controllers/passwordReset.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { verifyNewDeviceLogin } from "../lib/deviceAuth.js";
import { getMySessions, terminateOtherSessions, terminateSession } from "../controllers/session.controller.js";

const router = express.Router();
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many password reset attempts. Please wait and try again." },
});
const loginVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many sign-in verification attempts. Please wait and try again." },
});
const signInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Please wait 15 minutes and try again." },
});

router.post("/signup", signup);
router.post("/login", signInLimiter, login);
router.post("/google", signInLimiter, googleAuth);
router.post("/login/verify-device", loginVerificationLimiter, (req, res, next) => verifyNewDeviceLogin(req, res).catch(next));
router.post("/password-reset/request", passwordResetLimiter, requestPasswordReset);
router.post("/password-reset/verify", passwordResetLimiter, verifyPasswordResetCode);
router.post("/password-reset/complete", passwordResetLimiter, completePasswordReset);
router.post("/logout", protectRoute, logout);
router.get("/sessions", protectRoute, getMySessions);
router.delete("/sessions/others", protectRoute, terminateOtherSessions);
router.delete("/sessions/:id", protectRoute, terminateSession);

router.post("/onboarding", protectRoute, onboard);

// check if user is logged in
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export default router;
