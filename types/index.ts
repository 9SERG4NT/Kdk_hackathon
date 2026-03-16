export type IssueStatus =
  | "reported"
  | "in_review"
  | "resolved"
  | "rejected";

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  reported: "Reported",
  in_review: "Submitted to NMC",
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
  image_path?: string | null;
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
