export const PROFILE_PICTURE_POST_TAG = "[profile-picture]";
export const COVER_PHOTO_POST_TAG = "[cover-photo]";
export const PROFILE_PICTURE_POST_BODY = "Updated profile picture.";
export const COVER_PHOTO_POST_BODY = "Updated cover photo.";

export function formatProfilePicturePostBody(caption?: string | null): string {
  const text = caption?.trim() || PROFILE_PICTURE_POST_BODY;
  return `${PROFILE_PICTURE_POST_TAG}\n${text}`;
}

export function formatCoverPhotoPostBody(caption?: string | null): string {
  const text = caption?.trim() || COVER_PHOTO_POST_BODY;
  return `${COVER_PHOTO_POST_TAG}\n${text}`;
}
