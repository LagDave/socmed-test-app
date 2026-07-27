import { z } from "zod";
import { PostModel, type PostRow } from "../models/PostModel";
import { FriendshipModel } from "../models/FriendshipModel";
import { UserModel } from "../models/UserModel";
import { AppError } from "../utils/AppError";
import { toPublicUser } from "../types/user";

const createPostSchema = z.object({
  body: z.string().min(1).max(5000),
  imageUrl: z.string().max(500).nullable().optional(),
});

export type PostView = {
  id: string;
  body: string;
  imageUrl: string | null;
  createdAt: Date;
  author: ReturnType<typeof toPublicUser>;
};

async function hydrate(posts: PostRow[]): Promise<PostView[]> {
  const authors = await Promise.all(posts.map((p) => UserModel.findById(p.author_id)));
  return posts.map((p, i) => {
    const author = authors[i];
    if (!author) throw new AppError("USER_NOT_FOUND", "Author missing.");
    return {
      id: p.id,
      body: p.body,
      imageUrl: p.image_url,
      createdAt: p.created_at,
      author: toPublicUser(author),
    };
  });
}

export class PostService {
  static async create(userId: string, raw: unknown): Promise<PostView> {
    const input = createPostSchema.parse(raw);
    const row = await PostModel.create({
      authorId: userId,
      body: input.body,
      imageUrl: input.imageUrl,
    });
    return (await hydrate([row]))[0];
  }

  static async get(id: string): Promise<PostView> {
    const row = await PostModel.findById(id);
    if (!row) throw new AppError("POST_NOT_FOUND", "Post not found.");
    return (await hydrate([row]))[0];
  }

  static async delete(userId: string, id: string): Promise<void> {
    const n = await PostModel.deleteOwned(id, userId);
    if (!n) throw new AppError("POST_NOT_FOUND", "Post not found or not owned.");
  }

  static async feed(userId: string, limit = 30, before?: Date): Promise<PostView[]> {
    const mutualIds = await FriendshipModel.listAcceptedMutualIds(userId);
    const authorIds = [userId, ...mutualIds];
    const rows = await PostModel.listFeed({ authorIds, limit, before });
    return hydrate(rows);
  }
}
