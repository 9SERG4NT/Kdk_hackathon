"use client";

import { useIssues } from "@/features/issues/hooks/useIssues";
import { AdminTable } from "@/features/issues/components/AdminTable";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IssuesPage() {
  const { data: issues = [], isLoading, refetch } = useIssues();

  const reported = issues.filter((i) => i.status === "reported").length;
  const inReview = issues.filter((i) => i.status === "in_review").length;
  const resolved = issues.filter((i) => i.status === "resolved").length;
  const rejected = issues.filter((i) => i.status === "rejected").length;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Issues</h1>
          <p className="text-sm text-muted-foreground">
            View reports, submit to NMC, and track full workflow progress
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">Reported</p>
          <p className="text-2xl font-bold text-yellow-800">{reported}</p>
        </div>
        <div className="rounded-lg border bg-blue-50 p-4">
          <p className="text-sm text-blue-700">In Review</p>
          <p className="text-2xl font-bold text-blue-800">{inReview}</p>
        </div>
        <div className="rounded-lg border bg-green-50 p-4">
          <p className="text-sm text-green-700">Resolved</p>
          <p className="text-2xl font-bold text-green-800">{resolved}</p>
        </div>
        <div className="rounded-lg border bg-red-50 p-4">
          <p className="text-sm text-red-700">Rejected</p>
          <p className="text-2xl font-bold text-red-800">{rejected}</p>
        </div>
      </div>

      <AdminTable issues={issues} isLoading={isLoading} />
    </div>
  );
}
