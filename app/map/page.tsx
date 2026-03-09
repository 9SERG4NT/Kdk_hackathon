"use client";

import dynamic from "next/dynamic";
import { useIssues } from "@/features/issues/hooks/useIssues";
import { Loader2 } from "lucide-react";

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

export default function MapPage() {
  const { data: issues = [], isLoading } = useIssues();

  return (
    <div className="h-[calc(100vh-3.5rem)] relative">
      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur rounded-lg px-4 py-2 shadow text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading issues...
        </div>
      )}
      <MapView issues={issues} />
    </div>
  );
}
