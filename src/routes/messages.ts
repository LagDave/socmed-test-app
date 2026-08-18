import { Router } from "express";
import { MessagesController } from "../controllers/messages/MessagesController";
import { requireAuth } from "../middleware/requireAuth";

export const messagesRouter = Router();

messagesRouter.get("/messages/conversations", requireAuth, MessagesController.listConversations);
messagesRouter.post("/messages/conversations", requireAuth, MessagesController.openConversation);
messagesRouter.get("/messages/unread-count", requireAuth, MessagesController.unreadCount);
messagesRouter.get(
  "/messages/conversations/:id/search",
  requireAuth,
  MessagesController.searchMessages
);
messagesRouter.get("/messages/conversations/:id", requireAuth, MessagesController.listMessages);
messagesRouter.delete("/messages/conversations/:id", requireAuth, MessagesController.hideConversation);
messagesRouter.put("/messages/conversations/:id/pin", requireAuth, MessagesController.pinConversation);
messagesRouter.delete("/messages/conversations/:id/pin", requireAuth, MessagesController.unpinConversation);
messagesRouter.get("/messages/conversations/:id/theme", requireAuth, MessagesController.getTheme);
messagesRouter.put("/messages/conversations/:id/theme", requireAuth, MessagesController.updateTheme);
messagesRouter.post("/messages/conversations/:id/messages", requireAuth, MessagesController.send);
messagesRouter.post("/messages/conversations/:id/read", requireAuth, MessagesController.markRead);
messagesRouter.delete("/messages/messages/:id", requireAuth, MessagesController.unsend);
messagesRouter.patch("/messages/messages/:id", requireAuth, MessagesController.edit);
messagesRouter.put("/messages/messages/:id/pin", requireAuth, MessagesController.pinMessage);
messagesRouter.delete("/messages/messages/:id/pin", requireAuth, MessagesController.unpinMessage);
messagesRouter.put("/messages/messages/:id/reaction", requireAuth, MessagesController.setReaction);
messagesRouter.delete(
  "/messages/messages/:id/reaction",
  requireAuth,
  MessagesController.clearReaction
);
