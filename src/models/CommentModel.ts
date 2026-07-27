import { db } from "../database/connection";

export type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
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
  }): Promise<CommentRow> {
    const [row] = await db<CommentRow>("comments")
      .insert({
        post_id: input.postId,
        author_id: input.authorId,
        body: input.body,
        image_url: input.imageUrl ?? null,
      })
      .returning("*");
    return row;
  }

  static async listByPost(postId: string): Promise<CommentRow[]> {
    return db<CommentRow>("comments").where({ post_id: postId }).orderBy("created_at", "asc");
  }

  static async findById(id: string): Promise<CommentRow | undefined> {
    return db<CommentRow>("comments").where({ id }).first();
  }

  static async deleteOwned(id: string, authorId: string): Promise<number> {
    return db("comments").where({ id, author_id: authorId }).del();
  }
}
