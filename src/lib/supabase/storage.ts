import "server-only";
import { createClient } from "./server";

const BUCKET = "media";

export async function uploadImage(file: File, pathPrefix: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const { publicUrl } = await uploadMedia(file, file.type, ext, pathPrefix);
  return publicUrl;
}

/** Uploads to the media bucket and returns both the storage path and its public URL. */
export async function uploadMedia(
  body: Blob | Buffer,
  contentType: string,
  ext: string,
  pathPrefix: string
): Promise<{ path: string; publicUrl: string }> {
  const supabase = await createClient();
  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: contentType || undefined,
    upsert: false,
  });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  return { path, publicUrl: mediaUrl(path) };
}

export async function downloadMedia(path: string): Promise<Blob> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) {
    throw new Error(`Could not read ${path} from storage: ${error?.message ?? "no data"}`);
  }
  return data;
}

export function mediaUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}
