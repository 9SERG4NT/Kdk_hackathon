"use client";

import { useEffect, useRef, useState } from "react";
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
      {stats.map((stat, index) => (
        <Card
          key={stat.label}
          className="reveal-up border-white/60 bg-white/75 shadow-[0_14px_40px_-30px_rgba(5,26,46,0.9)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
          style={{ animationDelay: `${140 + index * 90}ms` }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${stat.bgColor} ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-slate-900">
                  <AnimatedCount value={stat.value} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const startValue = previous.current;
    const duration = 900;
    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);
      setDisplay(current);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      } else {
        previous.current = value;
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  return <>{display}</>;
}
