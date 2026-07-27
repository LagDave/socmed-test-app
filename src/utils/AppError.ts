export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details: Record<string, unknown> | null = null
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function statusForCode(code: string): number {
  if (code.includes("NOT_FOUND")) return 404;
  if (code.includes("UNAUTHORIZED") || code.includes("UNAUTHENTICATED")) return 401;
  if (code.includes("FORBIDDEN") || code.includes("ACCESS_DENIED")) return 403;
  if (code.includes("CONFLICT")) return 409;
  if (code.includes("VALIDATION")) return 400;
  return 400;
}
