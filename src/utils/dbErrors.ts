/** PostgreSQL unique_violation — https://www.postgresql.org/docs/current/errcodes-appendix.html */
const PG_UNIQUE_VIOLATION = "23505";

export function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  return code === PG_UNIQUE_VIOLATION;
}
