import { supabase } from "@/lib/supabase";
import type { RoadIssue, IssueStatus } from "@/types";

export async function fetchIssues(): Promise<RoadIssue[]> {
  const { data, error } = await supabase
    .from("road_issues")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as RoadIssue[];
}

export async function createIssue(
  issue: Omit<RoadIssue, "id" | "status" | "created_at">
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
  status: IssueStatus
): Promise<RoadIssue> {
  const { data, error } = await supabase
    .from("road_issues")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as RoadIssue;
}
