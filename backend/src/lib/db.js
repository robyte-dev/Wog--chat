import mongoose from "mongoose";
import { log } from "./logger.js";

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured.");
    const conn = await mongoose.connect(process.env.MONGO_URI);
    log("info", "mongodb_connected", { host: conn.connection.host });
  } catch (error) {
    log("error", "mongodb_connection_failed", { message: error.message });
    process.exit(1); // 1 means failure
  }
};
