"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2, ImageOff, Send, Eye, ChevronDown, X } from "lucide-react";
import Image from "next/image";
import type { RoadIssue, IssueStatus } from "@/types";
import { ISSUE_STATUS_LABELS } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { useUpdateIssueStatus } from "../hooks/useUpdateIssueStatus";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActivityTimeline } from "./ActivityTimeline";

type FilterValue = "all" | IssueStatus;

const ALL_STATUSES: IssueStatus[] = [
  "reported",
  "in_review",
  "resolved",
  "rejected",
];

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "reported", label: "Reported" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

interface AdminTableProps {
  issues: RoadIssue[];
  isLoading: boolean;
}

export function AdminTable({ issues, isLoading }: AdminTableProps) {
  const { user } = useAuth();
  const updateStatus = useUpdateIssueStatus();
  const [filterStatus, setFilterStatus] = useState<FilterValue>("all");
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const filtered =
    filterStatus === "all"
      ? issues
      : issues.filter((i) => i.status === filterStatus);

  function handleSubmitToNmc(issue: RoadIssue) {
    updateStatus.mutate({
      id: issue.id,
      status: "in_review",
      performedBy: user?.username ?? "admin",
    });
  }

  function handleChangeStatus(issue: RoadIssue, newStatus: IssueStatus) {
    setStatusDropdownId(null);
    if (newStatus === issue.status) return;
    updateStatus.mutate({
      id: issue.id,
      status: newStatus,
      performedBy: user?.username ?? "admin",
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map((opt) => {
          const count =
            opt.value === "all"
              ? issues.length
              : issues.filter((i) => i.status === opt.value).length;
          return (
            <Button
              key={opt.value}
              variant={filterStatus === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(opt.value)}
            >
              {opt.label} ({count})
            </Button>
          );
        })}
      </div>

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
              <>
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
                    <div>
                      <p className="font-medium text-sm">{issue.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {issue.description}
                      </p>
                    </div>
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
                    <div className="flex items-center gap-1.5">
                      {issue.status === "reported" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-blue-700"
                          onClick={() => handleSubmitToNmc(issue)}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Submit to NMC
                        </Button>
                      )}
                      {/* Status change dropdown */}
                      <div className="relative">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() =>
                            setStatusDropdownId(
                              statusDropdownId === issue.id ? null : issue.id
                            )
                          }
                        >
                          <ChevronDown className="h-3.5 w-3.5 mr-1" />
                          Change Status
                        </Button>
                        {statusDropdownId === issue.id && (
                          <div className="absolute right-0 top-9 z-40 w-48 rounded-md border bg-white shadow-lg py-1">
                            {ALL_STATUSES.map((s) => (
                              <button
                                key={s}
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 ${
                                  s === issue.status
                                    ? "font-semibold text-emerald-700 bg-emerald-50"
                                    : "text-slate-700"
                                }`}
                                onClick={() => handleChangeStatus(issue, s)}
                              >
                                {ISSUE_STATUS_LABELS[s]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() =>
                          setExpandedIssueId(
                            expandedIssueId === issue.id ? null : issue.id
                          )
                        }
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Activity
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedIssueId === issue.id && (
                  <TableRow key={`${issue.id}-activity`}>
                    <TableCell colSpan={7} className="bg-slate-50/60 p-4">
                      <ActivityTimeline issueId={issue.id} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
