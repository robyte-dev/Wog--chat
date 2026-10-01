import { randomUUID } from "node:crypto";

export function log(level, event, fields = {}) {
  const entry = { timestamp: new Date().toISOString(), level, service: "wog-api", event, ...fields };
  console[level === "error" ? "error" : "log"](JSON.stringify(entry));
}

export function requestLogger(req, res, next) {
  const requestId = req.get("x-request-id")?.slice(0, 100) || randomUUID();
  const startedAt = Date.now();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  res.on("finish", () => {
    log(res.statusCode >= 500 ? "error" : "info", "http_request", {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });
  next();
}
