"use client";

import { useEffect, useRef, useState } from "react";
import { LiquidGlass } from "@/components/liquid-glass";
import { type DestinationProps } from "../types";

/**
 * Faithful port of `destinations/AdaptiveLuminanceGlassContent.kt`.
 *
 * The original samples the rendered glass layer's average luminance each frame
 * and adapts brightness/contrast/blur + text color. We approximate by sampling
 * the wallpaper image under the glass and averaging its luminance, then tuning
 * the glass effects accordingly.
 */
export function AdaptiveLuminanceGlassContent({
  dark,
  wallpaperUrl,
}: DestinationProps) {
  const [luminance, setLuminance] = useState(dark ? 0 : 1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sample the wallpaper luminance periodically.
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = wallpaperUrl;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 5;
      canvas.height = 5;
      ctx.drawImage(img, 0, 0, 5, 5);
      try {
        const data = ctx.getImageData(0, 0, 5, 5).data;
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
        }
        const avg = sum / (data.length / 4);
        if (!cancelled) setLuminance(avg);
      } catch {
        /* cross-origin tainted — keep default */
      }
    };
    return () => {
      cancelled = true;
    };
  }, [wallpaperUrl]);

  // Map luminance to effect params (mirrors the AGSL adaptive curve).
  const l = Math.sign(luminance * 2 - 1) * Math.pow(Math.abs(luminance * 2 - 1), 2);
  const brightness = l > 0 ? 0.1 + 0.4 * l : 0.1 - 0.2 * -l;
  const blur = l > 0 ? 8 + 8 * l : 8 - 6 * -l;
  const textCol = luminance > 0.5 ? "#000" : "#fff";

  // pointer transform gestures (single-touch pan + wheel zoom)
  const gestureRef = useRef({ x: 0, y: 0, start: { x: 0, y: 0, zoom: 1, rot: 0 } });
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    gestureRef.current = {
      x: e.clientX,
      y: e.clientY,
      start: { x: offset.x, y: offset.y, zoom, rot: rotation },
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    setOffset({
      x: gestureRef.current.start.x + (e.clientX - gestureRef.current.x),
      y: gestureRef.current.start.y + (e.clientY - gestureRef.current.y),
    });
  };

  const size = 160;

  return (
    <div
      style={{
        position: "relative",
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        touchAction: "none",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <LiquidGlass
        radius={24}
        refractionHeight={24}
        refractionAmount={size / 2}
        depthEffect
        saturation={1.5}
        blur={blur}
        highlight="default"
        highlightWidth={1.5}
        highlightAlpha={0.4}
        style={{
          width: size,
          height: size,
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
          cursor: "grab",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onWheel={(e) => {
          setZoom((z) => Math.max(0.5, Math.min(3, z - e.deltaY * 0.001)));
        }}
      >
        <div
          style={{
            height: "100%",
            display: "grid",
            placeItems: "center",
            color: textCol,
            fontSize: 16,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          luminance:
          <br />
          {Math.round(luminance * 100) / 100}
        </div>
      </LiquidGlass>
      <div
        style={{
          position: "absolute",
          bottom: 16,
          width: "100%",
          textAlign: "center",
          fontSize: 13,
          opacity: 0.7,
          color: dark ? "#fff" : "#000",
        }}
      >
        Drag to pan · scroll to zoom · glass adapts to backdrop luminance.
      </div>
    </div>
  );
}
