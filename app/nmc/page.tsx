"use client";

import { useState } from "react";
import { useIssues } from "@/features/issues/hooks/useIssues";
import { useUpdateIssueStatus } from "@/features/issues/hooks/useUpdateIssueStatus";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/features/issues/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  Loader2,
  UserPlus,
  ImageOff,
  X,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import type { RoadIssue, IssueStatus } from "@/types";

type NmcFilter = "all" | "in_review" | "resolved";

const NMC_FILTERS: { value: NmcFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
];

export default function NmcDashboard() {
  const { user } = useAuth();
  const { data: allIssues = [], isLoading, refetch } = useIssues();
  const updateStatus = useUpdateIssueStatus();
  const [filter, setFilter] = useState<NmcFilter>("all");
  const [workerInputs, setWorkerInputs] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // NMC sees issues that have been submitted to them or resolved
  const nmcStatuses: IssueStatus[] = [
    "in_review",
    "resolved",
  ];
  const nmcIssues = allIssues.filter((i) => nmcStatuses.includes(i.status));
  const filtered = filter === "all" ? nmcIssues : nmcIssues.filter((i) => i.status === filter);

  const counts = {
    inReview: nmcIssues.filter((i) => i.status === "in_review").length,
    resolved: nmcIssues.filter((i) => i.status === "resolved").length,
  };

  function handleAssignWorker(issue: RoadIssue) {
    const workerName = workerInputs[issue.id]?.trim();
    if (!workerName) return;
    updateStatus.mutate({
      id: issue.id,
      status: "in_review",
      performedBy: user?.username ?? "nmc",
      assignedWorker: workerName,
    });
    setWorkerInputs((prev) => ({ ...prev, [issue.id]: "" }));
  }

  function handleResolve(issue: RoadIssue) {
    updateStatus.mutate({
      id: issue.id,
      status: "resolved",
      performedBy: user?.username ?? "nmc",
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[80vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-6 w-6" />
            </button>
            <p className="text-white text-sm mb-2 font-medium">{previewImage.title}</p>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="w-full max-h-[75vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">NMC Operations</h1>
          <p className="text-sm text-muted-foreground">
            Manage worker assignments and track task progress
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-blue-100 bg-blue-50/60">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700">In Review</p>
            <p className="text-2xl font-bold text-blue-800">{counts.inReview}</p>
          </CardContent>
        </Card>
        <Card className="border-green-100 bg-green-50/60">
          <CardContent className="p-4">
            <p className="text-sm text-green-700">Resolved</p>
            <p className="text-2xl font-bold text-green-800">{counts.resolved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {NMC_FILTERS.map((f) => {
          const count =
            f.value === "all"
              ? nmcIssues.length
              : nmcIssues.filter((i) => i.status === f.value).length;
          return (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
            >
              {f.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Issue table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No issues found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>
                      {issue.image_url ? (
                        <div
                          className="relative h-12 w-12 rounded overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-emerald-400 transition-all"
                          onClick={() =>
                            setPreviewImage({ url: issue.image_url!, title: issue.title })
                          }
                        >
                          <Image
                            src={issue.image_url}
                            alt={issue.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-muted-foreground">
                          <ImageOff className="h-5 w-5" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{issue.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {issue.description}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{issue.category}</TableCell>
                    <TableCell>
                      <StatusBadge status={issue.status} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {issue.assigned_worker ? (
                        <div>
                          <p className="text-xs font-semibold text-emerald-700">Worker Assigned</p>
                          <p className="text-sm font-medium text-slate-800">{issue.assigned_worker}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(issue.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <NmcActions
                        issue={issue}
                        workerInput={workerInputs[issue.id] ?? ""}
                        onWorkerInputChange={(v) =>
                          setWorkerInputs((prev) => ({ ...prev, [issue.id]: v }))
                        }
                        onAssign={() => handleAssignWorker(issue)}
                        onResolve={() => handleResolve(issue)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NmcActions({
  issue,
  workerInput,
  onWorkerInputChange,
  onAssign,
  onResolve,
}: {
  issue: RoadIssue;
  workerInput: string;
  onWorkerInputChange: (v: string) => void;
  onAssign: () => void;
  onResolve: () => void;
}) {
  if (issue.status === "in_review") {
    if (issue.assigned_worker) {
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
            Worker Assigned (In Process)
          </span>
          <Button size="sm" variant="outline" onClick={onResolve} className="h-8 text-xs text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Mark Resolved
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        <Input
          placeholder="Worker name"
          className="h-8 w-28 text-xs"
          value={workerInput}
          onChange={(e) => onWorkerInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAssign()}
        />
        <Button size="sm" variant="outline" onClick={onAssign} className="h-8 text-xs">
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          Assign Worker
        </Button>
      </div>
    );
  }
  if (issue.assigned_worker) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
        <UserPlus className="h-3 w-3" />
        Assigned
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">--</span>;
}
