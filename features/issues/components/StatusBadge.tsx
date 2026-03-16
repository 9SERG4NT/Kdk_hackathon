"use client";

import type { DbIssueStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  DbIssueStatus,
  { label: string; className: string }
> = {
  reported: {
    label: "Reported",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  in_review: {
    label: "In Review",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-100 text-green-800 border-green-300",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-300",
  },
};

interface StatusBadgeProps {
  status: DbIssueStatus;
}

const fallbackConfig = { label: "Unknown", className: "bg-gray-100 text-gray-800 border-gray-300" };

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? fallbackConfig;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
