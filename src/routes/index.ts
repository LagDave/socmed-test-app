import { Router } from "express";
import { healthRouter } from "./health";
import { authRouter } from "./auth";
import { usersRouter } from "./users";
import { postsRouter } from "./posts";
import { friendsRouter } from "./friends";
import { uploadsRouter } from "./uploads";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use(usersRouter);
apiRouter.use(postsRouter);
apiRouter.use(friendsRouter);
apiRouter.use(uploadsRouter);
