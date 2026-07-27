import { Router } from "express";
import { HealthController } from "../controllers/health/HealthController";

export const healthRouter = Router();

healthRouter.get("/health", HealthController.getHealth);
