"use client";

import { format } from "date-fns";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/features/issues/components/StatusBadge";
import type { RoadIssue } from "@/types";

interface RecentIssuesProps {
  issues: RoadIssue[];
}

export function RecentIssues({ issues }: RecentIssuesProps) {
  const recent = issues.slice(0, 8);

  return (
    <Card className="border-white/60 bg-white/75 shadow-[0_14px_45px_-32px_rgba(4,25,44,0.85)] backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Recent Reports from Mobile App</CardTitle>
        <a
          href="/issues"
          className="text-sm text-primary hover:underline underline-offset-4"
        >
          View all
        </a>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No reports yet. Waiting for data from mobile app.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Reported</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    {issue.image_url ? (
                      <div className="relative h-10 w-10 rounded overflow-hidden">
                        <Image
                          src={issue.image_url}
                          alt={issue.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm truncate max-w-[180px]">
                      {issue.title}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{issue.category}</TableCell>
                  <TableCell>
                    <StatusBadge status={issue.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(issue.created_at), "MMM d, h:mm a")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
