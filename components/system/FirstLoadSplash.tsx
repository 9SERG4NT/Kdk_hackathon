"use client";

import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";

const SPLASH_KEY = "civicapp_splash_shown";

export function FirstLoadSplash() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem(SPLASH_KEY);
  });
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!visible) return;
    sessionStorage.setItem(SPLASH_KEY, "1");
    const timer = setTimeout(() => {
      setClosing(true);
      setTimeout(() => setVisible(false), 650);
    }, 2200);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`splash-overlay${closing ? " is-closing" : ""}`}>
      <div className="splash-bg-grid" />
      <div className="splash-panel splash-panel-left" />
      <div className="splash-panel splash-panel-right" />
      <div className="splash-content">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-green-500/30">
          <Leaf className="h-8 w-8 text-white" />
        </div>
        <p className="splash-kicker">Civic Intelligence Platform</p>
        <h1 className="splash-title">Civic Reporter</h1>
        <p className="splash-subtitle">Empowering communities, one report at a time</p>
        <div className="splash-loader-track">
          <span className="splash-loader-bar" />
        </div>
      </div>
    </div>
  );
}
