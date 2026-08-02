import { db } from "../database/connection";

export type CommentRow = {
  id: string;
  post_id: string;
  post_image_id: string | null;
  author_id: string;
  parent_id: string | null;
  body: string;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
};

export class CommentModel {
  static async create(input: {
    postId: string;
    authorId: string;
    body: string;
    imageUrl?: string | null;
    parentId?: string | null;
    postImageId?: string | null;
  }): Promise<CommentRow> {
    const [row] = await db<CommentRow>("comments")
      .insert({
        post_id: input.postId,
        post_image_id: input.postImageId ?? null,
        author_id: input.authorId,
        parent_id: input.parentId ?? null,
        body: input.body,
        image_url: input.imageUrl ?? null,
      })
      .returning("*");
    return row;
  }

  static async listByPost(postId: string): Promise<CommentRow[]> {
    return db<CommentRow>("comments").where({ post_id: postId }).orderBy("created_at", "asc");
  }

  static async countByPostIds(postIds: string[]): Promise<Map<string, Map<string, number>>> {
    const outer = new Map<string, Map<string, number>>();
    for (const postId of postIds) outer.set(postId, new Map());
    if (postIds.length === 0) return outer;

    const rows = await db("comments")
      .whereIn("post_id", postIds)
      .whereNotNull("post_image_id")
      .select("post_id", "post_image_id")
      .count("* as count")
      .groupBy("post_id", "post_image_id");

    for (const row of rows as Array<{
      post_id: string;
      post_image_id: string;
      count: string | number;
    }>) {
      const byImage = outer.get(row.post_id) ?? new Map<string, number>();
      byImage.set(row.post_image_id, Number(row.count));
      outer.set(row.post_id, byImage);
    }
    return outer;
  }

  static async findById(id: string): Promise<CommentRow | undefined> {
    return db<CommentRow>("comments").where({ id }).first();
  }

  static async deleteOwned(id: string, authorId: string): Promise<number> {
    return db("comments").where({ id, author_id: authorId }).del();
  }
}
