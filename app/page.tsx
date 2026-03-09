"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  function handleGetStarted() {
    if (user) {
      router.push(user.role === "admin" ? "/dashboard" : "/nmc");
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay to reduce brightness */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-emerald-300 text-sm font-semibold tracking-widest uppercase mb-3">
          Crowdsourced Road Issue Reporting
        </p>

        <h1
          className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight"
          style={{ fontFamily: "var(--font-sora)" }}
        >
          Civic Reporter
        </h1>

        <p className="text-lg md:text-xl text-white/80 max-w-xl mb-10">
          Empowering citizens to report road issues. Built for Nagpur.
        </p>

        <button
          onClick={handleGetStarted}
          className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-green-600/30 transition-all duration-300 hover:scale-105 hover:shadow-green-500/40"
        >
          Get Started
          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
