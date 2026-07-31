import type { Response } from "express";
import { FriendshipService } from "../../services/FriendshipService";
import { ok, fail } from "../../utils/response";
import { AppError, statusForCode } from "../../utils/AppError";
import type { AuthedRequest } from "../../middleware/requireAuth";

function handle(res: Response, err: unknown): Response {
  if (err instanceof AppError) {
    return fail(res, statusForCode(err.code), err.code, err.message, err.details);
  }
  throw err;
}

export class FriendsController {
  static async request(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const result = await FriendshipService.request(req.userId!, String(req.body.username || ""));
      return ok(res, result, 201);
    } catch (err) {
      return handle(res, err);
    }
  }

  static async accept(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const row = await FriendshipService.accept(req.userId!, String(req.params.id));
      return ok(res, { friendship: row });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async decline(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const row = await FriendshipService.decline(req.userId!, String(req.params.id));
      return ok(res, { friendship: row });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async cancel(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      await FriendshipService.cancel(req.userId!, String(req.params.id));
      return ok(res, { cancelled: true });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async unfriend(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      await FriendshipService.unfriend(req.userId!, String(req.params.userId));
      return ok(res, { unfriended: true });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async mutuals(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const users = await FriendshipService.mutuals(req.userId!);
      return ok(res, { users });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async status(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const data = await FriendshipService.areFriendsWith(req.userId!, String(req.params.userId));
      return ok(res, data);
    } catch (err) {
      return handle(res, err);
    }
  }

  static async inbox(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const data = await FriendshipService.inbox(req.userId!);
      return ok(res, data);
    } catch (err) {
      return handle(res, err);
    }
  }
}
