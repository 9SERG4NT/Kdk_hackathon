import { supabase } from "@/lib/supabase";
import type { RoadIssue, DbIssueStatus, ActivityLog } from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const STORAGE_BUCKET = "road-issue-images";

function resolveImageUrl(row: Record<string, unknown>): string | null {
  if (typeof row.image_path === "string" && row.image_path) {
    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${row.image_path}`;
  }
  return null;
}

export async function fetchIssues(): Promise<RoadIssue[]> {
  const { data, error } = await supabase
    .from("road_issues")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Record<string, unknown>[]).map((row) => ({
    ...row,
    image_url: resolveImageUrl(row),
  })) as RoadIssue[];
}

export async function createIssue(
  issue: Omit<RoadIssue, "id" | "reporter_id" | "status" | "created_at" | "updated_at" | "assigned_to" | "admin_notes" | "resolved_at" | "image_url">
): Promise<RoadIssue> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("road_issues")
    .insert({ ...issue, reporter_id: user.id })
    .select()
    .single();

  if (error) throw error;
  const row = data as Record<string, unknown>;
  return { ...row, image_url: resolveImageUrl(row) } as RoadIssue;
}

export async function updateIssueStatus(
  id: string,
  status: DbIssueStatus,
  performedBy?: string,
  assignedTo?: string
): Promise<RoadIssue> {
  const updatePayload: Record<string, unknown> = { status };
  if (assignedTo !== undefined) {
    updatePayload.assigned_to = assignedTo;
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
    await addActivityLog(id, `Status changed to "${status}"`, performedBy, assignedTo ? `Assigned to: ${assignedTo}` : null);
  }

  const row = data as Record<string, unknown>;
  return { ...row, image_url: resolveImageUrl(row) } as RoadIssue;
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
