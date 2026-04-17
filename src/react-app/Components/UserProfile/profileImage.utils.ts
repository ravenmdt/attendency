/*
  profileImage.utils.ts

  These helpers keep profile-image work inside the UserProfile folder.
  The main idea is simple: allow the user to pick a normal image file, then
  resize it in the browser before saving so the app uses less bandwidth.
*/

const MAX_PROFILE_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_PROFILE_DIMENSION = 256;
const PROFILE_IMAGE_QUALITY = 0.82;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected file could not be read as an image"));
    };

    image.src = objectUrl;
  });
}

export async function resizeProfileImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("Please choose an image smaller than 12 MB");
  }

  const image = await loadImageFromFile(file);
  const largestSide = Math.max(image.width, image.height);
  const scale = Math.min(1, MAX_PROFILE_DIMENSION / largestSide);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image processing is not available in this browser");
  }

  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", PROFILE_IMAGE_QUALITY);
}
