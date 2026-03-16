/** Matches the Postgres `issue_status` enum values exactly. */
export type DbIssueStatus =
  | "reported"
  | "in_review"
  | "resolved"
  | "rejected";

/** Alias kept for backward compatibility – always use DB values. */
export type IssueStatus = DbIssueStatus;

/** Human-readable labels for each DB status value. */
export const ISSUE_STATUS_LABELS: Record<DbIssueStatus, string> = {
  reported: "Reported",
  in_review: "In Review",
  resolved: "Resolved",
  rejected: "Rejected",
};

export type IssueCategory =
  | "Pothole"
  | "Flooding"
  | "Broken Streetlight"
  | "Crack"
  | "Other";

export interface RoadIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  image_url: string | null;
  latitude: number;
  longitude: number;
  status: DbIssueStatus;
  assigned_worker: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  issue_id: string;
  action: string;
  performed_by: string;
  details: string | null;
  created_at: string;
}
