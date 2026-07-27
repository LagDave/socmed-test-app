import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserModel } from "../models/UserModel";
import { SessionModel } from "../models/SessionModel";
import { AppError } from "../utils/AppError";
import { toPublicUser, type PublicUser } from "../types/user";

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(100),
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthService {
  static async register(raw: unknown): Promise<{ user: PublicUser; token: string }> {
    const input = registerSchema.parse(raw);
    const existing = await UserModel.findByEmail(input.email);
    if (existing) {
      throw new AppError("AUTH_CONFLICT", "Email already registered.");
    }
    if (input.username) {
      const taken = await UserModel.findByUsername(input.username);
      if (taken) throw new AppError("AUTH_CONFLICT", "Username already taken.");
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const row = await UserModel.create({
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      username: input.username ?? null,
    });
    const { token } = await SessionModel.create(row.id);
    return { user: toPublicUser(row), token };
  }

  static async login(raw: unknown): Promise<{ user: PublicUser; token: string }> {
    const input = loginSchema.parse(raw);
    const row = await UserModel.findByEmail(input.email);
    if (!row) throw new AppError("AUTH_UNAUTHENTICATED", "Invalid email or password.");
    const ok = await bcrypt.compare(input.password, row.password_hash);
    if (!ok) throw new AppError("AUTH_UNAUTHENTICATED", "Invalid email or password.");
    const { token } = await SessionModel.create(row.id);
    return { user: toPublicUser(row), token };
  }

  static async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    await SessionModel.deleteByToken(token);
  }

  static async me(userId: string): Promise<PublicUser> {
    const row = await UserModel.findById(userId);
    if (!row) throw new AppError("AUTH_UNAUTHENTICATED", "Session user missing.");
    return toPublicUser(row);
  }
}
