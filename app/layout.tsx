import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <Providers>
          <nav className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
            <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
              <a href="/" className="font-bold text-lg">
                RoadWatch Admin
              </a>
              <div className="flex gap-6 text-sm">
                <a
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/issues"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Issues
                </a>
                <a
                  href="/map"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Map
                </a>
              </div>
            </div>
          </nav>
          {children}
        </Providers>
      </body>
    </html>
  );
}
