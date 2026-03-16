import { supabase } from "@/lib/supabase";
import type { RoadIssue, IssueStatus, ActivityLog } from "@/types";

const STORAGE_BUCKET = "road-issue-images";
const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

async function resolveImageUrl(row: Record<string, unknown>): Promise<string | null> {
  // image_url may hold either a full URL (legacy) or a storage object path
  const raw = (row.image_url ?? row.image_path) as string | undefined;
  if (!raw) return null;

  // If already a full URL, return as-is
  if (raw.startsWith("https://")) return raw;

  // raw is a storage object path – generate a short-lived signed URL
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(raw, SIGNED_URL_EXPIRY_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function fetchIssues(): Promise<RoadIssue[]> {
  const { data, error } = await supabase
    .from("road_issues")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  const rows = data as Record<string, unknown>[];
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      image_url: await resolveImageUrl(row),
    }))
  ) as Promise<RoadIssue[]>;
}

export async function createIssue(
  issue: Omit<RoadIssue, "id" | "status" | "created_at" | "assigned_worker">
): Promise<RoadIssue> {
  const { data, error } = await supabase
    .from("road_issues")
    .insert(issue)
    .select()
    .single();

  if (error) throw error;
  return data as RoadIssue;
}

export async function updateIssueStatus(
  id: string,
  status: IssueStatus,
  performedBy?: string,
  assignedWorker?: string
): Promise<RoadIssue> {
  const updatePayload: Record<string, unknown> = { status };
  if (assignedWorker !== undefined) {
    updatePayload.assigned_worker = assignedWorker;
  }

  const { data, error } = await supabase
    .from("road_issues")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Log the activity
  if (performedBy) {
    await addActivityLog(id, `Status changed to "${status}"`, performedBy, assignedWorker ? `Worker: ${assignedWorker}` : null);
  }

  return data as RoadIssue;
}

export async function addActivityLog(
  issueId: string,
  action: string,
  performedBy: string,
  details: string | null = null
): Promise<void> {
  await supabase.from("activity_logs").insert({
    issue_id: issueId,
    action,
    performed_by: performedBy,
    details,
  });
}

export async function fetchActivityLogs(issueId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as ActivityLog[];
}

export async function fetchAllActivityLogs(): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data as ActivityLog[];
}
