import { Router } from "express";
import { NotificationsController } from "../controllers/notifications/NotificationsController";
import { requireAuth } from "../middleware/requireAuth";

export const notificationsRouter = Router();

notificationsRouter.get("/notifications", requireAuth, NotificationsController.list);
notificationsRouter.get("/notifications/counts", requireAuth, NotificationsController.counts);
notificationsRouter.post("/notifications/read", requireAuth, NotificationsController.markRead);
notificationsRouter.post("/feed/seen", requireAuth, NotificationsController.markFeedSeen);
