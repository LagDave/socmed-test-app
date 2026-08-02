import { z } from "zod";
import { CommentModel } from "../models/CommentModel";
import { PostImageModel } from "../models/PostImageModel";
import { PostModel } from "../models/PostModel";
import {
  REACTION_EMOJIS,
  ReactionModel,
  emptyReactionSummary,
  type ReactionEmoji,
  type ReactionSummary,
} from "../models/ReactionModel";
import { UserModel } from "../models/UserModel";
import { AppError } from "../utils/AppError";
import { toPublicUser } from "../types/user";

export type { ReactionEmoji, ReactionSummary };
export { emptyReactionSummary, REACTION_EMOJIS };

export type ReactionUserView = {
  emoji: ReactionEmoji;
  user: ReturnType<typeof toPublicUser>;
};

const upsertSchema = z.object({
  emoji: z.enum(REACTION_EMOJIS),
});

export class ReactionService {
  static async setOnPost(userId: string, postId: string, raw: unknown): Promise<ReactionSummary> {
    const post = await PostModel.findById(postId);
    if (!post) throw new AppError("POST_NOT_FOUND", "Post not found.");
    const { emoji } = upsertSchema.parse(raw);
    await ReactionModel.upsertForPost(userId, postId, emoji);
    return ReactionModel.summaryForPost(postId, userId);
  }

  static async clearOnPost(userId: string, postId: string): Promise<ReactionSummary> {
    const post = await PostModel.findById(postId);
    if (!post) throw new AppError("POST_NOT_FOUND", "Post not found.");
    await ReactionModel.deleteForPost(userId, postId);
    return ReactionModel.summaryForPost(postId, userId);
  }

  static async setOnComment(
    userId: string,
    commentId: string,
    raw: unknown
  ): Promise<ReactionSummary> {
    const comment = await CommentModel.findById(commentId);
    if (!comment) throw new AppError("COMMENT_NOT_FOUND", "Comment not found.");
    const { emoji } = upsertSchema.parse(raw);
    await ReactionModel.upsertForComment(userId, commentId, emoji);
    return ReactionModel.summaryForComment(commentId, userId);
  }

  static async clearOnComment(userId: string, commentId: string): Promise<ReactionSummary> {
    const comment = await CommentModel.findById(commentId);
    if (!comment) throw new AppError("COMMENT_NOT_FOUND", "Comment not found.");
    await ReactionModel.deleteForComment(userId, commentId);
    return ReactionModel.summaryForComment(commentId, userId);
  }

  static async setOnPostImage(
    userId: string,
    postImageId: string,
    raw: unknown
  ): Promise<ReactionSummary> {
    const image = await PostImageModel.findById(postImageId);
    if (!image) throw new AppError("POST_IMAGE_NOT_FOUND", "Photo not found.");
    const { emoji } = upsertSchema.parse(raw);
    await ReactionModel.upsertForPostImage(userId, postImageId, emoji);
    return ReactionModel.summaryForPostImage(postImageId, userId);
  }

  static async clearOnPostImage(userId: string, postImageId: string): Promise<ReactionSummary> {
    const image = await PostImageModel.findById(postImageId);
    if (!image) throw new AppError("POST_IMAGE_NOT_FOUND", "Photo not found.");
    await ReactionModel.deleteForPostImage(userId, postImageId);
    return ReactionModel.summaryForPostImage(postImageId, userId);
  }

  static async listUsersForPostImage(postImageId: string): Promise<ReactionUserView[]> {
    const image = await PostImageModel.findById(postImageId);
    if (!image) throw new AppError("POST_IMAGE_NOT_FOUND", "Photo not found.");
    const rows = await ReactionModel.listUsersForPostImage(postImageId);
    const users = await Promise.all(rows.map((row) => UserModel.findById(row.userId)));
    return rows.flatMap((row, i) => {
      const user = users[i];
      if (!user) return [];
      return [{ emoji: row.emoji, user: toPublicUser(user) }];
    });
  }
}
