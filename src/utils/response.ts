import type { Response } from "express";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  error: null;
};

export type ApiError = {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details: unknown;
  };
};

export function ok<T>(res: Response, data: T, status = 200): Response {
  const body: ApiSuccess<T> = { success: true, data, error: null };
  return res.status(status).json(body);
}

export function fail(
  res: Response,
  status: number,
  code: string,
  message: string,
  details: unknown = null
): Response {
  const body: ApiError = {
    success: false,
    data: null,
    error: { code, message, details },
  };
  return res.status(status).json(body);
}
