import type { Knex } from "knex";
import { z } from "zod";
import { CommentModel } from "../models/CommentModel";
import type {
  ReactionNotificationInput,
  ReactionNotificationTarget,
} from "../models/NotificationModel";
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
import { NotificationService } from "./NotificationService";

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

async function saveReactionAndNotification(
  saveReaction: (trx: Knex.Transaction) => Promise<unknown>,
  notification: ReactionNotificationInput
) {
  return ReactionModel.withTransaction(async (trx) => {
    await saveReaction(trx);
    return NotificationService.upsertReaction(notification, trx);
  });
}

async function clearReactionAndNotification(
  clearReaction: (trx: Knex.Transaction) => Promise<number>,
  notification: ReactionNotificationTarget
): Promise<number> {
  return ReactionModel.withTransaction(async (trx) => {
    const deleted = await clearReaction(trx);
    if (!deleted) return 0;
    return NotificationService.removeReaction(notification, trx);
  });
}

async function findPostForImage(postId: string) {
  const post = await PostModel.findById(postId);
  if (!post) throw new AppError("POST_NOT_FOUND", "Post not found.");
  return post;
}

async function publishReactionNotification(
  recipientId: string,
  notification: Awaited<ReturnType<typeof NotificationService.upsertReaction>>
): Promise<void> {
  if (!notification) return;
  if (notification.created) {
    await NotificationService.publishCreated(recipientId, notification.notification.id);
    return;
  }
  await NotificationService.publishCountUpdated(recipientId);
}

export class ReactionService {
  static async setOnPost(userId: string, postId: string, raw: unknown): Promise<ReactionSummary> {
    const post = await PostModel.findById(postId);
    if (!post) throw new AppError("POST_NOT_FOUND", "Post not found.");
    const { emoji } = upsertSchema.parse(raw);
    const notification = await saveReactionAndNotification(
      (trx) => ReactionModel.upsertForPost(userId, postId, emoji, trx),
      {
        recipientId: post.author_id,
        actorId: userId,
        type: "reaction_on_post",
        postId,
        reactionEmoji: emoji,
      }
    );
    await publishReactionNotification(post.author_id, notification);
    return ReactionModel.summaryForPost(postId, userId);
  }

  static async clearOnPost(userId: string, postId: string): Promise<ReactionSummary> {
    const post = await PostModel.findById(postId);
    if (!post) throw new AppError("POST_NOT_FOUND", "Post not found.");
    const deletedNotification = await clearReactionAndNotification(
      (trx) => ReactionModel.deleteForPost(userId, postId, trx),
      { recipientId: post.author_id, actorId: userId, type: "reaction_on_post", postId }
    );
    if (deletedNotification) await NotificationService.publishCountUpdated(post.author_id);
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
    const notification = await saveReactionAndNotification(
      (trx) => ReactionModel.upsertForComment(userId, commentId, emoji, trx),
      {
        recipientId: comment.author_id,
        actorId: userId,
        type: "reaction_on_comment",
        postId: comment.post_id,
        commentId,
        reactionEmoji: emoji,
      }
    );
    await publishReactionNotification(comment.author_id, notification);
    return ReactionModel.summaryForComment(commentId, userId);
  }

  static async clearOnComment(userId: string, commentId: string): Promise<ReactionSummary> {
    const comment = await CommentModel.findById(commentId);
    if (!comment) throw new AppError("COMMENT_NOT_FOUND", "Comment not found.");
    const deletedNotification = await clearReactionAndNotification(
      (trx) => ReactionModel.deleteForComment(userId, commentId, trx),
      {
        recipientId: comment.author_id,
        actorId: userId,
        type: "reaction_on_comment",
        postId: comment.post_id,
        commentId,
      }
    );
    if (deletedNotification) await NotificationService.publishCountUpdated(comment.author_id);
    return ReactionModel.summaryForComment(commentId, userId);
  }

  static async setOnPostImage(
    userId: string,
    postImageId: string,
    raw: unknown
  ): Promise<ReactionSummary> {
    const image = await PostImageModel.findById(postImageId);
    if (!image) throw new AppError("POST_IMAGE_NOT_FOUND", "Photo not found.");
    const post = await findPostForImage(image.post_id);
    const { emoji } = upsertSchema.parse(raw);
    const notification = await saveReactionAndNotification(
      (trx) => ReactionModel.upsertForPostImage(userId, postImageId, emoji, trx),
      {
        recipientId: post.author_id,
        actorId: userId,
        type: "reaction_on_photo",
        postId: post.id,
        postImageId,
        reactionEmoji: emoji,
      }
    );
    await publishReactionNotification(post.author_id, notification);
    return ReactionModel.summaryForPostImage(postImageId, userId);
  }

  static async clearOnPostImage(userId: string, postImageId: string): Promise<ReactionSummary> {
    const image = await PostImageModel.findById(postImageId);
    if (!image) throw new AppError("POST_IMAGE_NOT_FOUND", "Photo not found.");
    const post = await findPostForImage(image.post_id);
    const deletedNotification = await clearReactionAndNotification(
      (trx) => ReactionModel.deleteForPostImage(userId, postImageId, trx),
      {
        recipientId: post.author_id,
        actorId: userId,
        type: "reaction_on_photo",
        postId: post.id,
        postImageId,
      }
    );
    if (deletedNotification) await NotificationService.publishCountUpdated(post.author_id);
    return ReactionModel.summaryForPostImage(postImageId, userId);
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

  static async listOnPostImage(postImageId: string, rawQuery: unknown): Promise<ReactionEntryView[]> {
    const image = await PostImageModel.findById(postImageId);
    if (!image) throw new AppError("POST_IMAGE_NOT_FOUND", "Photo not found.");
    return this.hydrateList(
      await ReactionModel.listForPostImage(postImageId, listQuerySchema.parse(rawQuery))
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
