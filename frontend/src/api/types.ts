export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type ApiSuccess<T> = { success: true; data: T; error: null };
export type ApiError = {
  success: false;
  data: null;
  error: { code: string; message: string; details: unknown };
};

export type PostView = {
  id: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  author: PublicUser;
};

export type CommentView = {
  id: string;
  postId: string;
  parentId?: string | null;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  author: PublicUser;
};
