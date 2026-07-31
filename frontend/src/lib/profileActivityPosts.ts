export const PROFILE_PICTURE_POST_TAG = "[profile-picture]";
export const COVER_PHOTO_POST_TAG = "[cover-photo]";
export const PROFILE_PICTURE_POST_BODY = "Updated profile picture.";
export const COVER_PHOTO_POST_BODY = "Updated cover photo.";

export function isProfilePicturePost(body: string): boolean {
  return body === PROFILE_PICTURE_POST_BODY || body.startsWith(`${PROFILE_PICTURE_POST_TAG}\n`);
}

export function isCoverPhotoPost(body: string): boolean {
  return body === COVER_PHOTO_POST_BODY || body.startsWith(`${COVER_PHOTO_POST_TAG}\n`);
}

export function isProfileActivityPost(body: string): boolean {
  return isProfilePicturePost(body) || isCoverPhotoPost(body);
}

export function profileActivityDisplayBody(body: string): string {
  if (body.startsWith(`${PROFILE_PICTURE_POST_TAG}\n`)) {
    return body.slice(PROFILE_PICTURE_POST_TAG.length + 1).trim() || PROFILE_PICTURE_POST_BODY;
  }
  if (body.startsWith(`${COVER_PHOTO_POST_TAG}\n`)) {
    return body.slice(COVER_PHOTO_POST_TAG.length + 1).trim() || COVER_PHOTO_POST_BODY;
  }
  return body;
}

export function profileActivityKind(body: string): "avatar" | "cover" | null {
  if (isProfilePicturePost(body)) return "avatar";
  if (isCoverPhotoPost(body)) return "cover";
  return null;
}

export function profileActivityHasCustomCaption(body: string): boolean {
  const display = profileActivityDisplayBody(body);
  const kind = profileActivityKind(body);
  if (!kind) return false;
  const defaultBody = kind === "avatar" ? PROFILE_PICTURE_POST_BODY : COVER_PHOTO_POST_BODY;
  return display !== defaultBody;
}

export function isProfileActivityImagePost(body: string): boolean {
  return isProfilePicturePost(body) || isCoverPhotoPost(body);
}
