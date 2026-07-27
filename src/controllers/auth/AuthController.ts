import type { Response } from "express";
import { ZodError } from "zod";
import { AuthService } from "../../services/AuthService";
import { ok, fail } from "../../utils/response";
import { AppError, statusForCode } from "../../utils/AppError";
import type { AuthedRequest } from "../../middleware/requireAuth";
import { readSessionToken, sessionCookieName } from "../../middleware/requireAuth";

function setSessionCookie(res: Response, token: string) {
  res.cookie(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: 14 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function handle(res: Response, err: unknown): Response {
  if (err instanceof ZodError) {
    return fail(res, 400, "AUTH_VALIDATION", "Invalid input.", err.flatten());
  }
  if (err instanceof AppError) {
    return fail(res, statusForCode(err.code), err.code, err.message, err.details);
  }
  throw err;
}

export class AuthController {
  static async register(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const { user, token } = await AuthService.register(req.body);
      setSessionCookie(res, token);
      return ok(res, { user }, 201);
    } catch (err) {
      return handle(res, err);
    }
  }

  static async login(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const { user, token } = await AuthService.login(req.body);
      setSessionCookie(res, token);
      return ok(res, { user });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async logout(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      await AuthService.logout(readSessionToken(req));
      res.clearCookie(sessionCookieName(), { path: "/" });
      return ok(res, { loggedOut: true });
    } catch (err) {
      return handle(res, err);
    }
  }

  static async me(req: AuthedRequest, res: Response): Promise<Response> {
    try {
      const user = await AuthService.me(req.userId!);
      return ok(res, { user });
    } catch (err) {
      return handle(res, err);
    }
  }
}
