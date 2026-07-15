"use client";

import { useCallback, useRef, useState } from "react";
import { LiquidGlass } from "@/components/liquid-glass";
import { type DestinationProps } from "../types";

/**
 * Faithful port of `destinations/LockScreenContent.kt`.
 *
 * The original applies an SDF clock-texture shader to the backdrop. We render a
 * large live clock inside a glass panel that the user can drag horizontally.
 */
export function LockScreenContent({}: DestinationProps) {
  const [time, setTime] = useState(() => new Date());
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  // tick every second
  useRef(
    (() => {
      const id = setInterval(() => setTime(new Date()), 1000);
      return id;
    })(),
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      startRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    },
    [offset],
  );
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      setOffset({
        x: startRef.current.ox + (e.clientX - startRef.current.x),
        y: startRef.current.oy + (e.clientY - startRef.current.y),
      });
    },
    [dragging],
  );
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDragging(false);
  }, []);

  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const dateStr = time.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      style={{
        position: "relative",
        minHeight: "70vh",
        background: "rgba(0,0,0,0.3)",
        borderRadius: 24,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, display: "grid", placeItems: "center", paddingInline: 48 }}>
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            maxWidth: 400,
            width: "100%",
            touchAction: "none",
            cursor: dragging ? "grabbing" : "grab",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <LiquidGlass
            radius={32}
            refractionHeight={20}
            refractionAmount={28}
            depthEffect
            saturation={1.5}
            blur={2}
            highlight="ambient"
            highlightWidth={2}
            highlightAlpha={0.7}
            surfaceColor="rgba(255,255,255,0.25)"
            style={{ width: "100%", aspectRatio: "2 / 1" }}
          >
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                textShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{ fontSize: 72, fontWeight: 200, letterSpacing: -2, lineHeight: 1 }}>
                {hh}:{mm}
              </div>
              <div style={{ fontSize: 15, opacity: 0.9, marginTop: 8 }}>{dateStr}</div>
            </div>
          </LiquidGlass>
        </div>
      </div>
      <div style={{ flex: 1 }} />
    </div>
  );
}
