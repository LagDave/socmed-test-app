import { z } from "zod";
import { UserModel } from "../models/UserModel";
import { PostService } from "./PostService";
import { AppError } from "../utils/AppError";
import { toPublicUser, type PublicUser } from "../types/user";

const PROFILE_PICTURE_POST_BODY = "Updated profile picture.";
const COVER_PHOTO_POST_BODY = "Updated cover photo.";

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
  coverUrl: z.string().max(500).nullable().optional(),
});

export class ProfileService {
  static async getByUsername(username: string): Promise<PublicUser> {
    const row = await UserModel.findByUsername(username);
    if (!row || !row.username) throw new AppError("USER_NOT_FOUND", "User not found.");
    return toPublicUser(row);
  }

  static async updateMe(userId: string, raw: unknown): Promise<PublicUser> {
    const input = profilePatchSchema.parse(raw);
    const before = await UserModel.findById(userId);
    if (!before) throw new AppError("USER_NOT_FOUND", "User not found.");

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
      cover_url: string | null;
    }> = {};
    if (input.displayName !== undefined) patch.display_name = input.displayName;
    if (input.username !== undefined) patch.username = input.username;
    if (input.bio !== undefined) patch.bio = input.bio;
    if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
    if (input.coverUrl !== undefined) patch.cover_url = input.coverUrl;

    const row = await UserModel.updateProfile(userId, patch);
    if (!row) throw new AppError("USER_NOT_FOUND", "User not found.");

    if (
      input.avatarUrl !== undefined &&
      input.avatarUrl !== before.avatar_url &&
      input.avatarUrl
    ) {
      await PostService.createProfilePhotoPost(userId, PROFILE_PICTURE_POST_BODY, input.avatarUrl);
    }
    if (input.coverUrl !== undefined && input.coverUrl !== before.cover_url && input.coverUrl) {
      await PostService.createProfilePhotoPost(userId, COVER_PHOTO_POST_BODY, input.coverUrl);
    }

    return toPublicUser(row);
  }
}
