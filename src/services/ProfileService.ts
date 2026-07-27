import { z } from "zod";
import { UserModel } from "../models/UserModel";
import { AppError } from "../utils/AppError";
import { toPublicUser, type PublicUser } from "../types/user";

const profilePatchSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().max(500).nullable().optional(),
});

export class ProfileService {
  static async getByUsername(username: string): Promise<PublicUser> {
    const row = await UserModel.findByUsername(username);
    if (!row || !row.username) throw new AppError("USER_NOT_FOUND", "User not found.");
    return toPublicUser(row);
  }

  static async updateMe(userId: string, raw: unknown): Promise<PublicUser> {
    const input = profilePatchSchema.parse(raw);
    if (input.username) {
      const taken = await UserModel.findByUsername(input.username);
      if (taken && taken.id !== userId) {
        throw new AppError("PROFILE_CONFLICT", "Username already taken.");
      }
    }
    const patch: Partial<{
      display_name: string;
      username: string;
      bio: string | null;
      avatar_url: string | null;
    }> = {};
    if (input.displayName !== undefined) patch.display_name = input.displayName;
    if (input.username !== undefined) patch.username = input.username;
    if (input.bio !== undefined) patch.bio = input.bio;
    if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
    const row = await UserModel.updateProfile(userId, patch);
    if (!row) throw new AppError("USER_NOT_FOUND", "User not found.");
    return toPublicUser(row);
  }
}
