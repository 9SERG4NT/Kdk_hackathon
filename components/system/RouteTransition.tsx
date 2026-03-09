"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface RouteTransitionProps {
  children: ReactNode;
}

export function RouteTransition({ children }: RouteTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="route-fade-in">
      {children}
    </div>
  );
}
