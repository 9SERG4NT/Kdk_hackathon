"use client";

import { useAuth } from "@/lib/auth";
import { usePathname } from "next/navigation";
import { LogOut, Shield, Building2 } from "lucide-react";

const ADMIN_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/issues", label: "Issues" },
  { href: "/map", label: "Map" },
];

const NMC_LINKS = [
  { href: "/nmc", label: "NMC Dashboard" },
  { href: "/map", label: "Map" },
];

export function AppNavbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user || pathname === "/login" || pathname === "/") return null;

  const links = user.role === "admin" ? ADMIN_LINKS : NMC_LINKS;
  const roleIcon =
    user.role === "admin" ? (
      <Shield className="h-3.5 w-3.5" />
    ) : (
      <Building2 className="h-3.5 w-3.5" />
    );

  return (
    <nav className="premium-nav sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
        <a
          href={user.role === "admin" ? "/dashboard" : "/nmc"}
          className="flex items-center gap-2 group"
          style={{ fontFamily: "var(--font-sora)" }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white text-sm font-bold shadow-md shadow-green-500/20 transition-transform duration-200 group-hover:scale-110">
            C
          </span>
          <span className="font-semibold text-lg tracking-tight text-slate-800">
            Civic Reporter
          </span>
        </a>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-slate-100/80 p-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-muted-foreground hover:text-emerald-700 hover:bg-white/90"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {roleIcon}
              {user.role.toUpperCase()}
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-full transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
