import mongoose from "mongoose";

const authSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  sessionId: { type: String, required: true, unique: true },
  trustedDevice: { type: mongoose.Schema.Types.ObjectId, ref: "TrustedDevice", default: null },
  deviceLabel: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: { type: Date, default: null },
});

authSessionSchema.index({ user: 1, revokedAt: 1, lastActiveAt: -1 });
export default mongoose.model("AuthSession", authSessionSchema);
