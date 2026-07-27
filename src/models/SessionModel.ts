import { createHash, randomBytes } from "crypto";
import { db } from "../database/connection";

export type SessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
};

export class SessionModel {
  static hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  static createToken(): string {
    return randomBytes(32).toString("hex");
  }

  static async create(userId: string, ttlDays = 14): Promise<{ token: string; row: SessionRow }> {
    const token = SessionModel.createToken();
    const tokenHash = SessionModel.hashToken(token);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    const [row] = await db<SessionRow>("sessions")
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .returning("*");
    return { token, row };
  }

  static async findValidByToken(token: string): Promise<SessionRow | undefined> {
    const tokenHash = SessionModel.hashToken(token);
    return db<SessionRow>("sessions")
      .where({ token_hash: tokenHash })
      .andWhere("expires_at", ">", db.fn.now())
      .first();
  }

  static async deleteByToken(token: string): Promise<void> {
    const tokenHash = SessionModel.hashToken(token);
    await db("sessions").where({ token_hash: tokenHash }).del();
  }
}
