"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2, ImageOff } from "lucide-react";
import Image from "next/image";
import type { RoadIssue, IssueStatus } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { useUpdateIssueStatus } from "../hooks/useUpdateIssueStatus";
import { ISSUE_STATUSES } from "../types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminTableProps {
  issues: RoadIssue[];
  isLoading: boolean;
}

export function AdminTable({ issues, isLoading }: AdminTableProps) {
  const updateStatus = useUpdateIssueStatus();
  const [filterStatus, setFilterStatus] = useState<IssueStatus | "all">("all");

  const filtered =
    filterStatus === "all"
      ? issues
      : issues.filter((i) => i.status === filterStatus);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("all")}
        >
          All ({issues.length})
        </Button>
        {ISSUE_STATUSES.map((status) => {
          const count = issues.filter((i) => i.status === status).length;
          return (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status} ({count})
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
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No issues found.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>
                  {issue.image_url ? (
                    <div className="relative h-12 w-12 rounded overflow-hidden">
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
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(issue.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <select
                    className="text-xs border rounded px-2 py-1"
                    value={issue.status}
                    onChange={(e) =>
                      updateStatus.mutate({
                        id: issue.id,
                        status: e.target.value as IssueStatus,
                      })
                    }
                  >
                    {ISSUE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
