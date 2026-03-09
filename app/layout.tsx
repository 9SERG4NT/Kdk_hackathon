import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { FirstLoadSplash } from "@/components/system/FirstLoadSplash";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "RoadWatch Admin - Nagpur",
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
              <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
                <a href="/" className="font-semibold text-lg tracking-tight" style={{ fontFamily: "var(--font-sora)" }}>
                  RoadWatch Admin
                </a>
                <div className="flex gap-6 text-sm">
                  <a
                    href="/"
                    className="premium-nav-link text-muted-foreground hover:text-foreground"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/issues"
                    className="premium-nav-link text-muted-foreground hover:text-foreground"
                  >
                    Issues
                  </a>
                  <a
                    href="/map"
                    className="premium-nav-link text-muted-foreground hover:text-foreground"
                  >
                    Map
                  </a>
                </div>
              </div>
            </nav>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
