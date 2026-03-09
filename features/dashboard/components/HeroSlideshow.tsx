"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, TrafficCone, TrendingUp } from "lucide-react";

const SLIDES = [
  {
    eyebrow: "City Pulse",
    title: "Actionable visibility across road health",
    description:
      "Monitor live issue inflow, identify critical hotspots, and route operations faster.",
    statLabel: "Avg response window",
    statValue: "2h 34m",
    icon: ShieldCheck,
  },
  {
    eyebrow: "Operational Clarity",
    title: "One surface for reports, trends, and outcomes",
    description:
      "Unified insights from mobile submissions with status analytics and geospatial context.",
    statLabel: "Weekly closure growth",
    statValue: "+18%",
    icon: TrendingUp,
  },
  {
    eyebrow: "Field Intelligence",
    title: "From citizen reports to measurable execution",
    description:
      "Track bottlenecks in real-time and prioritize repair campaigns with confidence.",
    statLabel: "Active zones",
    statValue: "12",
    icon: TrafficCone,
  },
] as const;

export function HeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, 4500);

    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="hero-shell reveal-up">
      <div className="hero-orb hero-orb-left" />
      <div className="hero-orb hero-orb-right" />

      <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/70 shadow-[0_20px_60px_-30px_rgba(7,24,43,0.45)] backdrop-blur-xl">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {SLIDES.map((slide) => {
            const Icon = slide.icon;
            return (
              <article key={slide.title} className="min-w-full p-6 md:p-9">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-700/80">
                  {slide.eyebrow}
                </p>
                <div className="mt-4 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
                  <div>
                    <h1 className="text-2xl font-semibold leading-tight text-slate-900 md:text-4xl">
                      {slide.title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
                      {slide.description}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Icon className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-[0.14em]">
                        {slide.statLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {slide.statValue}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? "w-8 bg-emerald-600"
                  : "w-2.5 bg-slate-400/70 hover:bg-emerald-400"
              }`}
              aria-label={`Show slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
