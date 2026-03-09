"use client";

import { useAuth, type UserRole } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const PUBLIC_PATHS = ["/login", "/"];

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (isLoading) return;

    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }

    if (user && pathname === "/login") {
      router.replace(user.role === "admin" ? "/dashboard" : "/nmc");
      return;
    }

    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(user.role === "admin" ? "/dashboard" : "/nmc");
    }
  }, [user, isLoading, isPublic, allowedRoles, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user && !isPublic) return null;

  return <>{children}</>;
}
