import path from "path";
import fs from "fs";
import multer from "multer";
import { randomUUID } from "crypto";
import { AppError } from "../utils/AppError";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

function uploadRoot(): string {
  const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".bin";
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new AppError("UPLOAD_VALIDATION", "Only JPEG, PNG, WebP, or GIF allowed.") as unknown as Error);
    }
    cb(null, true);
  },
}).single("file");
