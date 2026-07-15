"use client";

import { useCallback, useRef, useState } from "react";
import { LiquidGlass } from "./liquid-glass";

export interface LiquidSliderProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  accentColor?: string;
  trackColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A capsule liquid-glass slider — port of LiquidSlider.kt.
 * Drag the liquid knob along a thin capsule track.
 */
export function LiquidSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.01,
  accentColor = "#0091FF",
  trackColor = "rgba(120,120,120,0.22)",
  className,
  style,
}: LiquidSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState(false);
  const knobW = 40;
  const knobH = 24;
  const radius = knobH / 2;

  const fraction = (value - min) / (max - min);

  const setFromClientX = useCallback(
    (clientX: number, snap?: boolean) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const f = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      let next = min + f * (max - min);
      if (snap) {
        const steps = Math.round((next - min) / step);
        next = min + steps * step;
      }
      onChange(Math.max(min, Math.min(max, next)));
    },
    [min, max, step, onChange],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setPressed(true);
      setFromClientX(e.clientX);
    },
    [setFromClientX],
  );
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pressed) return;
      setFromClientX(e.clientX);
    },
    [pressed, setFromClientX],
  );
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!pressed) return;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      setPressed(false);
      setFromClientX(e.clientX, true);
    },
    [pressed, setFromClientX],
  );

  const scaleX = pressed ? 1.18 : 1;
  const scaleY = pressed ? 0.82 : 1;

  return (
    <div
      ref={trackRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: 36,
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        touchAction: "none",
        ...style,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
    >
      {/* track */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 6,
          borderRadius: 3,
          background: trackColor,
          overflow: "hidden",
        }}
      >
        {/* filled portion */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${fraction * 100}%`,
            background: accentColor,
          }}
        />
      </div>

      {/* knob */}
      <div
        style={{
          position: "absolute",
          left: `calc(${fraction * 100}% - ${knobW / 2}px)`,
          width: knobW,
          height: knobH,
          transition: pressed ? "left 0ms" : "left 60ms linear",
        }}
      >
        <LiquidGlass
          radius={radius}
          refractionHeight={10}
          refractionAmount={14}
          saturation={1.5}
          blur={pressed ? 0 : 8}
          highlight="ambient"
          highlightWidth={1.6}
          highlightAlpha={pressed ? 0.9 : 0}
          surfaceColor={
            pressed ? "transparent" : "rgba(255,255,255,0.92)"
          }
          shadowAlpha={pressed ? 0.2 : 0.12}
          innerShadowAlpha={pressed ? 0.5 : 0}
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: "center",
            transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </div>
    </div>
  );
}
