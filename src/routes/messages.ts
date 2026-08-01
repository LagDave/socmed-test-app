import { Router } from "express";
import { MessagesController } from "../controllers/messages/MessagesController";
import { requireAuth } from "../middleware/requireAuth";

export const messagesRouter = Router();

messagesRouter.get("/messages/conversations", requireAuth, MessagesController.listConversations);
messagesRouter.post("/messages/conversations", requireAuth, MessagesController.openConversation);
messagesRouter.get("/messages/unread-count", requireAuth, MessagesController.unreadCount);
messagesRouter.get("/messages/conversations/:id", requireAuth, MessagesController.listMessages);
messagesRouter.delete("/messages/conversations/:id", requireAuth, MessagesController.hideConversation);
messagesRouter.post("/messages/conversations/:id/messages", requireAuth, MessagesController.send);
messagesRouter.post("/messages/conversations/:id/read", requireAuth, MessagesController.markRead);
messagesRouter.delete("/messages/messages/:id", requireAuth, MessagesController.unsend);
messagesRouter.put("/messages/messages/:id/reaction", requireAuth, MessagesController.setReaction);
messagesRouter.delete(
  "/messages/messages/:id/reaction",
  requireAuth,
  MessagesController.clearReaction
);
