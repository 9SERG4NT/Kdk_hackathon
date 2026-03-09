"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchActivityLogs } from "../services/issueService";
import { Loader2, Clock } from "lucide-react";
import { format } from "date-fns";

interface ActivityTimelineProps {
  issueId: string;
}

export function ActivityTimeline({ issueId }: ActivityTimelineProps) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["activity-logs", issueId],
    queryFn: () => fetchActivityLogs(issueId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading activity...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No activity recorded yet for this issue.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-700">Activity Log</h4>
      <div className="relative border-l-2 border-emerald-200 pl-4 space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="relative">
            <div className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            <div>
              <p className="text-sm text-slate-800">{log.action}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="font-medium text-slate-600">
                  by {log.performed_by}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                </span>
                {log.details && (
                  <span className="text-slate-500">- {log.details}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
