import mongoose from "mongoose";

const passwordResetCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  lastSentAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  verifiedAt: { type: Date, default: null },
  resetTokenHash: { type: String, default: null },
  resetTokenExpiresAt: { type: Date, default: null },
}, { timestamps: true });

passwordResetCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetCodeSchema.index(
  { resetTokenHash: 1 },
  { unique: true, partialFilterExpression: { resetTokenHash: { $type: "string" } } },
);

export default mongoose.model("PasswordResetCode", passwordResetCodeSchema);
