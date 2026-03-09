"use client";

import dynamic from "next/dynamic";
import { useIssues } from "@/features/issues/hooks/useIssues";
import { StatsCards } from "@/features/dashboard/components/StatsCards";
import { CategoryChart } from "@/features/dashboard/components/CategoryChart";
import { StatusChart } from "@/features/dashboard/components/StatusChart";
import { TimelineChart } from "@/features/dashboard/components/TimelineChart";
import { RecentIssues } from "@/features/dashboard/components/RecentIssues";
import { Loader2, RefreshCw } from "lucide-react";
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of all road issue reports collected from mobile app
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
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
        </div>
      </div>

      {/* Stats */}
      <StatsCards issues={issues} />

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CategoryChart issues={issues} />
        <StatusChart issues={issues} />
        <TimelineChart issues={issues} />
      </div>

      {/* Map overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Issue Locations</CardTitle>
          <a href="/map" className="text-sm text-primary hover:underline">
            Full map view
          </a>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-lg overflow-hidden">
            <MapView issues={issues} />
          </div>
        </CardContent>
      </Card>

      {/* Recent issues table */}
      <RecentIssues issues={issues} />
    </div>
  );
}
