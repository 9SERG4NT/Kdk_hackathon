export type IssueStatus =
  | "Reported"
  | "Submitted to NMC"
  | "Resolved";

export type IssueCategory =
  | "Pothole"
  | "Flooding"
  | "Broken Streetlight"
  | "Crack"
  | "Other";

/** Mirrors the `road_issues` table row returned from Supabase. */
export interface RoadIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  image_url: string | null;
  latitude: number;
  longitude: number;
  status: IssueStatus;
  assigned_worker: string | null;
  created_at: string;
}

/**
 * Fields required when inserting a new road issue.
 * Explicitly mirrors the insertable columns of the `road_issues` table
 * (excludes server-side defaults: id, status, created_at, assigned_worker).
 */
export interface CreateIssuePayload {
  title: string;
  description: string;
  category: IssueCategory;
  image_url: string | null;
  latitude: number;
  longitude: number;
}

export interface ActivityLog {
  id: string;
  issue_id: string;
  action: string;
  performed_by: string;
  details: string | null;
  created_at: string;
}
