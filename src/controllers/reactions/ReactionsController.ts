import type { Response } from "express";
import { ZodError } from "zod";
import { ReactionService } from "../../services/ReactionService";
import { ok, fail } from "../../utils/response";
import { AppError, statusForCode } from "../../utils/AppError";
import type { AuthedRequest } from "../../middleware/requireAuth";

function handle(res: Response, err: unknown): Response {
  if (err instanceof ZodError) {
    return fail(res, 400, "REACTION_VALIDATION", "Invalid input.", err.flatten());
  }
  if (err instanceof AppError) {
    return fail(res, statusForCode(err.code), err.code, err.message, err.details);
  }
  throw err;
}

export class ReactionsController {
  static async setOnPost(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const reactionSummary = await ReactionService.setOnPost(
        req.userId!,
        String(req.params.id),
        req.body
      );
      return ok(res, { reactionSummary });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async clearOnPost(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const reactionSummary = await ReactionService.clearOnPost(
        req.userId!,
        String(req.params.id)
      );
      return ok(res, { reactionSummary });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async setOnComment(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const reactionSummary = await ReactionService.setOnComment(
        req.userId!,
        String(req.params.id),
        req.body
      );
      return ok(res, { reactionSummary });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async clearOnComment(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const reactionSummary = await ReactionService.clearOnComment(
        req.userId!,
        String(req.params.id)
      );
      return ok(res, { reactionSummary });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async listOnPost(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const reactions = await ReactionService.listOnPost(String(req.params.id), req.query);
      return ok(res, { reactions });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async listOnComment(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const reactions = await ReactionService.listOnComment(String(req.params.id), req.query);
      return ok(res, { reactions });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async setOnPostImage(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const reactionSummary = await ReactionService.setOnPostImage(
        req.userId!,
        String(req.params.id),
        req.body
      );
      return ok(res, { reactionSummary });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async clearOnPostImage(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const reactionSummary = await ReactionService.clearOnPostImage(
        req.userId!,
        String(req.params.id)
      );
      return ok(res, { reactionSummary });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async listOnPostImage(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const reactions = await ReactionService.listOnPostImage(String(req.params.id), req.query);
      return ok(res, { reactions });
    } catch (err) {
      return handle(res, err);
    }
  }
}
