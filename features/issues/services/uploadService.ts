import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = "road-issue-images";
const SIGNED_URL_EXPIRATION_SECONDS = 3600;

export async function uploadIssueImage(file: File): Promise<string> {
  const extension = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const path = `issues/${fileName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  // Try public URL first (works when bucket is public)
  const { data: publicData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  if (publicData?.publicUrl) {
    return publicData.publicUrl;
  }

  // Fall back to a signed URL for private buckets
  const { data: signedData, error: signedError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRATION_SECONDS);

  if (signedError) throw signedError;
  return signedData.signedUrl;
}
