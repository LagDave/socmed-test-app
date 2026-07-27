import { Router } from "express";
import { PostsController } from "../controllers/posts/PostsController";
import { CommentsController } from "../controllers/comments/CommentsController";
import { requireAuth } from "../middleware/requireAuth";

export const postsRouter = Router();

postsRouter.get("/feed", requireAuth, PostsController.feed);
postsRouter.post("/posts", requireAuth, PostsController.create);
postsRouter.get("/posts/:id", requireAuth, PostsController.get);
postsRouter.delete("/posts/:id", requireAuth, PostsController.remove);

postsRouter.get("/posts/:postId/comments", requireAuth, CommentsController.list);
postsRouter.post("/posts/:postId/comments", requireAuth, CommentsController.create);
postsRouter.delete("/comments/:id", requireAuth, CommentsController.remove);
