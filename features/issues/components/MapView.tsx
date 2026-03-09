"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import type { RoadIssue } from "@/types";
import { IssueMarker } from "./IssueMarker";

const DEFAULT_CENTER: [number, number] = [21.1458, 79.0882];
const DEFAULT_ZOOM = 12;

interface MapViewProps {
  issues: RoadIssue[];
}

export function MapView({ issues }: MapViewProps) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerClusterGroup chunkedLoading>
        {issues.map((issue) => (
          <IssueMarker key={issue.id} issue={issue} />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
