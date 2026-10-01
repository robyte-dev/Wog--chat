import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

import { connectDB } from "./lib/db.js";
import { log, requestLogger } from "./lib/logger.js";

const app = express();
const PORT = process.env.PORT || 5001;

const __dirname = path.resolve();

app.set("trust proxy", 1);

const allowedOrigins = new Set([
  "http://localhost:5173",
  ...(process.env.CORS_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean),
]);

app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.get("/api/health/live", (_req, res) => {
  res.status(200).json({ status: "ok", uptimeSeconds: Math.floor(process.uptime()) });
});

app.get(["/api/health", "/api/health/ready"], (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({ status: databaseReady ? "ready" : "not_ready", checks: { mongodb: databaseReady ? "connected" : "disconnected" } });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", (_req, res) => res.status(404).json({ message: "API endpoint not found." }));
app.use((error, req, res, _next) => {
  log("error", "unhandled_request_error", { requestId: req.requestId, message: error.message });
  if (res.headersSent) return _next(error);
  res.status(error.status || 500).json({ message: error.status ? error.message : "Internal server error." });
});

mongoose.connection.on("disconnected", () => log("warn", "mongodb_disconnected"));
mongoose.connection.on("error", (error) => log("error", "mongodb_runtime_error", { message: error.message }));
if (process.env.NODE_ENV === "production" && process.env.SERVE_FRONTEND !== "false") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const server = app.listen(PORT, () => {
  log("info", "server_started", { port: Number(PORT), environment: process.env.NODE_ENV || "development" });
  connectDB();
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    log("info", "server_shutdown", { signal });
    server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
  });
}
