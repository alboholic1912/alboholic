import "server-only";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/** The uploaded featured image, or null when the field was left empty. */
export function readFeaturedImage(formData: FormData): File | null {
  const file = formData.get("featuredImage");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) {
    throw new Error("The featured image must be an image file.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("The featured image must be under 20 MB.");
  }
  return file;
}
