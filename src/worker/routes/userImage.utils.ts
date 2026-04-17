/*
  userImage.utils.ts

  These helpers keep private profile-image storage consistent across routes.
  The database stores the R2 object key, while the frontend receives a normal
  app URL that only works for authenticated users.
*/

const ALLOWED_DATA_IMAGE_PATTERN =
  /^data:(image\/(png|jpe?g|webp|gif));base64,([a-z0-9+/=]+)$/i;

const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function mapStoredImageUrlForClient(
  userId: number,
  storedValue: string | null,
): string | null {
  if (!storedValue) return null;

  if (/^https?:\/\//i.test(storedValue) || /^data:image\//i.test(storedValue)) {
    return storedValue;
  }

  return `/api/users/${userId}/photo`;
}

export function isInternalProfilePhotoRoute(value: string | null): boolean {
  if (!value) return false;
  return /^\/api\/users\/(me|\d+)\/photo(?:\?.*)?$/i.test(value);
}

export function isExternalImageUrl(value: string | null): boolean {
  if (!value) return false;
  return /^https?:\/\//i.test(value);
}

export function isStoredR2ImageKey(value: string | null): boolean {
  if (!value) return false;
  return value.startsWith("profile-images/");
}

export async function storeProfileImageFromDataUrl(args: {
  bucket: R2Bucket;
  userId: number;
  dataUrl: string;
}): Promise<string> {
  const match = args.dataUrl.match(ALLOWED_DATA_IMAGE_PATTERN);
  if (!match) {
    throw new Error("Profile photo must be a supported image type");
  }

  const contentType = match[1].toLowerCase();
  const base64Payload = match[3];
  const extension = MIME_TYPE_TO_EXTENSION[contentType] ?? "jpg";
  const binaryString = atob(base64Payload);
  const bytes = Uint8Array.from(binaryString, (character) =>
    character.charCodeAt(0),
  );

  if (bytes.byteLength > 300_000) {
    throw new Error("Profile photo data is too large after processing");
  }

  const objectKey = `profile-images/user-${args.userId}-${Date.now()}.${extension}`;

  await args.bucket.put(objectKey, bytes, {
    httpMetadata: {
      contentType,
      cacheControl: "private, max-age=86400",
    },
  });

  return objectKey;
}

export async function deleteProfileImageIfStored(
  bucket: R2Bucket | undefined,
  storedValue: string | null,
): Promise<void> {
  const objectKey = storedValue;
  if (!bucket || !objectKey || !isStoredR2ImageKey(objectKey)) return;
  await bucket.delete(objectKey);
}
