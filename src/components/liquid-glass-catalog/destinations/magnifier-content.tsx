"use client";

import { useCallback, useRef, useState } from "react";
import { LiquidGlass } from "@/components/liquid-glass";
import { LOREM_IPSUM } from "../lorem-ipsum";
import { demoColors, type DestinationProps } from "../types";

/**
 * Faithful port of `destinations/MagnifierContent.kt`.
 *
 * A glass capsule magnifier (1.5× zoom, depth-effect lens with chromatic
 * aberration) that the user drags over a card of lorem text. A small accent
 * capsule cursor marks the drag origin.
 */
export function MagnifierContent({ dark }: DestinationProps) {
  const c = demoColors(dark);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

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

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", minHeight: "60vh", padding: 24 }}
    >
      {/* lorem card (the content the magnifier refracts) */}
      <div
        style={{
          borderRadius: 32,
          background: `${c.backgroundColor}E6`,
          padding: 24,
          color: c.contentColor,
          fontSize: 16,
          lineHeight: 1.6,
        }}
      >
        {LOREM_IPSUM}
      </div>

      {/* accent capsule cursor at the drag origin */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 24 + offset.x,
          top: 24 + offset.y,
          width: 4,
          height: 24,
          borderRadius: 2,
          background: c.accentColor,
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      {/* the magnifier capsule, dragged above the cursor */}
      <div
        style={{
          position: "absolute",
          left: 24 + offset.x,
          top: 24 + offset.y - 80,
          width: 128,
          height: 96,
          transform: "translate(-50%, -50%)",
          touchAction: "none",
          cursor: dragging ? "grabbing" : "grab",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <LiquidGlass
          radius={48}
          refractionHeight={8}
          refractionAmount={24}
          depthEffect
          saturation={1.6}
          highlight="ambient"
          highlightWidth={2}
          highlightAlpha={0.85}
          innerShadowAlpha={0.5}
          shadowAlpha={0.2}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 13,
          opacity: 0.7,
          color: c.contentColor,
          textAlign: "center",
        }}
      >
        Drag the capsule to magnify the text.
      </div>
    </div>
  );
}
