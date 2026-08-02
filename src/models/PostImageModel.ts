import type { Knex } from "knex";
import { db } from "../database/connection";

export type PostImageRow = {
  id: string;
  post_id: string;
  url: string;
  sort_order: number;
  created_at: Date;
};

export class PostImageModel {
  static async insertMany(
    postId: string,
    urls: string[],
    trx?: Knex.Transaction
  ): Promise<void> {
    if (urls.length === 0) return;
    const conn = trx ?? db;
    try {
      await conn("post_images").insert(
        urls.map((url, sortOrder) => ({
          post_id: postId,
          url,
          sort_order: sortOrder,
        }))
      );
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "42P01") {
        throw new Error("post_images table is missing — run the post_images migration.");
      }
      throw err;
    }
  }

  static async listByPostIds(postIds: string[]): Promise<Map<string, PostImageRow[]>> {
    if (postIds.length === 0) return new Map();

    try {
      const rows = await db<PostImageRow>("post_images")
        .whereIn("post_id", postIds)
        .orderBy([
          { column: "post_id", order: "asc" },
          { column: "sort_order", order: "asc" },
        ]);

      const byPost = new Map<string, PostImageRow[]>();
      for (const row of rows) {
        const list = byPost.get(row.post_id);
        if (list) list.push(row);
        else byPost.set(row.post_id, [row]);
      }
      return byPost;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "42P01") return new Map();
      throw err;
    }
  }

  static async listUrlsByPostIds(postIds: string[]): Promise<Map<string, string[]>> {
    const byPost = await PostImageModel.listByPostIds(postIds);
    const urlsByPost = new Map<string, string[]>();
    for (const [postId, rows] of byPost) {
      urlsByPost.set(
        postId,
        rows.map((r) => r.url)
      );
    }
    return urlsByPost;
  }

  static async findById(id: string): Promise<PostImageRow | undefined> {
    try {
      return db<PostImageRow>("post_images").where({ id }).first();
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "42P01") return undefined;
      throw err;
    }
  }
}
