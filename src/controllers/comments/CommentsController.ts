import type { Response } from "express";
import { ZodError } from "zod";
import { CommentService } from "../../services/CommentService";
import { ok, fail } from "../../utils/response";
import { AppError, statusForCode } from "../../utils/AppError";
import type { AuthedRequest } from "../../middleware/requireAuth";

function handle(res: Response, err: unknown): Response {
  if (err instanceof ZodError) {
    return fail(res, 400, "COMMENT_VALIDATION", "Invalid input.", err.flatten());
  }
  if (err instanceof AppError) {
    return fail(res, statusForCode(err.code), err.code, err.message, err.details);
  }
  throw err;
}

export class CommentsController {
  static async list(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const comments = await CommentService.list(String(req.params.postId));
      return ok(res, { comments });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async create(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const comment = await CommentService.create(req.userId!, String(req.params.postId), req.body);
      return ok(res, { comment }, 201);
    } catch (err) {
      return handle(res, err);
    }
  }

  static async remove(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      await CommentService.delete(req.userId!, String(req.params.id));
      return ok(res, { deleted: true });
    } catch (err) {
      return handle(res, err);
    }
  }
}
