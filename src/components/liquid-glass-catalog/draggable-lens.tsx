"use client";

import { useCallback, useRef, useState } from "react";
import { LiquidGlass } from "@/components/liquid-glass";

export interface DraggableLensProps {
  /** Lens diameter (px). */
  size?: number;
  refractionHeight?: number;
  refractionAmount?: number;
  depthEffect?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * A circular liquid-glass lens that can be dragged around inside its
 * container. Used by the Magnifier destination and the HTML showcase.
 */
export function DraggableLens({
  size = 150,
  refractionHeight = 20,
  refractionAmount = 34,
  depthEffect = true,
  children,
  style,
}: DraggableLensProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      startRef.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    },
    [pos],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = startRef.current.px + (e.clientX - startRef.current.x);
      const ny = startRef.current.py + (e.clientY - startRef.current.y);
      setPos({
        x: Math.max(0, Math.min(rect.width - size, nx)),
        y: Math.max(0, Math.min(rect.height - size, ny)),
      });
    },
    [dragging, size],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%", ...style }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          top: pos.y,
          left: pos.x,
          width: size,
          height: size,
          touchAction: "none",
          cursor: dragging ? "grabbing" : "grab",
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <LiquidGlass
          radius={size / 2}
          refractionHeight={refractionHeight}
          refractionAmount={refractionAmount}
          depthEffect={depthEffect}
          saturation={1.6}
          blur={1}
          highlight="ambient"
          highlightWidth={2}
          highlightAlpha={0.9}
          shadowAlpha={0.25}
          innerShadowAlpha={0.3}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
