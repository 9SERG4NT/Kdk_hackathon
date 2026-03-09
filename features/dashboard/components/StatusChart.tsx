"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RoadIssue, IssueStatus } from "@/types";

const STATUS_COLORS: Record<IssueStatus, string> = {
  Reported: "#eab308",
  "In Progress": "#3b82f6",
  Resolved: "#22c55e",
};

interface StatusChartProps {
  issues: RoadIssue[];
}

export function StatusChart({ issues }: StatusChartProps) {
  const data = (
    Object.keys(STATUS_COLORS) as IssueStatus[]
  ).map((status) => ({
    name: status,
    count: issues.filter((i) => i.status === status).length,
    fill: STATUS_COLORS[status],
  }));

  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">By Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} barSize={48}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
