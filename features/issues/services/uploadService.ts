import { supabase } from "@/lib/supabase";

export async function uploadIssueImage(file: File): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Failed to upload image: user must be authenticated");

  const extension = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  // Storage policy requires first path segment to equal the uploader's UID
  const path = `${user.id}/${fileName}`;

  const { error } = await supabase.storage
    .from("road-issue-images")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  // Return just the object path; the bucket is private so callers must use
  // createSignedUrl() to generate a time-limited URL for display.
  return path;
}
