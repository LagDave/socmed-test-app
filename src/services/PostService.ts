import { z } from "zod";
import { MAX_POST_IMAGES, UPLOAD_PATH_RE } from "../constants/uploads";
import { CommentModel } from "../models/CommentModel";
import { PostImageModel } from "../models/PostImageModel";
import { PostModel, type PostRow } from "../models/PostModel";
import { FriendshipModel } from "../models/FriendshipModel";
import { UserModel } from "../models/UserModel";
import { ReactionModel, emptyReactionSummary, type ReactionSummary } from "../models/ReactionModel";
import { AppError } from "../utils/AppError";
import { toPublicUser } from "../types/user";
import { isUserOnline } from "../realtime/PresenceRealtime";
import { NotificationService } from "./NotificationService";

const createPostSchema = z
  .object({
    body: z.string().min(1).max(5000),
    imageUrl: z.string().max(500).nullable().optional(),
    imageUrls: z.array(z.string().max(500)).max(MAX_POST_IMAGES).optional(),
  })
  .superRefine((v, ctx) => {
    const urls =
      v.imageUrls && v.imageUrls.length > 0
        ? v.imageUrls
        : v.imageUrl
          ? [v.imageUrl]
          : [];
    for (let i = 0; i < urls.length; i++) {
      if (!UPLOAD_PATH_RE.test(urls[i])) {
        ctx.addIssue({
          code: "custom",
          path: v.imageUrls?.length ? ["imageUrls", i] : ["imageUrl"],
          message: "Invalid image URL",
        });
      }
    }
  });

function resolveImageUrls(input: z.infer<typeof createPostSchema>): string[] {
  if (input.imageUrls && input.imageUrls.length > 0) return input.imageUrls;
  if (input.imageUrl) return [input.imageUrl];
  return [];
}

export type PostImageView = {
  id: string;
  url: string;
  sortOrder: number;
  commentCount: number;
  reactionSummary: ReactionSummary;
};

const sharePostSchema = z.object({
  body: z.string().max(5000).optional(),
});

export type PostView = {
  id: string;
  body: string;
  imageUrl: string | null;
  imageUrls: string[];
  images: PostImageView[];
  createdAt: Date;
  author: ReturnType<typeof toPublicUser>;
  reactionSummary: ReactionSummary;
  commentCount: number;
  shareCount: number;
  sharedFromPostId: string | null;
  sharedFrom: PostView | null;
};

async function attachImageUrls(views: PostView[], rows: PostRow[], viewerId: string): Promise<PostView[]> {
  const imagesByPost = await PostImageModel.listByPostIds(rows.map((p) => p.id));
  const commentCounts = await CommentModel.countByPostIds(rows.map((p) => p.id));
  const allImageIds = [...imagesByPost.values()].flat().map((img) => img.id);
  const imageSummaries = await ReactionModel.summariesForPostImages(allImageIds, viewerId);

  return views.map((view, i) => {
    const row = rows[i];
    const imageRows = imagesByPost.get(row.id) ?? [];
    const countsForPost = commentCounts.get(row.id) ?? new Map<string, number>();
    const images: PostImageView[] = imageRows.map((img) => ({
      id: img.id,
      url: img.url,
      sortOrder: img.sort_order,
      commentCount: countsForPost.get(img.id) ?? 0,
      reactionSummary: imageSummaries.get(img.id) ?? emptyReactionSummary(),
    }));
    const urls =
      images.length > 0
        ? images.map((img) => img.url)
        : row.image_url
          ? [row.image_url]
          : [];
    return {
      ...view,
      images,
      imageUrls: urls,
      imageUrl: urls[0] ?? null,
    };
  });
}

function toViewerAuthor(
  author: NonNullable<Awaited<ReturnType<typeof UserModel.findById>>>,
  mutualFriendIds: ReadonlySet<string>
): ReturnType<typeof toPublicUser> {
  const user = toPublicUser(author);
  return mutualFriendIds.has(author.id) ? { ...user, isOnline: isUserOnline(author.id) } : user;
}

async function hydrateBase(
  posts: PostRow[],
  viewerId: string,
  mutualFriendIds: ReadonlySet<string>
): Promise<PostView[]> {
  const postIds = posts.map((p) => p.id);
  const [authors, summaries, commentCounts, shareCounts] = await Promise.all([
    Promise.all(posts.map((p) => UserModel.findById(p.author_id))),
    ReactionModel.summariesForPosts(postIds, viewerId),
    CommentModel.countPostLevelByPostIds(postIds),
    PostModel.countSharesBySourcePostIds(postIds),
  ]);
  const views = posts.map((p, i) => {
    const author = authors[i];
    if (!author) throw new AppError("USER_NOT_FOUND", "Author missing.");
    return {
      id: p.id,
      body: p.body,
      imageUrl: p.image_url,
      imageUrls: p.image_url ? [p.image_url] : [],
      images: [] as PostImageView[],
      createdAt: p.created_at,
      author: toViewerAuthor(author, mutualFriendIds),
      reactionSummary: summaries.get(p.id) ?? emptyReactionSummary(),
      commentCount: commentCounts.get(p.id) ?? 0,
      shareCount: shareCounts.get(p.id) ?? 0,
      sharedFromPostId: p.shared_from_post_id,
      sharedFrom: null,
    };
  });
  return attachImageUrls(views, posts, viewerId);
}

async function hydrate(
  posts: PostRow[],
  viewerId: string,
  knownMutualFriendIds?: ReadonlySet<string>
): Promise<PostView[]> {
  const mutualFriendIds =
    knownMutualFriendIds ?? new Set(await FriendshipModel.listAcceptedMutualIds(viewerId));
  const views = await hydrateBase(posts, viewerId, mutualFriendIds);
  const sharedIds = [
    ...new Set(posts.map((p) => p.shared_from_post_id).filter((id): id is string => Boolean(id))),
  ];
  if (sharedIds.length === 0) return views;

  const originals = await PostModel.findByIds(sharedIds);
  const originalViews = await hydrateBase(originals, viewerId, mutualFriendIds);
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
    const imageUrls = resolveImageUrls(input);

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

    const { row, notification } = await PostModel.withTransaction(async (trx) => {
      const row = await PostModel.create({
        authorId: viewerId,
        body: caption,
        imageUrl: null,
        sharedFromPostId: original.id,
      }, trx);
      const notification = await NotificationService.createNotification({
        recipientId: original.author_id,
        actorId: viewerId,
        type: "post_shared",
        postId: original.id,
      }, trx);
      return { row, notification };
    });
    if (notification) await NotificationService.publishCreated(original.author_id, notification.id);
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
    return hydrate(rows, userId, new Set(mutualIds));
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
