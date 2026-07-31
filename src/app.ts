import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { apiRouter } from "./routes";
import { logger } from "./logger";
import { fail } from "./utils/response";
import { AppError, statusForCode } from "./utils/AppError";

export function createApp() {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      autoLogging: process.env.NODE_ENV !== "test",
    })
  );
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:5180",
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadDir));

  app.use("/api", apiRouter);

  const frontendDist = path.join(process.cwd(), "frontend", "dist");
  app.use(express.static(frontendDist));
  // Exclude Engine.IO path so SPA fallback cannot mask a missing Socket.IO attach.
  app.get(/^(?!\/api)(?!\/uploads)(?!\/socket\.io).*/, (_req, res, next) => {
    res.sendFile(path.join(frontendDist, "index.html"), (err) => {
      if (err) next();
    });
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
      return fail(res, statusForCode(err.code), err.code, err.message, err.details);
    }
    logger.error({ err }, "Unhandled error");
    return fail(res, 500, "INTERNAL_ERROR", "Something went wrong.");
  });

  return app;
}
