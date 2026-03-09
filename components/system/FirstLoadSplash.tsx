"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SOUND_KEY = "roadwatch_splash_sound_on";

export function FirstLoadSplash() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<{
    context: AudioContext;
    gain: GainNode;
    oscA: OscillatorNode;
    oscB: OscillatorNode;
  } | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(SOUND_KEY);
    setSoundOn(saved === "1");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SOUND_KEY, soundOn ? "1" : "0");
  }, [soundOn]);

  useEffect(() => {
    setVisible(true);

    const closeStart = window.setTimeout(() => {
      setClosing(true);
    }, 2100);

    const closeDone = window.setTimeout(() => {
      setVisible(false);
    }, 2800);

    return () => {
      window.clearTimeout(closeStart);
      window.clearTimeout(closeDone);
    };
  }, []);

  useEffect(() => {
    if (!visible || !soundOn) {
      return;
    }

    let context: AudioContext | null = null;
    let gain: GainNode | null = null;
    let oscA: OscillatorNode | null = null;
    let oscB: OscillatorNode | null = null;

    try {
      context = new window.AudioContext();
      gain = context.createGain();
      oscA = context.createOscillator();
      oscB = context.createOscillator();

      oscA.type = "sine";
      oscB.type = "triangle";
      oscA.frequency.value = 110;
      oscB.frequency.value = 156;

      gain.gain.value = 0.0001;
      oscA.connect(gain);
      oscB.connect(gain);
      gain.connect(context.destination);

      oscA.start();
      oscB.start();

      const now = context.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.015, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.3);

      audioRef.current = { context, gain, oscA, oscB };
    } catch {
      // Ignore audio initialization errors and continue visual splash.
    }

    return () => {
      const current = audioRef.current;
      if (current) {
        try {
          current.oscA.stop();
          current.oscB.stop();
          current.context.close();
        } catch {
          // Ignore teardown errors.
        }
      }
      audioRef.current = null;
    };
  }, [visible, soundOn]);

  function toggleSound() {
    setSoundOn((prev) => !prev);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className={`splash-overlay ${closing ? "is-closing" : ""}`}>
      <button
        type="button"
        onClick={toggleSound}
        className="splash-sound-toggle"
        aria-label={soundOn ? "Mute splash sound" : "Enable splash sound"}
      >
        {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        <span>{soundOn ? "Sound On" : "Sound Off"}</span>
      </button>

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
