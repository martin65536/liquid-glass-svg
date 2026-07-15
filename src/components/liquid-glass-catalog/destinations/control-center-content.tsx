"use client";

import { useState } from "react";
import { Plane, Wifi, Bluetooth, Moon, Sun, Volume2, Lock } from "lucide-react";
import { LiquidGlass } from "@/components/liquid-glass";
import { demoColors, type DestinationProps } from "../types";

interface IconButtonProps {
  icon: React.ReactNode;
  on: boolean;
  onClick: () => void;
}

function IconButton({ icon, on, onClick }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        border: "none",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        background: on ? "#0091FF" : "rgba(255,255,255,0.2)",
        transition: "background 200ms ease",
      }}
    >
      {icon}
    </button>
  );
}

/**
 * Faithful port of `destinations/ControlCenterContent.kt`.
 *
 * An iOS-style control center grid of liquid-glass tiles. A drag handle at the
 * top dims/undims the backdrop (the original's drag-to-dismiss enter
 * animation).
 */
export function ControlCenterContent({ dark }: DestinationProps) {
  const c = demoColors(dark);
  const [progress, setProgress] = useState(1); // 1 = fully shown, 0 = dismissed
  const [active, setActive] = useState<Record<string, boolean>>({
    airplane: true,
    wifi: true,
    bt: false,
    moon: false,
  });

  const item = 68;
  const gap = 16;
  const twoSpan = item * 2 + gap;
  const radius = item / 2;

  const drag = (deltaY: number) => {
    setProgress((p) => Math.max(0, Math.min(1, p + deltaY / 600)));
  };

  const tilesProps = {
    radius,
    refractionHeight: 24 * progress,
    refractionAmount: 48 * progress,
    saturation: 1.5,
    highlight: "default" as const,
    highlightWidth: 1.5,
    highlightAlpha: 0.45 * progress,
    surfaceColor: "rgba(0,0,0,0.05)",
  };

  const inactiveBg = "rgba(255,255,255,0.2)";
  const activeBg = c.accentColor;
  void inactiveBg;
  void activeBg;

  return (
    <div
      style={{
        position: "relative",
        paddingTop: 20,
        opacity: 0.4 + 0.6 * progress,
      }}
      onPointerDown={(e) => (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)}
      onPointerMove={(e) => {
        if (e.buttons === 1) drag(e.movementY);
      }}
    >
      {/* dim overlay grows as progress -> 0 (dismissed) */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: `rgba(0,0,0,${0.4 * (1 - progress)})`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap,
          transform: `translateY(${-48 * (1 - progress)}px)`,
        }}
      >
        {/* row 1: two wide tiles */}
        <div style={{ display: "flex", gap }}>
          <LiquidGlass {...tilesProps} style={{ width: twoSpan, height: twoSpan, padding: gap }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap, alignContent: "flex-start" }}>
              <IconButton
                icon={<Plane size={22} />}
                on={!!active.airplane}
                onClick={() => setActive((a) => ({ ...a, airplane: !a.airplane }))}
              />
              <IconButton
                icon={<Plane size={22} />}
                on
                onClick={() => {}}
              />
              <IconButton
                icon={<Plane size={22} />}
                on
                onClick={() => {}}
              />
            </div>
          </LiquidGlass>
          <LiquidGlass {...tilesProps} style={{ width: twoSpan, height: twoSpan }} />
        </div>

        {/* row 2 */}
        <div style={{ display: "flex", gap, alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            <div style={{ display: "flex", gap }}>
              <LiquidGlass {...tilesProps} style={{ width: item, height: item }}>
                <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
                  <IconButton
                    icon={<Wifi size={22} />}
                    on={!!active.wifi}
                    onClick={() => setActive((a) => ({ ...a, wifi: !a.wifi }))}
                  />
                </div>
              </LiquidGlass>
              <LiquidGlass {...tilesProps} style={{ width: item, height: item }}>
                <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
                  <IconButton
                    icon={<Bluetooth size={22} />}
                    on={!!active.bt}
                    onClick={() => setActive((a) => ({ ...a, bt: !a.bt }))}
                  />
                </div>
              </LiquidGlass>
            </div>
            <LiquidGlass {...tilesProps} style={{ width: twoSpan, height: item }} />
          </div>
          <div style={{ display: "flex", gap }}>
            <LiquidGlass {...tilesProps} style={{ width: item, height: twoSpan }}>
              <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
                <IconButton
                  icon={dark ? <Sun size={22} /> : <Moon size={22} />}
                  on={!!active.moon}
                  onClick={() => setActive((a) => ({ ...a, moon: !a.moon }))}
                />
              </div>
            </LiquidGlass>
            <LiquidGlass {...tilesProps} style={{ width: item, height: twoSpan }} />
          </div>
        </div>

        {/* row 3 */}
        <div style={{ display: "flex", gap, alignItems: "flex-start" }}>
          <LiquidGlass {...tilesProps} style={{ width: twoSpan, height: item }} />
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            <div style={{ display: "flex", gap }}>
              <LiquidGlass {...tilesProps} style={{ width: item, height: item }}>
                <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
                  <IconButton icon={<Volume2 size={22} />} on onClick={() => {}} />
                </div>
              </LiquidGlass>
              <LiquidGlass {...tilesProps} style={{ width: item, height: item }}>
                <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
                  <IconButton icon={<Lock size={22} />} on onClick={() => {}} />
                </div>
              </LiquidGlass>
            </div>
            <div style={{ display: "flex", gap }}>
              <LiquidGlass {...tilesProps} style={{ width: item, height: item }} />
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          fontSize: 13,
          opacity: 0.7,
          color: c.contentColor,
          textAlign: "center",
        }}
      >
        Drag up/down to dim the control center.
      </div>
    </div>
  );
}
