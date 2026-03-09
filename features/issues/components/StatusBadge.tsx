"use client";

import type { IssueStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  IssueStatus,
  { label: string; className: string }
> = {
  Reported: {
    label: "Reported",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  "In Progress": {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  Resolved: {
    label: "Resolved",
    className: "bg-green-100 text-green-800 border-green-300",
  },
};

interface StatusBadgeProps {
  status: IssueStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
