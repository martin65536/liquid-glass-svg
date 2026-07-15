"use client";

import { useCallback, useRef, useState } from "react";
import { LiquidGlass } from "./liquid-glass";

export interface LiquidToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  accentColor?: string;
  trackColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A capsule liquid-glass toggle — port of LiquidToggle.kt.
 * The knob is a liquid-glass capsule with blur + lens + ambient highlight;
 * pressing squashes it (damped spring approximated with CSS transitions).
 */
export function LiquidToggle({
  checked,
  onChange,
  accentColor = "#34C759",
  trackColor = "rgba(120,120,120,0.22)",
  className,
  style,
}: LiquidToggleProps) {
  const trackW = 64;
  const trackH = 28;
  const knobW = 40;
  const knobH = 24;
  const padding = 2;
  const dragWidth = trackW - knobW - padding * 2; // 20px
  const radius = knobH / 2;

  const [pressed, setPressed] = useState(false);
  const [dragFraction, setDragFraction] = useState<number | null>(null);
  const startXRef = useRef(0);
  const startFracRef = useRef(0);
  const didDragRef = useRef(false);

  const fraction = dragFraction ?? (checked ? 1 : 0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setPressed(true);
      didDragRef.current = false;
      startXRef.current = e.clientX;
      startFracRef.current = checked ? 1 : 0;
      setDragFraction(startFracRef.current);
    },
    [checked],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pressed) return;
      const delta = (e.clientX - startXRef.current) / dragWidth;
      if (Math.abs(e.clientX - startXRef.current) > 3) {
        didDragRef.current = true;
      }
      const next = Math.max(0, Math.min(1, startFracRef.current + delta));
      setDragFraction(next);
    },
    [pressed, dragWidth],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!pressed) return;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setPressed(false);
      if (didDragRef.current) {
        // Released after a drag: snap to the nearest side.
        const finalFrac = dragFraction ?? (checked ? 1 : 0);
        const next = finalFrac >= 0.5;
        setDragFraction(null);
        if (next !== checked) onChange(next);
      } else {
        // Plain tap: just flip.
        setDragFraction(null);
        onChange(!checked);
      }
    },
    [pressed, dragFraction, checked, onChange],
  );

  // Knob spring scale: pressed → squash (wider, shorter).
  const scaleX = pressed ? 1.12 : 1;
  const scaleY = pressed ? 0.86 : 1;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: trackW,
        height: trackH,
        borderRadius: trackH / 2,
        background: checked
          ? accentColor
          : trackColor,
        transition: "background 240ms ease",
        cursor: "pointer",
        touchAction: "none",
        ...style,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
    >
      <div
        style={{
          position: "absolute",
          top: (trackH - knobH) / 2,
          left: padding + fraction * dragWidth,
          width: knobW,
          height: knobH,
          transition: pressed
            ? "left 0ms"
            : "left 320ms cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <LiquidGlass
          radius={radius}
          refractionHeight={5}
          refractionAmount={10}
          saturation={1.5}
          blur={pressed ? 0 : 8}
          highlight="ambient"
          highlightWidth={1.6}
          highlightAlpha={pressed ? 0.9 : 0}
          surfaceColor={
            pressed ? "transparent" : "rgba(255,255,255,0.92)"
          }
          shadowAlpha={pressed ? 0.18 : 0.1}
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
