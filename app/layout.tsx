import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { FirstLoadSplash } from "@/components/system/FirstLoadSplash";
import { RouteTransition } from "@/components/system/RouteTransition";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "CivicApp - Nagpur",
  description:
    "Admin dashboard for Crowdsourced Road Issue Reporting System - Nagpur",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${sora.variable}`} style={{ fontFamily: "var(--font-manrope)" }}>
        <Providers>
          <div className="app-shell">
            <FirstLoadSplash />
            <nav className="premium-nav sticky top-0 z-50">
              <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
                <a href="/" className="flex items-center gap-2 group" style={{ fontFamily: "var(--font-sora)" }}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white text-sm font-bold shadow-md shadow-green-500/20 transition-transform duration-200 group-hover:scale-110">C</span>
                  <span className="font-semibold text-lg tracking-tight text-slate-800">CivicApp</span>
                </a>
                <div className="flex items-center gap-1 rounded-full bg-slate-100/80 p-1">
                  <a
                    href="/"
                    className="px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-emerald-700 hover:bg-white/90 transition-all duration-200"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/issues"
                    className="px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-emerald-700 hover:bg-white/90 transition-all duration-200"
                  >
                    Issues
                  </a>
                  <a
                    href="/map"
                    className="px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-emerald-700 hover:bg-white/90 transition-all duration-200"
                  >
                    Map
                  </a>
                </div>
              </div>
            </nav>
            <RouteTransition>{children}</RouteTransition>
          </div>
        </Providers>
      </body>
    </html>
  );
}
