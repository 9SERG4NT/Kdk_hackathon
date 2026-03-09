/** DB enum values for the `issue_status` Postgres type */
export type DbIssueStatus = "reported" | "in_review" | "resolved" | "rejected";

/** DB enum values for the `issue_severity` Postgres type */
export type DbIssueSeverity = "low" | "medium" | "high" | "critical";

/** Human-readable display labels for each DB status value */
export const ISSUE_STATUS_LABELS: Record<DbIssueStatus, string> = {
  reported: "Reported",
  in_review: "In Review",
  resolved: "Resolved",
  rejected: "Rejected",
};

/** Human-readable display labels for each DB severity value */
export const ISSUE_SEVERITY_LABELS: Record<DbIssueSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/**
 * Matches the `road_issues` table in the DB.
 * `image_url` is a derived field resolved by `issueService` from `image_path`;
 * it is not stored in the database.
 */
export interface RoadIssue {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  status: DbIssueStatus;
  severity: DbIssueSeverity;
  latitude: number;
  longitude: number;
  address: string | null;
  image_path: string;
  assigned_to: string | null;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  /** Derived: resolved from `image_path` by issueService; not in DB */
  image_url?: string | null;
}

/** Matches the `issue_updates` table in the DB */
export interface IssueUpdate {
  id: number;
  issue_id: string;
  updated_by: string;
  old_status: DbIssueStatus | null;
  new_status: DbIssueStatus | null;
  comment: string | null;
  created_at: string;
}

/**
 * @deprecated Matches the legacy `activity_logs` table.
 * Prefer `IssueUpdate` for new code targeting the `issue_updates` table.
 */
export interface ActivityLog {
  id: string;
  issue_id: string;
  action: string;
  performed_by: string;
  details: string | null;
  created_at: string;
}

/** @deprecated Use `DbIssueStatus` instead */
export type IssueStatus = DbIssueStatus;
