"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LiquidGlass } from "./liquid-glass";
import { useDampedDragAnimation } from "./use-damped-drag-animation";

export interface LiquidToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  accentColor?: string;
  trackColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * LiquidToggle — faithful port of `app/.../catalog/components/LiquidToggle.kt`.
 *
 * Track: 64×28 capsule, color lerps trackColor → accentColor.
 * Knob:  40×24 capsule with:
 *   - blur(8dp * (1 - pressProgress))  — blurred when released, sharp when pressed
 *   - lens(5dp*p, 10dp*p, chromaticAberration)
 *   - Highlight.Ambient (width/1.5, blur/1.5, alpha=p)
 *   - Shadow(radius=4dp, Black@0.05)
 *   - InnerShadow(radius=4dp*p, alpha=p)
 *   - onDrawSurface: White@(1 - p)
 *   - layerBlock: scale springs + velocity deformation
 *   - position: lerp(padding, padding + dragWidth, fraction)  [padding=2dp, dragWidth=20dp]
 *
 * Combined backdrop: the knob's backdrop-filter naturally samples the track
 * (drawn behind it) + the wallpaper — equivalent to the original's
 * rememberCombinedBackdrop(backdrop, trackBackdrop).
 *
 * Gestures (DampedDragAnimation, pressedScale=1.5):
 *   - tap (no drag): flip selected
 *   - drag: fraction += deltaX / dragWidth, snap to nearest on release
 */
export function LiquidToggle({
  checked,
  onChange,
  accentColor = "#34C759",
  trackColor = "rgba(120,120,120,0.2)",
  className,
  style,
}: LiquidToggleProps) {
  const [fraction, setFraction] = useState(checked ? 1 : 0);
  const didDragRef = useRef(false);
  const dragWidth = 20;
  const padding = 2;

  // Refs to break circular dependencies in the drag callbacks.
  const fractionRef = useRef(fraction);
  const checkedRef = useRef(checked);
  const onChangeRef = useRef(onChange);
  const animValueRef = useRef(checked ? 1 : 0);
  useEffect(() => {
    fractionRef.current = fraction;
  }, [fraction]);
  useEffect(() => {
    checkedRef.current = checked;
  }, [checked]);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const anim = useDampedDragAnimation({
    initialValue: checked ? 1 : 0,
    pressedScale: 1.5,
    onDragStarted: () => {
      didDragRef.current = false;
    },
    onDragStopped: () => {
      if (didDragRef.current) {
        const next = animValueRef.current >= 0.5 ? 1 : 0;
        setFraction(next);
        if (next !== (checkedRef.current ? 1 : 0)) {
          onChangeRef.current(next === 1);
        }
        didDragRef.current = false;
      } else {
        const next = checkedRef.current ? 0 : 1;
        setFraction(next);
        onChangeRef.current(next === 1);
      }
    },
    onDrag: (deltaX) => {
      if (Math.abs(deltaX) > 0.5) didDragRef.current = true;
      const delta = deltaX / dragWidth;
      setFraction((f) => Math.max(0, Math.min(1, f + delta)));
    },
  });

  // Track the animation's current value for use in onDragStopped.
  useEffect(() => {
    animValueRef.current = anim.value;
  }, [anim.value]);

  // Sync fraction when `checked` changes externally.
  useEffect(() => {
    const target = checked ? 1 : 0;
    if (Math.abs(target - fractionRef.current) > 0.001) {
      anim.animateToValue(target);
      fractionRef.current = target;
    }
  }, [checked, anim]);

  // Keep the animation value in sync with fraction (drag updates).
  useEffect(() => {
    anim.updateValue(fraction);
  }, [fraction, anim]);

  const p = anim.pressProgress;
  const value = anim.value;

  const trackBg = lerpColor(trackColor, accentColor, value);
  const knobX = padding + dragWidth * value;

  // Velocity deformation (LiquidToggle.kt layerBlock).
  const vel = anim.velocity / 50;
  const scaleX = anim.scaleX / (1 - clamp(vel * 0.75, -0.2, 0.2));
  const scaleY = anim.scaleY * (1 - clamp(vel * 0.25, -0.2, 0.2));

  const knobSurface = `rgba(255,255,255,${1 - p})`;
  const innerShadowAlpha = p;

  const handlePointerDown = anim.onPointerDown;
  const handlePointerUp = anim.onPointerUp;

  // The track is drawn behind the knob so the knob's backdrop-filter samples
  // both the track color AND the wallpaper (combined backdrop, free).
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: 64,
        height: 28,
        borderRadius: 14,
        cursor: "pointer",
        touchAction: "none",
        ...style,
      }}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onPointerDown={handlePointerDown}
    >
      {/* Track: capsule with lerped color (behind the knob → combined backdrop). */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 14,
          background: trackBg,
        }}
      />

      {/* Knob */}
      <div
        style={{
          position: "absolute",
          top: (28 - 24) / 2,
          left: knobX,
          width: 40,
          height: 24,
          touchAction: "none",
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: "center",
          // Shadow(radius=4dp, offset=(0, 4/6 dp), Black@0.05)
          boxShadow: `0 0.67px 4px rgba(0,0,0,0.05)`,
          pointerEvents: "none",
        }}
      >
        <LiquidGlass
          radius={12}
          refractionHeight={5 * p}
          refractionAmount={10 * p}
          depthEffect={false}
          saturation={1.5}
          blur={8 * (1 - p)}
          highlight={p > 0.01 ? "ambient" : "none"}
          highlightWidth={0.5 / 1.5}
          highlightBlurRadius={0.25 / 1.5}
          highlightAngle={(45 * Math.PI) / 180}
          highlightAlpha={p}
          surfaceColor={knobSurface}
          shadowAlpha={0}
          innerShadowAlpha={innerShadowAlpha}
          sheen={false}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}

/* ---- helpers ---- */

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function lerpColor(a: string, b: string, t: number): string {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return a;
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  const al = ca[3] + (cb[3] - ca[3]) * t;
  return `rgba(${r}, ${g}, ${bl}, ${al})`;
}

function parseColor(c: string): [number, number, number, number] | null {
  if (c.startsWith("#")) {
    const m = c.replace("#", "");
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return [r, g, b, 1];
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
  return [parts[0], parts[1], parts[2], parts[3] ?? 1];
}
