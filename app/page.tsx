"use client";

import dynamic from "next/dynamic";
import { useIssues } from "@/features/issues/hooks/useIssues";
import { HeroSlideshow } from "@/features/dashboard/components/HeroSlideshow";
import { StatsCards } from "@/features/dashboard/components/StatsCards";
import { CategoryChart } from "@/features/dashboard/components/CategoryChart";
import { StatusChart } from "@/features/dashboard/components/StatusChart";
import { TimelineChart } from "@/features/dashboard/components/TimelineChart";
import { RecentIssues } from "@/features/dashboard/components/RecentIssues";
import { ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MapView = dynamic(
  () =>
    import("@/features/issues/components/MapView").then((m) => ({
      default: m.MapView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-muted rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export default function DashboardPage() {
  const { data: issues = [], isLoading, refetch, dataUpdatedAt } = useIssues();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      <HeroSlideshow />

      <div className="reveal-up stagger-1 flex flex-col gap-4 rounded-2xl border border-white/55 bg-white/65 p-5 shadow-[0_14px_45px_-30px_rgba(4,25,44,0.8)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl" style={{ fontFamily: "var(--font-sora)" }}>
            Executive Control Center
          </h2>
          <p className="text-sm text-slate-600">
            Live analytics and operational coverage for road issues reported from mobile devices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Last updated:{" "}
            {dataUpdatedAt
              ? new Date(dataUpdatedAt).toLocaleTimeString()
              : "--"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <a
            href="/issues"
            className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-900"
          >
            Operations
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="reveal-up stagger-2">
        <StatsCards issues={issues} />
      </div>

      <div className="reveal-up stagger-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CategoryChart issues={issues} />
        <StatusChart issues={issues} />
        <TimelineChart issues={issues} />
      </div>

      <Card className="reveal-up stagger-4 overflow-hidden border-white/60 bg-white/75 shadow-[0_14px_45px_-32px_rgba(4,25,44,0.85)] backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Issue Locations</CardTitle>
          <a href="/map" className="text-sm text-primary hover:underline underline-offset-4">
            Full map view
          </a>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-lg overflow-hidden">
            <MapView issues={issues} />
          </div>
        </CardContent>
      </Card>

      <div className="reveal-up stagger-4">
        <RecentIssues issues={issues} />
      </div>
    </div>
  );
}
