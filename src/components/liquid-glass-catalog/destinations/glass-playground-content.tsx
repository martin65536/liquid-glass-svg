"use client";

import { useRef, useState } from "react";
import { LiquidGlass, LiquidButton, LiquidSlider } from "@/components/liquid-glass";
import { type DestinationProps } from "../types";

/**
 * Faithful port of `destinations/GlassPlaygroundContent.kt`.
 *
 * A 256px glass square you can pan/zoom/rotate via multi-touch (pointer)
 * gestures, plus a bottom sheet of LiquidSliders that tune corner radius,
 * blur, refraction height/amount and chromatic aberration. Toggle/reset
 * buttons live at the bottom corners.
 */
export function GlassPlaygroundContent({}: DestinationProps) {
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [cornerRadiusFrac, setCornerRadiusFrac] = useState(0.5);
  const [blurRadius, setBlurRadius] = useState(0);
  const [refractionHeightFrac, setRefractionHeightFrac] = useState(0.2);
  const [refractionAmountFrac, setRefractionAmountFrac] = useState(0.2);

  // transform-gesture state
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    zoom: 1,
    rotation: 0,
  });
  const gestureRef = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    startTransform: typeof transform;
    startDist: number;
    startAngle: number;
  }>({ pointers: new Map(), startTransform: transform, startDist: 0, startAngle: 0 });

  const size = 256;
  const minDim = size;
  const radius = (size / 2) * cornerRadiusFrac;
  const refractionHeight = refractionHeightFrac * minDim * 0.5;
  const refractionAmount = refractionAmountFrac * minDim;

  const updateGesture = () => {
    const pts = [...gestureRef.current.pointers.values()];
    if (pts.length < 2) return;
    const dx = pts[1].x - pts[0].x;
    const dy = pts[1].y - pts[0].y;
    const dist = Math.hypot(dx, dy) || 1;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const start = gestureRef.current;
    const zoom = Math.max(
      0.3,
      Math.min(4, start.startTransform.zoom * (dist / (start.startDist || dist))),
    );
    const rotation = start.startTransform.rotation + (angle - start.startAngle);
    setTransform({ ...start.startTransform, zoom, rotation });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const m = new Map(gestureRef.current.pointers);
    m.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...m.values()];
    if (pts.length === 2) {
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      gestureRef.current = {
        pointers: m,
        startTransform: transform,
        startDist: Math.hypot(dx, dy),
        startAngle: (Math.atan2(dy, dx) * 180) / Math.PI,
      };
    } else if (pts.length === 1) {
      gestureRef.current = {
        pointers: m,
        startTransform: transform,
        startDist: 0,
        startAngle: 0,
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const m = new Map(gestureRef.current.pointers);
    if (!m.has(e.pointerId)) return;
    m.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gestureRef.current.pointers = m;
    const pts = [...m.values()];
    if (pts.length === 2) {
      updateGesture();
    } else if (pts.length === 1) {
      // pan
      setTransform((t) => ({
        ...t,
        x: gestureRef.current.startTransform.x + (e.clientX - pts[0].x),
        y: gestureRef.current.startTransform.y + (e.clientY - pts[0].y),
      }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const m = new Map(gestureRef.current.pointers);
    m.delete(e.pointerId);
    gestureRef.current.pointers = m;
    if (m.size === 1) {
      const [p] = [...m.values()];
      gestureRef.current.startTransform = transform;
      void p;
    }
  };

  const reset = () => {
    setTransform({ x: 0, y: 0, zoom: 1, rotation: 0 });
    setCornerRadiusFrac(0.5);
    setBlurRadius(0);
    setRefractionHeightFrac(0.2);
    setRefractionAmountFrac(0.2);
  };

  const sheetStyle: React.CSSProperties = {
    position: "relative",
    maxWidth: 420,
    margin: "0 auto",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    color: "#000",
    fontSize: 14,
  };

  return (
    <div style={{ position: "relative", minHeight: "70vh", paddingBottom: 120 }}>
      {/* the transformable glass square */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: 48,
          touchAction: "none",
        }}
      >
        <LiquidGlass
          radius={radius}
          refractionHeight={refractionHeight}
          refractionAmount={refractionAmount}
          depthEffect
          saturation={1.5}
          blur={blurRadius}
          highlight="default"
          highlightWidth={1.5}
          highlightAlpha={0.4}
          style={{
            width: size,
            height: size,
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom}) rotate(${transform.rotation}deg)`,
            transformOrigin: "center",
            touchAction: "none",
            cursor: "grab",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>

      {/* control sheet */}
      {sheetExpanded && (
        <div style={{ marginTop: 24, paddingInline: 16 }}>
          <LiquidGlass
            radius={32}
            refractionHeight={16}
            refractionAmount={32}
            saturation={1.5}
            blur={4}
            highlight="none"
            surfaceColor="rgba(255,255,255,0.5)"
            style={{ width: "100%" }}
          >
            <div style={sheetStyle}>
              <div style={rowStyle}>
                <span>Corner radius</span>
                <LiquidSlider
                  value={cornerRadiusFrac}
                  onChange={setCornerRadiusFrac}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>
              <div style={rowStyle}>
                <span>Blur radius</span>
                <LiquidSlider
                  value={blurRadius}
                  onChange={setBlurRadius}
                  min={0}
                  max={32}
                  step={0.5}
                />
              </div>
              <div style={rowStyle}>
                <span>Refraction height</span>
                <LiquidSlider
                  value={refractionHeightFrac}
                  onChange={setRefractionHeightFrac}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>
              <div style={rowStyle}>
                <span>Refraction amount</span>
                <LiquidSlider
                  value={refractionAmountFrac}
                  onChange={setRefractionAmountFrac}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>
            </div>
          </LiquidGlass>
        </div>
      )}

      {/* bottom-left toggle / bottom-right reset */}
      <div
        style={{
          position: "fixed",
          bottom: 80,
          left: 20,
          zIndex: 40,
        }}
      >
        <LiquidButton tint="#FF8D28" onClick={() => setSheetExpanded((s) => !s)}>
          {sheetExpanded ? "🔽" : "🔼"}
        </LiquidButton>
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 80,
          right: 20,
          zIndex: 40,
        }}
      >
        <LiquidButton tint="#FF8D28" onClick={reset}>
          Reset
        </LiquidButton>
      </div>
    </div>
  );
}
