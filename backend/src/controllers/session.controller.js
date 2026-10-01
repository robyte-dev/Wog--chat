import { listSessions, revokeOtherSessions, revokeSession } from "../lib/deviceAuth.js";

export async function getMySessions(req, res, next) {
  try {
    const sessions = await listSessions(req.user._id);
    return res.status(200).json({ sessions: sessions.map((session) => ({
    id: session.sessionId,
    device: session.deviceLabel,
    createdAt: session.createdAt,
    lastActiveAt: session.lastActiveAt,
    current: session.sessionId === req.sessionId,
    })) });
  } catch (error) { return next(error); }
}

export async function terminateSession(req, res, next) {
  try {
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id || id.length > 100) return res.status(400).json({ message: "Invalid session." });
  const session = await revokeSession(req.user._id, id);
  if (!session) return res.status(404).json({ message: "This session is already ended or not found." });
  if (id === req.sessionId) {
    res.clearCookie("jwt");
    res.clearCookie("wog_device", { httpOnly: true, secure: process.env.COOKIE_SECURE === "true" || (process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production"), sameSite: "strict", path: "/" });
  }
    return res.status(200).json({ success: true, message: "Device signed out." });
  } catch (error) { return next(error); }
}

export async function terminateOtherSessions(req, res, next) {
  try {
    await revokeOtherSessions(req.user._id, req.sessionId);
    return res.status(200).json({ success: true, message: "Other devices signed out." });
  } catch (error) { return next(error); }
}
