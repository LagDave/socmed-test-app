import { z } from "zod";
import { PostModel, type PostRow } from "../models/PostModel";
import { FriendshipModel } from "../models/FriendshipModel";
import { UserModel } from "../models/UserModel";
import { ReactionModel, emptyReactionSummary, type ReactionSummary } from "../models/ReactionModel";
import { AppError } from "../utils/AppError";
import { resolvePostImageUrls } from "../utils/postImages";
import { toPublicUser } from "../types/user";

const UPLOAD_PATH_RE = /^\/uploads\/[A-Za-z0-9._-]+$/;
const MAX_POST_IMAGES = 10;

const createPostSchema = z
  .object({
    body: z.string().min(1).max(5000),
    imageUrl: z.string().max(500).nullable().optional(),
    imageUrls: z.array(z.string().max(500)).max(MAX_POST_IMAGES).optional(),
  })
  .superRefine((value, ctx) => {
    const urls =
      value.imageUrls ?? (value.imageUrl ? [value.imageUrl] : []);
    for (const url of urls) {
      if (!UPLOAD_PATH_RE.test(url)) {
        ctx.addIssue({ code: "custom", message: "Invalid image URL", path: ["imageUrls"] });
      }
    }
  });

const sharePostSchema = z.object({
  body: z.string().max(5000).optional(),
});

export type PostView = {
  id: string;
  body: string;
  imageUrl: string | null;
  imageUrls: string[];
  createdAt: Date;
  author: ReturnType<typeof toPublicUser>;
  reactionSummary: ReactionSummary;
  sharedFromPostId: string | null;
  sharedFrom: PostView | null;
};

async function hydrateBase(posts: PostRow[], viewerId: string): Promise<PostView[]> {
  const authors = await Promise.all(posts.map((p) => UserModel.findById(p.author_id)));
  const summaries = await ReactionModel.summariesForPosts(
    posts.map((p) => p.id),
    viewerId
  );
  return posts.map((p, i) => {
    const author = authors[i];
    if (!author) throw new AppError("USER_NOT_FOUND", "Author missing.");
    const imageUrls = resolvePostImageUrls(p);
    return {
      id: p.id,
      body: p.body,
      imageUrl: imageUrls[0] ?? null,
      imageUrls,
      createdAt: p.created_at,
      author: toPublicUser(author),
      reactionSummary: summaries.get(p.id) ?? emptyReactionSummary(),
      sharedFromPostId: p.shared_from_post_id,
      sharedFrom: null,
    };
  });
}

async function hydrate(posts: PostRow[], viewerId: string): Promise<PostView[]> {
  const views = await hydrateBase(posts, viewerId);
  const sharedIds = [
    ...new Set(posts.map((p) => p.shared_from_post_id).filter((id): id is string => Boolean(id))),
  ];
  if (sharedIds.length === 0) return views;

  const originals = await PostModel.findByIds(sharedIds);
  const originalViews = await hydrateBase(originals, viewerId);
  const byId = new Map(originalViews.map((v) => [v.id, v]));

  return views.map((view) => {
    if (!view.sharedFromPostId) return view;
    return {
      ...view,
      sharedFrom: byId.get(view.sharedFromPostId) ?? null,
    };
  });
}

export class PostService {
  static async create(userId: string, raw: unknown): Promise<PostView> {
    const input = createPostSchema.parse(raw);
    const imageUrls =
      input.imageUrls ?? (input.imageUrl ? [input.imageUrl] : []);
    const row = await PostModel.create({
      authorId: userId,
      body: input.body,
      imageUrls,
    });
    return (await hydrate([row], userId))[0];
  }

  static async share(viewerId: string, postId: string, raw?: unknown): Promise<PostView> {
    const input = sharePostSchema.parse(raw ?? {});
    const caption = input.body?.trim() ?? "";

    const original = await PostModel.findById(postId);
    if (!original) throw new AppError("POST_NOT_FOUND", "Post not found.");
    if (original.shared_from_post_id) {
      throw new AppError("SHARE_FORBIDDEN", "Cannot share a shared post.");
    }
    if (original.author_id === viewerId) {
      throw new AppError("SHARE_FORBIDDEN", "Cannot share your own post.");
    }
    const friends = await FriendshipModel.areFriends(viewerId, original.author_id);
    if (!friends) {
      throw new AppError("SHARE_FORBIDDEN", "You can only share a mutual friend's post.");
    }

    const row = await PostModel.create({
      authorId: viewerId,
      body: caption,
      imageUrl: null,
      sharedFromPostId: original.id,
    });
    return (await hydrate([row], viewerId))[0];
  }

  static async get(viewerId: string, id: string): Promise<PostView> {
    const row = await PostModel.findById(id);
    if (!row) throw new AppError("POST_NOT_FOUND", "Post not found.");
    return (await hydrate([row], viewerId))[0];
  }

  static async delete(userId: string, id: string): Promise<void> {
    const n = await PostModel.deleteOwned(id, userId);
    if (!n) throw new AppError("POST_NOT_FOUND", "Post not found or not owned.");
  }

  static async createProfilePhotoPost(userId: string, body: string, imageUrl: string): Promise<void> {
    await PostModel.create({
      authorId: userId,
      body,
      imageUrl,
    });
  }

  static async feed(userId: string, limit = 30, before?: Date): Promise<PostView[]> {
    const mutualIds = await FriendshipModel.listAcceptedMutualIds(userId);
    const authorIds = [userId, ...mutualIds];
    const rows = await PostModel.listFeed({ authorIds, limit, before });
    return hydrate(rows, userId);
  }

  static async listByUsername(
    viewerId: string,
    username: string,
    limit = 30,
    before?: Date
  ): Promise<PostView[]> {
    const user = await UserModel.findByUsername(username);
    if (!user || !user.username) throw new AppError("USER_NOT_FOUND", "User not found.");
    const rows = await PostModel.listFeed({ authorIds: [user.id], limit, before });
    return hydrate(rows, viewerId);
  }
}
