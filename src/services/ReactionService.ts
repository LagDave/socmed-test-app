import { z } from "zod";
import { CommentModel } from "../models/CommentModel";
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

export type ReactionEntryView = {
  user: ReturnType<typeof toPublicUser>;
  emoji: ReactionEmoji;
  createdAt: Date;
};

const upsertSchema = z.object({
  emoji: z.enum(REACTION_EMOJIS),
});

const listQuerySchema = z.object({
  emoji: z.enum(REACTION_EMOJIS).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
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

  static async listOnPost(postId: string, rawQuery: unknown): Promise<ReactionEntryView[]> {
    const post = await PostModel.findById(postId);
    if (!post) throw new AppError("POST_NOT_FOUND", "Post not found.");
    return this.hydrateList(await ReactionModel.listForPost(postId, listQuerySchema.parse(rawQuery)));
  }

  static async listOnComment(commentId: string, rawQuery: unknown): Promise<ReactionEntryView[]> {
    const comment = await CommentModel.findById(commentId);
    if (!comment) throw new AppError("COMMENT_NOT_FOUND", "Comment not found.");
    return this.hydrateList(
      await ReactionModel.listForComment(commentId, listQuerySchema.parse(rawQuery))
    );
  }

  private static async hydrateList(rows: Awaited<ReturnType<typeof ReactionModel.listForPost>>) {
    const userIds = [...new Set(rows.map((row) => row.user_id))];
    const users = await UserModel.findByIds(userIds);
    const userById = new Map(users.map((user) => [user.id, user]));

    return rows.flatMap((row) => {
      const user = userById.get(row.user_id);
      if (!user) return [];
      return [
        {
          user: toPublicUser(user),
          emoji: row.emoji,
          createdAt: row.created_at,
        },
      ];
    });
  }
}
