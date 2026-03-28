// FILE: src/app.ts — Entry point + cronjob scheduler

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

import routes from "./routes";
import { startScheduler } from "./jobs/scheduler";

const app = express();
const PORT = process.env.PORT || 5000;

// ═══════════════════════ MIDDLEWARE ═══════════════════════

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(compression());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Quá nhiều request, vui lòng thử lại sau." },
});
app.use("/api/auth/login", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Quá nhiều lần đăng nhập, vui lòng thử lại sau 15 phút." },
}));
app.use("/api", limiter);

// ═══════════════════════ STATIC FILES ═══════════════════════

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ═══════════════════════ ROUTES ═══════════════════════

app.use("/api", routes);

// ═══════════════════════ ERROR HANDLING ═══════════════════════

app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({ success: false, message: "Route không tồn tại" });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File quá lớn. Tối đa 10MB." });
  }
  if (err.message?.includes("Chỉ chấp nhận file ảnh")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: "Lỗi server" });
});

// ═══════════════════════ START SERVER ═══════════════════════

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🔥 VESTA API đang chạy!               ║
  ║   Port: ${PORT}                             ║
  ║   Mode: ${process.env.NODE_ENV || "development"}                  ║
  ║   API:  http://localhost:${PORT}/api        ║
  ╚══════════════════════════════════════════╝
  `);

  // Khởi động cronjob scheduler
  startScheduler();
});

export default app;