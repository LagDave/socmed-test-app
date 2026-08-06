import type { Response } from "express";
import { NotificationService } from "../../services/NotificationService";
import { ok, fail } from "../../utils/response";
import { AppError, statusForCode } from "../../utils/AppError";
import type { AuthedRequest } from "../../middleware/requireAuth";

function handle(res: Response, err: unknown): Response {
  if (err instanceof AppError) {
    return fail(res, statusForCode(err.code), err.code, err.message, err.details);
  }
  throw err;
}

export class NotificationsController {
  static async list(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const notifications = await NotificationService.list(req.userId!);
      return ok(res, { notifications });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async counts(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const counts = await NotificationService.counts(req.userId!);
      return ok(res, counts);
    } catch (err) {
      return handle(res, err);
    }
  }

  static async markOneRead(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      await NotificationService.markRead(req.userId!, String(req.params.id));
      return ok(res, { read: true });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async markFeedSeen(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      await NotificationService.markFeedSeen(req.userId!);
      return ok(res, { seen: true });
    } catch (err) {
      return handle(res, err);
    }
  }
}
