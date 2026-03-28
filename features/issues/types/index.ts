import { z } from "zod";
import type { DbIssueStatus, DbIssueSeverity } from "@/types";

/** DB-aligned status values (matches `issue_status` Postgres enum) */
export const ISSUE_STATUSES: DbIssueStatus[] = [
  "reported",
  "in_review",
  "resolved",
  "rejected",
];

/** DB-aligned severity values (matches `issue_severity` Postgres enum) */
export const ISSUE_SEVERITIES: DbIssueSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];

export const createIssueSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(140, "Title must be at most 140 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters"),
  severity: z.enum(["low", "medium", "high", "critical"] as const).default("medium"),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
