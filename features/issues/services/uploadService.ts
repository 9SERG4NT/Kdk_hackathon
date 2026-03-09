import { supabase } from "@/lib/supabase";

/**
 * Uploads an image to the road-issue-images bucket and returns the storage path.
 * The caller is responsible for resolving the full URL via issueService if needed.
 */
export async function uploadIssueImage(file: File): Promise<string> {
  const extension = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const path = `issues/${fileName}`;

  const { error } = await supabase.storage
    .from("road-issue-images")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  return path;
}
