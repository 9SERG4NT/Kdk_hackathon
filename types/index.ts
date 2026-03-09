export type IssueStatus = "Reported" | "In Progress" | "Resolved";

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
  created_at: string;
}
