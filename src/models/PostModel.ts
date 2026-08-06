import type { Knex } from "knex";
import { db } from "../database/connection";
import { PostImageModel } from "./PostImageModel";

export type PostRow = {
  id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  shared_from_post_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export class PostModel {
  static async create(input: {
    authorId: string;
    body: string;
    imageUrl?: string | null;
    imageUrls?: string[] | null;
    sharedFromPostId?: string | null;
  }): Promise<PostRow> {
    const urls = input.imageUrls ?? (input.imageUrl ? [input.imageUrl] : []);

    return db.transaction(async (trx) => {
      const [row] = await trx<PostRow>("posts")
        .insert({
          author_id: input.authorId,
          body: input.body,
          image_url: urls[0] ?? null,
          shared_from_post_id: input.sharedFromPostId ?? null,
        })
        .returning("*");

      if (urls.length > 0) {
        await PostImageModel.insertMany(row.id, urls, trx);
      }

      return row;
    });
  }

  static async findById(id: string): Promise<PostRow | undefined> {
    return db<PostRow>("posts").where({ id }).first();
  }

  static async findByIds(ids: string[]): Promise<PostRow[]> {
    if (ids.length === 0) return [];
    return db<PostRow>("posts").whereIn("id", ids);
  }

  static async deleteOwned(id: string, authorId: string): Promise<number> {
    return db("posts").where({ id, author_id: authorId }).del();
  }

  static async listFeed(opts: {
    authorIds?: string[];
    limit: number;
    before?: Date;
  }): Promise<PostRow[]> {
    let q = db<PostRow>("posts").orderBy("created_at", "desc").limit(opts.limit);
    if (opts.authorIds) {
      if (opts.authorIds.length === 0) return [];
      q = q.whereIn("author_id", opts.authorIds);
    }
    if (opts.before) {
      q = q.andWhere("created_at", "<", opts.before);
    }
    return q;
  }

  static async countSharesBySourcePostIds(postIds: string[]): Promise<Map<string, number>> {
    const counts = new Map(postIds.map((postId) => [postId, 0]));
    if (postIds.length === 0) return counts;

    const rows = await db("posts")
      .whereIn("shared_from_post_id", postIds)
      .select("shared_from_post_id")
      .count("* as count")
      .groupBy("shared_from_post_id");

    for (const row of rows as Array<{
      shared_from_post_id: string;
      count: string | number;
    }>) {
      counts.set(row.shared_from_post_id, Number(row.count));
    }
    return counts;
  }

  static async countByAuthorsSince(authorIds: string[], since: Date): Promise<number> {
    if (authorIds.length === 0) return 0;
    const row = await db("posts")
      .whereIn("author_id", authorIds)
      .andWhere("created_at", ">", since)
      .count<{ count: string }>("id as count")
      .first();
    return Number(row?.count || 0);
  }

  static async withTransaction<T>(fn: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
    return db.transaction(fn);
  }
}
