"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RoadIssue, DbIssueSeverity } from "@/types";
import { ISSUE_SEVERITY_LABELS } from "@/types";
import { ISSUE_SEVERITIES } from "@/features/issues/types";

const SEVERITY_COLORS: Record<DbIssueSeverity, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

interface SeverityChartProps {
  issues: RoadIssue[];
}

export function CategoryChart({ issues }: SeverityChartProps) {
  const data = ISSUE_SEVERITIES.map((severity) => ({
    name: ISSUE_SEVERITY_LABELS[severity],
    value: issues.filter((i) => i.severity === severity).length,
    fill: SEVERITY_COLORS[severity],
  })).filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <Card className="glass-panel tilt-card">
        <CardHeader>
          <CardTitle className="text-base">By Severity</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel tilt-card">
      <CardHeader>
        <CardTitle className="text-base" style={{ fontFamily: "var(--font-sora)" }}>
          By Severity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              isAnimationActive
              animationDuration={900}
              animationBegin={120}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-xs">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
