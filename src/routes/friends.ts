import { Router } from "express";
import { FriendsController } from "../controllers/friends/FriendsController";
import { requireAuth } from "../middleware/requireAuth";

export const friendsRouter = Router();

friendsRouter.post("/friends/request", requireAuth, FriendsController.request);
friendsRouter.post("/friends/:id/accept", requireAuth, FriendsController.accept);
friendsRouter.post("/friends/:id/decline", requireAuth, FriendsController.decline);
friendsRouter.delete("/friends/user/:userId", requireAuth, FriendsController.unfriend);
friendsRouter.delete("/friends/:id", requireAuth, FriendsController.cancel);
friendsRouter.get("/friends/mutuals", requireAuth, FriendsController.mutuals);
friendsRouter.get("/friends/suggestions", requireAuth, FriendsController.suggestions);
friendsRouter.get("/friends/inbox", requireAuth, FriendsController.inbox);
friendsRouter.get("/friends/status/:userId", requireAuth, FriendsController.status);
