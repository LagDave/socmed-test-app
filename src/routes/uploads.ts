import { Router } from "express";
import { UploadsController } from "../controllers/uploads/UploadsController";
import { requireAuth } from "../middleware/requireAuth";
import { uploadImage } from "../middleware/uploadImage";

export const uploadsRouter = Router();

uploadsRouter.post("/uploads", requireAuth, uploadImage, UploadsController.upload);
