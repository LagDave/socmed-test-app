import type { Response } from "express";
import { ZodError } from "zod";
import { PostService } from "../../services/PostService";
import { ok, fail } from "../../utils/response";
import { AppError, statusForCode } from "../../utils/AppError";
import type { AuthedRequest } from "../../middleware/requireAuth";

function handle(res: Response, err: unknown): Response {
  if (err instanceof ZodError) {
    return fail(res, 400, "POST_VALIDATION", "Invalid input.", err.flatten());
  }
  if (err instanceof AppError) {
    return fail(res, statusForCode(err.code), err.code, err.message, err.details);
  }
  throw err;
}

export class PostsController {
  static async create(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const post = await PostService.create(req.userId!, req.body);
      return ok(res, { post }, 201);
    } catch (err) {
      return handle(res, err);
    }
  }

  static async share(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const post = await PostService.share(req.userId!, String(req.params.id));
      return ok(res, { post }, 201);
    } catch (err) {
      return handle(res, err);
    }
  }

  static async get(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const post = await PostService.get(req.userId!, String(req.params.id));
      return ok(res, { post });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async remove(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      await PostService.delete(req.userId!, String(req.params.id));
      return ok(res, { deleted: true });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async feed(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const before = req.query.before ? new Date(String(req.query.before)) : undefined;
      const posts = await PostService.feed(req.userId!, 30, before);
      return ok(res, { posts });
    } catch (err) {
      return handle(res, err);
    }
  }
}
