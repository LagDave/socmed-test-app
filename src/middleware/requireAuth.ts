import type { Request, Response, NextFunction } from "express";
import { SessionModel } from "../models/SessionModel";
import { fail } from "../utils/response";

export type AuthedRequest = Request & { userId?: string };

const COOKIE = "socmed_session";

export function sessionCookieName(): string {
  return COOKIE;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE] as string | undefined;
  if (!token) {
    return fail(res, 401, "AUTH_UNAUTHENTICATED", "Sign in required.");
  }
  const session = await SessionModel.findValidByToken(token);
  if (!session) {
    return fail(res, 401, "AUTH_UNAUTHENTICATED", "Session expired.");
  }
  req.userId = session.user_id;
  return next();
}

export function readSessionToken(req: Request): string | undefined {
  return req.cookies?.[COOKIE] as string | undefined;
}
