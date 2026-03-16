import { z } from "zod";

export const ISSUE_CATEGORIES = [
  "Pothole",
  "Flooding",
  "Broken Streetlight",
  "Crack",
  "Other",
] as const;

export const ISSUE_STATUSES = [
  "reported",
  "in_review",
  "resolved",
  "rejected",
] as const;

export const createIssueSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(140, "Title must be at most 140 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters"),
  category: z.enum(ISSUE_CATEGORIES),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
