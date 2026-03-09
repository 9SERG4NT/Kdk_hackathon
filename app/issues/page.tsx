"use client";

import { useIssues } from "@/features/issues/hooks/useIssues";
import { AdminTable } from "@/features/issues/components/AdminTable";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IssuesPage() {
  const { data: issues = [], isLoading, refetch } = useIssues();

  const reported = issues.filter((i) => i.status === "Reported").length;
  const inProgress = issues.filter((i) => i.status === "In Progress").length;
  const resolved = issues.filter((i) => i.status === "Resolved").length;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Issues</h1>
          <p className="text-sm text-muted-foreground">
            View and update status of all reports from mobile app
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">Reported</p>
          <p className="text-2xl font-bold text-yellow-800">{reported}</p>
        </div>
        <div className="rounded-lg border bg-blue-50 p-4">
          <p className="text-sm text-blue-700">In Progress</p>
          <p className="text-2xl font-bold text-blue-800">{inProgress}</p>
        </div>
        <div className="rounded-lg border bg-green-50 p-4">
          <p className="text-sm text-green-700">Resolved</p>
          <p className="text-2xl font-bold text-green-800">{resolved}</p>
        </div>
      </div>

      <AdminTable issues={issues} isLoading={isLoading} />
    </div>
  );
}
