import { db } from "../database/connection";

export const REACTION_EMOJIS = ["like", "heart", "haha", "wow"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export type ReactionRow = {
  id: string;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
  post_image_id: string | null;
  emoji: ReactionEmoji;
  created_at: Date;
  updated_at: Date;
};

export type ReactionCounts = Record<ReactionEmoji, number>;

export type ReactionSummary = {
  counts: ReactionCounts;
  viewerEmoji: ReactionEmoji | null;
};

export type ReactionUserRow = {
  userId: string;
  emoji: ReactionEmoji;
};

export function emptyReactionSummary(): ReactionSummary {
  return {
    counts: { like: 0, heart: 0, haha: 0, wow: 0 },
    viewerEmoji: null,
  };
}

type AggregateRow = {
  target_id: string;
  emoji: ReactionEmoji;
  count: string | number;
};

export class ReactionModel {
  static async upsertForPost(
    userId: string,
    postId: string,
    emoji: ReactionEmoji
  ): Promise<ReactionRow> {
    const [row] = await db<ReactionRow>("reactions")
      .insert({ user_id: userId, post_id: postId, comment_id: null, post_image_id: null, emoji })
      .onConflict(db.raw("(user_id, post_id) WHERE post_id IS NOT NULL"))
      .merge({ emoji, updated_at: db.fn.now() })
      .returning("*");
    return row;
  }

  static async upsertForComment(
    userId: string,
    commentId: string,
    emoji: ReactionEmoji
  ): Promise<ReactionRow> {
    const [row] = await db<ReactionRow>("reactions")
      .insert({ user_id: userId, post_id: null, comment_id: commentId, post_image_id: null, emoji })
      .onConflict(db.raw("(user_id, comment_id) WHERE comment_id IS NOT NULL"))
      .merge({ emoji, updated_at: db.fn.now() })
      .returning("*");
    return row;
  }

  static async upsertForPostImage(
    userId: string,
    postImageId: string,
    emoji: ReactionEmoji
  ): Promise<ReactionRow> {
    const [row] = await db<ReactionRow>("reactions")
      .insert({
        user_id: userId,
        post_id: null,
        comment_id: null,
        post_image_id: postImageId,
        emoji,
      })
      .onConflict(db.raw("(user_id, post_image_id) WHERE post_image_id IS NOT NULL"))
      .merge({ emoji, updated_at: db.fn.now() })
      .returning("*");
    return row;
  }

  static async deleteForPost(userId: string, postId: string): Promise<number> {
    return db("reactions").where({ user_id: userId, post_id: postId }).del();
  }

  static async deleteForComment(userId: string, commentId: string): Promise<number> {
    return db("reactions").where({ user_id: userId, comment_id: commentId }).del();
  }

  static async deleteForPostImage(userId: string, postImageId: string): Promise<number> {
    return db("reactions").where({ user_id: userId, post_image_id: postImageId }).del();
  }

  static async summariesForPosts(
    postIds: string[],
    viewerId: string
  ): Promise<Map<string, ReactionSummary>> {
    return this.summaries("post_id", postIds, viewerId);
  }

  static async summariesForComments(
    commentIds: string[],
    viewerId: string
  ): Promise<Map<string, ReactionSummary>> {
    return this.summaries("comment_id", commentIds, viewerId);
  }

  static async summariesForPostImages(
    postImageIds: string[],
    viewerId: string
  ): Promise<Map<string, ReactionSummary>> {
    return this.summaries("post_image_id", postImageIds, viewerId);
  }

  private static async summaries(
    column: "post_id" | "comment_id" | "post_image_id",
    ids: string[],
    viewerId: string
  ): Promise<Map<string, ReactionSummary>> {
    const map = new Map<string, ReactionSummary>();
    for (const id of ids) map.set(id, emptyReactionSummary());
    if (ids.length === 0) return map;

    const aggregates = await db("reactions")
      .whereIn(column, ids)
      .select(db.raw(`${column} as target_id`), "emoji")
      .count("* as count")
      .groupBy(column, "emoji");

    for (const row of aggregates as AggregateRow[]) {
      const summary = map.get(row.target_id) ?? emptyReactionSummary();
      const emoji = row.emoji;
      if (emoji in summary.counts) {
        summary.counts[emoji] = Number(row.count);
      }
      map.set(row.target_id, summary);
    }

    const viewerRows = await db<ReactionRow>("reactions")
      .whereIn(column, ids)
      .andWhere({ user_id: viewerId })
      .select(column, "emoji");

    for (const row of viewerRows) {
      const targetId = row[column];
      if (!targetId) continue;
      const summary = map.get(targetId) ?? emptyReactionSummary();
      summary.viewerEmoji = row.emoji;
      map.set(targetId, summary);
    }

    return map;
  }

  static async summaryForPost(postId: string, viewerId: string): Promise<ReactionSummary> {
    const map = await this.summariesForPosts([postId], viewerId);
    return map.get(postId) ?? emptyReactionSummary();
  }

  static async summaryForComment(commentId: string, viewerId: string): Promise<ReactionSummary> {
    const map = await this.summariesForComments([commentId], viewerId);
    return map.get(commentId) ?? emptyReactionSummary();
  }

  static async summaryForPostImage(postImageId: string, viewerId: string): Promise<ReactionSummary> {
    const map = await this.summariesForPostImages([postImageId], viewerId);
    return map.get(postImageId) ?? emptyReactionSummary();
  }

  static async listForPost(
    postId: string,
    options: { emoji?: ReactionEmoji; limit?: number } = {}
  ): Promise<ReactionRow[]> {
    return this.listForTarget("post_id", postId, options);
  }

  static async listForComment(
    commentId: string,
    options: { emoji?: ReactionEmoji; limit?: number } = {}
  ): Promise<ReactionRow[]> {
    return this.listForTarget("comment_id", commentId, options);
  }

  static async listUsersForPostImage(postImageId: string): Promise<ReactionUserRow[]> {
    const rows = await db<ReactionRow>("reactions")
      .where({ post_image_id: postImageId })
      .select("user_id", "emoji")
      .orderBy("created_at", "asc");
    return rows.map((row) => ({ userId: row.user_id, emoji: row.emoji }));
  }

  private static async listForTarget(
    column: "post_id" | "comment_id",
    targetId: string,
    options: { emoji?: ReactionEmoji; limit?: number }
  ): Promise<ReactionRow[]> {
    const limit = options.limit ?? 50;
    let query = db<ReactionRow>("reactions")
      .where({ [column]: targetId })
      .orderBy("created_at", "desc")
      .limit(limit);

    if (options.emoji) {
      query = query.andWhere({ emoji: options.emoji });
    }

    return query;
  }
}
