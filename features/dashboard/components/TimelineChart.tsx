"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, isAfter } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RoadIssue } from "@/types";

interface TimelineChartProps {
  issues: RoadIssue[];
}

export function TimelineChart({ issues }: TimelineChartProps) {
  const days = 14;
  const cutoff = startOfDay(subDays(new Date(), days - 1));

  const dailyCounts: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const date = subDays(new Date(), days - 1 - i);
    dailyCounts[format(date, "MMM d")] = 0;
  }

  issues.forEach((issue) => {
    const created = new Date(issue.created_at);
    if (isAfter(created, cutoff)) {
      const key = format(created, "MMM d");
      if (key in dailyCounts) {
        dailyCounts[key]++;
      }
    }
  });

  const data = Object.entries(dailyCounts).map(([date, count]) => ({
    date,
    reports: count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reports - Last 14 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="reports"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorReports)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
