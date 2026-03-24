/** DB-facing status values matching the Postgres `issue_status` enum. */
export type IssueStatus =
  | "reported"
  | "in_review"
  | "resolved"
  | "rejected";

/** Human-readable labels for each DB status value. */
export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
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
  status: IssueStatus;
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
