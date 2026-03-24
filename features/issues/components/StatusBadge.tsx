"use client";

import type { IssueStatus } from "@/types";
import { ISSUE_STATUS_LABELS } from "@/types";
import { Badge } from "@/components/ui/badge";

const statusClassName: Record<IssueStatus, string> = {
  reported: "bg-yellow-100 text-yellow-800 border-yellow-300",
  in_review: "bg-blue-100 text-blue-800 border-blue-300",
  resolved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
};

interface StatusBadgeProps {
  status: IssueStatus;
}

const fallbackConfig = { label: "Unknown", className: "bg-gray-100 text-gray-800 border-gray-300" };

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = ISSUE_STATUS_LABELS[status] ?? fallbackConfig.label;
  const className = statusClassName[status] ?? fallbackConfig.className;
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
