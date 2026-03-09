"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { RoadIssue } from "@/types";

interface StatsCardsProps {
  issues: RoadIssue[];
}

interface StatItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export function StatsCards({ issues }: StatsCardsProps) {
  const total = issues.length;
  const reported = issues.filter((i) => i.status === "Reported").length;
  const inProgress = issues.filter((i) => i.status === "In Progress").length;
  const resolved = issues.filter((i) => i.status === "Resolved").length;

  const stats: StatItem[] = [
    {
      label: "Total Reports",
      value: total,
      icon: <FileWarning className="h-5 w-5" />,
      color: "text-slate-700",
      bgColor: "bg-slate-100",
    },
    {
      label: "Reported",
      value: reported,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-yellow-700",
      bgColor: "bg-yellow-50",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: <Clock className="h-5 w-5" />,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
    },
    {
      label: "Resolved",
      value: resolved,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "text-green-700",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${stat.bgColor} ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
