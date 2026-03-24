import { supabase } from "@/lib/supabase";
import type { RoadIssue, IssueStatus, ActivityLog, CreateIssuePayload } from "@/types";

function resolveImageUrl(row: Record<string, unknown>): string | null {
  if (row.image_url) return row.image_url as string;
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
  payload: CreateIssuePayload
): Promise<RoadIssue> {
  const { data, error } = await supabase
    .from("road_issues")
    .insert(payload)
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
