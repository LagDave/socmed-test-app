import { Router } from "express";
import { PostsController } from "../controllers/posts/PostsController";
import { CommentsController } from "../controllers/comments/CommentsController";
import { ReactionsController } from "../controllers/reactions/ReactionsController";
import { requireAuth } from "../middleware/requireAuth";

export const postsRouter = Router();

postsRouter.get("/feed", requireAuth, PostsController.feed);
postsRouter.post("/posts", requireAuth, PostsController.create);
postsRouter.post("/posts/:id/share", requireAuth, PostsController.share);
postsRouter.get("/posts/:id", requireAuth, PostsController.get);
postsRouter.delete("/posts/:id", requireAuth, PostsController.remove);

postsRouter.put("/posts/:id/reactions", requireAuth, ReactionsController.setOnPost);
postsRouter.delete("/posts/:id/reactions", requireAuth, ReactionsController.clearOnPost);

postsRouter.get("/posts/:postId/comments", requireAuth, CommentsController.list);
postsRouter.post("/posts/:postId/comments", requireAuth, CommentsController.create);
postsRouter.delete("/comments/:id", requireAuth, CommentsController.remove);

postsRouter.put("/comments/:id/reactions", requireAuth, ReactionsController.setOnComment);
postsRouter.delete("/comments/:id/reactions", requireAuth, ReactionsController.clearOnComment);
