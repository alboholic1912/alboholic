import "server-only";
import { createClient } from "./server";

const BUCKET = "media";

export async function uploadImage(file: File, pathPrefix: string): Promise<string> {
  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
