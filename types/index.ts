/** Values stored in the Postgres `status` column (must match DB enum/defaults). */
export type DbIssueStatus = "reported" | "in_review" | "resolved" | "rejected";

/** Human-readable display labels for each DB status value. */
export const DB_STATUS_LABELS: Record<DbIssueStatus, string> = {
  reported: "Reported",
  in_review: "In Review",
  resolved: "Resolved",
  rejected: "Rejected",
};

/**
 * @deprecated Use `DbIssueStatus` for DB operations and `DB_STATUS_LABELS`
 * for display. Kept for backward compatibility with existing UI references.
 */
export type IssueStatus = DbIssueStatus;

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
