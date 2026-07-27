import { z } from "zod";
import { CommentModel, type CommentRow } from "../models/CommentModel";
import { PostModel } from "../models/PostModel";
import { UserModel } from "../models/UserModel";
import { AppError } from "../utils/AppError";
import { toPublicUser } from "../types/user";

const createCommentSchema = z.object({
  body: z.string().min(1).max(2000),
  imageUrl: z.string().max(500).nullable().optional(),
});

export type CommentView = {
  id: string;
  postId: string;
  body: string;
  imageUrl: string | null;
  createdAt: Date;
  author: ReturnType<typeof toPublicUser>;
};

async function hydrate(rows: CommentRow[]): Promise<CommentView[]> {
  const authors = await Promise.all(rows.map((r) => UserModel.findById(r.author_id)));
  return rows.map((r, i) => {
    const author = authors[i];
    if (!author) throw new AppError("USER_NOT_FOUND", "Author missing.");
    return {
      id: r.id,
      postId: r.post_id,
      body: r.body,
      imageUrl: r.image_url,
      createdAt: r.created_at,
      author: toPublicUser(author),
    };
  });
}

export class CommentService {
  static async list(postId: string): Promise<CommentView[]> {
    const post = await PostModel.findById(postId);
    if (!post) throw new AppError("POST_NOT_FOUND", "Post not found.");
    const rows = await CommentModel.listByPost(postId);
    return hydrate(rows);
  }

  static async create(userId: string, postId: string, raw: unknown): Promise<CommentView> {
    const post = await PostModel.findById(postId);
    if (!post) throw new AppError("POST_NOT_FOUND", "Post not found.");
    const input = createCommentSchema.parse(raw);
    const row = await CommentModel.create({
      postId,
      authorId: userId,
      body: input.body,
      imageUrl: input.imageUrl,
    });
    return (await hydrate([row]))[0];
  }

  static async delete(userId: string, id: string): Promise<void> {
    const n = await CommentModel.deleteOwned(id, userId);
    if (!n) throw new AppError("COMMENT_NOT_FOUND", "Comment not found or not owned.");
  }
}
