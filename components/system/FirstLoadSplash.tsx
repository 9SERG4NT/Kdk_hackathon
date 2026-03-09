"use client";

import { useEffect, useState } from "react";

const SPLASH_KEY = "roadwatch_splash_seen";

export function FirstLoadSplash() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const seen = window.sessionStorage.getItem(SPLASH_KEY);
    if (seen === "1") {
      return;
    }

    setVisible(true);

    const closeStart = window.setTimeout(() => {
      setClosing(true);
    }, 2100);

    const closeDone = window.setTimeout(() => {
      setVisible(false);
      window.sessionStorage.setItem(SPLASH_KEY, "1");
    }, 2800);

    return () => {
      window.clearTimeout(closeStart);
      window.clearTimeout(closeDone);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className={`splash-overlay ${closing ? "is-closing" : ""}`}>
      <div className="splash-bg-grid" />
      <div className="splash-panel splash-panel-left" />
      <div className="splash-panel splash-panel-right" />

      <div className="splash-content">
        <p className="splash-kicker">Nagpur Civic Intelligence</p>
        <h1 className="splash-title">ROADWATCH</h1>
        <p className="splash-subtitle">Urban Ops Dashboard</p>
        <div className="splash-loader-track">
          <span className="splash-loader-bar" />
        </div>
      </div>
    </div>
  );
}
