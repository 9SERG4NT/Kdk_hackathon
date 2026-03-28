"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Image from "next/image";
import type { RoadIssue } from "@/types";
import { ISSUE_STATUS_LABELS, ISSUE_SEVERITY_LABELS } from "@/types";
import { StatusBadge } from "./StatusBadge";

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface IssueMarkerProps {
  issue: RoadIssue;
}

export function IssueMarker({ issue }: IssueMarkerProps) {
  return (
    <Marker position={[issue.latitude, issue.longitude]} icon={defaultIcon}>
      <Popup minWidth={250} maxWidth={300}>
        <div className="space-y-2 p-1">
          <h3 className="font-semibold text-sm leading-tight">
            {issue.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {ISSUE_SEVERITY_LABELS[issue.severity]}
            </span>
            <StatusBadge status={issue.status} />
          </div>
          {issue.image_url && (
            <div className="relative w-full h-32 rounded overflow-hidden">
              <Image
                src={issue.image_url}
                alt={issue.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <p className="text-xs text-gray-600 leading-relaxed">
            {issue.description}
          </p>
          {issue.address && (
            <p className="text-xs text-gray-500">{issue.address}</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
