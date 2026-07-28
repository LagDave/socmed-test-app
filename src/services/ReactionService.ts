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
import { AppError } from "../utils/AppError";

export type { ReactionEmoji, ReactionSummary };
export { emptyReactionSummary, REACTION_EMOJIS };

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
}
