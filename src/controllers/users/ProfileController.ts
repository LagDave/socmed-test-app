import type { Response } from "express";
import { ZodError } from "zod";
import { ProfileService } from "../../services/ProfileService";
import { PostService } from "../../services/PostService";
import { ok, fail } from "../../utils/response";
import { AppError, statusForCode } from "../../utils/AppError";
import type { AuthedRequest } from "../../middleware/requireAuth";

function handle(res: Response, err: unknown): Response {
  if (err instanceof ZodError) {
    return fail(res, 400, "PROFILE_VALIDATION", "Invalid input.", err.flatten());
  }
  if (err instanceof AppError) {
    return fail(res, statusForCode(err.code), err.code, err.message, err.details);
  }
  throw err;
}

export class ProfileController {
  static async getByUsername(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const user = await ProfileService.getByUsername(String(req.params.username));
      return ok(res, { user });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async updateMe(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const user = await ProfileService.updateMe(req.userId!, req.body);
      return ok(res, { user });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async listPostsByUsername(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const before = req.query.before ? new Date(String(req.query.before)) : undefined;
      const posts = await PostService.listByUsername(req.userId!, String(req.params.username), 30, before);
      return ok(res, { posts });
    } catch (err) {
      return handle(res, err);
    }
  }
}
