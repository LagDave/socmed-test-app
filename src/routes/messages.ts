import { Router } from "express";
import { MessagesController } from "../controllers/messages/MessagesController";
import { requireAuth } from "../middleware/requireAuth";

export const messagesRouter = Router();

messagesRouter.get("/messages/conversations", requireAuth, MessagesController.listConversations);
messagesRouter.post("/messages/conversations", requireAuth, MessagesController.openConversation);
messagesRouter.get("/messages/unread-count", requireAuth, MessagesController.unreadCount);
messagesRouter.get("/messages/conversations/:id", requireAuth, MessagesController.listMessages);
messagesRouter.post("/messages/conversations/:id/messages", requireAuth, MessagesController.send);
messagesRouter.post("/messages/conversations/:id/read", requireAuth, MessagesController.markRead);
messagesRouter.delete("/messages/messages/:id", requireAuth, MessagesController.unsend);
messagesRouter.patch("/messages/messages/:id", requireAuth, MessagesController.edit);
messagesRouter.put("/messages/messages/:id/reaction", requireAuth, MessagesController.setReaction);
messagesRouter.delete(
  "/messages/messages/:id/reaction",
  requireAuth,
  MessagesController.clearReaction
);
