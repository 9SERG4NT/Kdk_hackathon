import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { FirstLoadSplash } from "@/components/system/FirstLoadSplash";
import { RouteTransition } from "@/components/system/RouteTransition";
import { AppNavbar } from "@/components/system/AppNavbar";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "Civic Reporter - Nagpur",
  description:
    "Crowdsourced Road Issue Reporting System - Nagpur",
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
            <AppNavbar />
            <RouteTransition>{children}</RouteTransition>
          </div>
        </Providers>
      </body>
    </html>
  );
}
