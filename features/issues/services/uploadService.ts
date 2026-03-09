import { supabase } from "@/lib/supabase";

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

  const { data } = supabase.storage
    .from("road-issue-images")
    .getPublicUrl(path);

  return data.publicUrl;
}
