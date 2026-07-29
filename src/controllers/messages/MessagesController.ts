import type { Response } from "express";
import { MessageService } from "../../services/MessageService";
import { ok, fail } from "../../utils/response";
import { AppError, statusForCode } from "../../utils/AppError";
import type { AuthedRequest } from "../../middleware/requireAuth";
import { ZodError } from "zod";

function handle(res: Response, err: unknown): Response {
  if (err instanceof ZodError) {
    return fail(res, 400, "MESSAGE_VALIDATION", "Invalid message payload.", {
      issues: err.issues,
    });
  }
  if (err instanceof AppError) {
    return fail(res, statusForCode(err.code), err.code, err.message, err.details);
  }
  throw err;
}

export class MessagesController {
  static async listConversations(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const conversations = await MessageService.listConversations(req.userId!);
      return ok(res, { conversations });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async openConversation(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const conversation = await MessageService.openConversation(req.userId!, req.body);
      return ok(res, { conversation }, 201);
    } catch (err) {
      return handle(res, err);
    }
  }

  static async listMessages(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const before = typeof req.query.before === "string" ? req.query.before : undefined;
      const data = await MessageService.listMessages(
        req.userId!,
        String(req.params.id),
        before
      );
      return ok(res, data);
    } catch (err) {
      return handle(res, err);
    }
  }

  static async send(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const message = await MessageService.send(req.userId!, String(req.params.id), req.body);
      return ok(res, { message }, 201);
    } catch (err) {
      return handle(res, err);
    }
  }

  static async markRead(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const data = await MessageService.markRead(req.userId!, String(req.params.id));
      return ok(res, data);
    } catch (err) {
      return handle(res, err);
    }
  }

  static async unsend(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const message = await MessageService.unsend(req.userId!, String(req.params.id));
      return ok(res, { message });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async setReaction(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const message = await MessageService.setReaction(
        req.userId!,
        String(req.params.id),
        req.body
      );
      return ok(res, { message });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async clearReaction(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const message = await MessageService.clearReaction(req.userId!, String(req.params.id));
      return ok(res, { message });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async unreadCount(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const data = await MessageService.unreadCount(req.userId!);
      return ok(res, data);
    } catch (err) {
      return handle(res, err);
    }
  }
}
