import { Router } from "express";
import { ProfileController } from "../controllers/users/ProfileController";
import { requireAuth } from "../middleware/requireAuth";

export const usersRouter = Router();

usersRouter.get("/users/:username/posts", requireAuth, ProfileController.listPostsByUsername);
usersRouter.get("/users/:username", requireAuth, ProfileController.getByUsername);
usersRouter.patch("/me/profile", requireAuth, ProfileController.updateMe);
