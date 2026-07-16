"use client";

import { useId, useRef } from "react";
import { useGlass } from "./use-glass";
import { useInteractiveHighlight } from "./use-interactive-highlight";
import { vibrancyMatrix } from "@/lib/liquid-glass/maps";

export interface LiquidButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  /** Hue tint color (e.g. "#0091FF"). Drawn as Hue blend + 0.75-alpha overlay. */
  tint?: string;
  /** Surface fill color (e.g. "rgba(255,255,255,0.3)"). */
  surfaceColor?: string;
  /** Press + drag spring tilt/scale (InteractiveHighlight). Default true. */
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  InteractiveHighlight glow texture (exact smoothstep, cached).     */
/* ------------------------------------------------------------------ */

const glowCache = new Map<number, string>();

/**
 * Generates a radial glow texture matching the AGSL smoothstep:
 *   intensity = smoothstep(radius, radius*0.5, dist)
 * where radius = minDim * 1.5. The texture is normalized to alpha=1 at
 * the center; the caller scales it via CSS opacity.
 */
function getGlowTexture(minDim: number): string {
  const radius = minDim * 1.5;
  const size = Math.ceil(radius * 2);
  const cached = glowCache.get(minDim);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      // smoothstep(radius, radius*0.5, dist) — reversed ramp
      let t = (dist - radius) / (radius * 0.5 - radius);
      t = Math.max(0, Math.min(1, t));
      const intensity = t * t * (3 - 2 * t);
      const idx = (y * size + x) * 4;
      img.data[idx] = 255;
      img.data[idx + 1] = 255;
      img.data[idx + 2] = 255;
      img.data[idx + 3] = Math.round(255 * intensity);
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL("image/png");
  if (glowCache.size > 32) glowCache.clear();
  glowCache.set(minDim, url);
  return url;
}

/* ------------------------------------------------------------------ */
/*  LiquidButton — faithful port of LiquidButton.kt                   */
/*                                                                    */
/*  Effects: vibrancy() + blur(2dp) + lens(12dp, 24dp)                */
/*  Shadow:  Shadow.Default  (radius 24dp, offset (0, 4dp), Black@0.1)*/
/*  Highlight: Highlight.Default (2px clipped stroke, White@0.5,      */
/*             0.25px blur, 45° directional, Plus blend)              */
/*  InteractiveHighlight: wash White@0.08*p + radial glow             */
/*             White@0.15*p, smoothstep, radius = minDim*1.5          */
/*                                                                    */
/*  Draw order (back → front):                                        */
/*    1. Drop shadow (box-shadow)                                     */
/*    2. Glass backdrop (backdrop-filter: vibrancy+blur+lens)         */
/*    3. Surface tint (tint Hue + tint@0.75 + surfaceColor)           */
/*    4. InteractiveHighlight wash + glow (Plus blend)                */
/*    5. Text content                                                 */
/*    6. Highlight rim (Plus blend, on top of text)                   */
/* ------------------------------------------------------------------ */

export function LiquidButton({
  children,
  onClick,
  tint,
  surfaceColor,
  interactive = true,
  className,
  style,
}: LiquidButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const filterId = `lg-btn-${reactId.replace(/[:]/g, "")}`;

  const ih = useInteractiveHighlight();

  // Glass maps: capsule (radius = height/2 = 24), lens(12, 24), blur 2,
  // vibrancy 1.5, Highlight.Default (2px stroke, 0.25px blur, 45°, White@0.5).
  const maps = useGlass(ref, {
    radius: 24,
    refractionHeight: 12,
    refractionAmount: 24,
    saturation: 1.5,
    blur: 2,
    highlight: "default",
    highlightWidth: 2,
    highlightBlurRadius: 0.25,
    highlightAngle: (45 * Math.PI) / 180,
    highlightFalloff: 1,
    highlightAlpha: 0.5,
  });

  const W = maps.width;
  const H = maps.height;
  const height = 48;
  const capsuleRadius = height / 2;

  const satMatrix = vibrancyMatrix(1.5).join(" ");
  const hasRefraction = maps.displacementUrl !== "" && maps.scale > 0;
  const backdropFilter = hasRefraction
    ? `url(#${filterId})`
    : `blur(2px) saturate(1.5)`;

  // Convert a hex tint color to an rgba() string at the given alpha.
  // Used for the second onDrawSurface rect: drawRect(tint.copy(alpha=0.75)).
  const tintRgba = (alpha: number): string | null => {
    if (!tint) return null;
    const m = tint.replace("#", "");
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // ---- InteractiveHighlight layer block (ported from LiquidButton.kt) ----
  const progress = ih.pressProgress;
  const w = W || 1;
  const h = H || height;
  const minDim = Math.min(w, h);
  const maxDim = Math.max(w, h);
  const scale = 1 + (4 / h) * progress; // 4dp press bulge
  const maxOffset = minDim;
  const initialDerivative = 0.05;
  const dx = ih.offset.x;
  const dy = ih.offset.y;
  const translationX = maxOffset * Math.tanh(initialDerivative * dx / maxOffset);
  const translationY = maxOffset * Math.tanh(initialDerivative * dy / maxOffset);
  const maxDragScale = 4 / h;
  const offsetAngle = Math.atan2(dy, dx);
  const dragX =
    Math.abs(Math.cos(offsetAngle) * dx / maxDim) * Math.min(w / h, 1);
  const dragY =
    Math.abs(Math.sin(offsetAngle) * dy / maxDim) * Math.min(h / w, 1);
  const scaleX = scale + maxDragScale * dragX;
  const scaleY = scale + maxDragScale * dragY;

  // InteractiveHighlight glow texture + position
  const glowR = minDim * 1.5;
  const glowCx = Math.max(0, Math.min(w, ih.position.x));
  const glowCy = Math.max(0, Math.min(h, ih.position.y));
  const glowUrl = progress > 0.001 ? getGlowTexture(minDim) : "";
  const glowOpacity = 0.15 * progress; // White@0.15*progress
  const washOpacity = 0.08 * progress; // White@0.08*progress

  const pointerHandlers = interactive
    ? {
        onPointerDown: (e: React.PointerEvent) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          ih.onPointerDown(e);
        },
        onPointerMove: ih.onPointerMove,
        onPointerUp: (e: React.PointerEvent) => {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
          ih.onPointerUp(e);
        },
        onPointerCancel: ih.onPointerUp,
      }
    : {};

  return (
    <>
      <svg
        aria-hidden
        width="0"
        height="0"
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
        }}
      >
        <filter
          id={filterId}
          filterUnits="userSpaceOnUse"
          primitiveUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={W || 1}
          height={H || 1}
          colorInterpolationFilters="sRGB"
        >
          {/* vibrancy: saturate 1.5 */}
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values={satMatrix}
            result="vibrant"
          />
          {/* blur 2px */}
          <feGaussianBlur in="vibrant" stdDeviation={2} result="stage1" />
          {/* lens refraction via canvas-baked displacement map */}
          {hasRefraction ? (
            <>
              <feImage
                href={maps.displacementUrl}
                x={0}
                y={0}
                width={W || 1}
                height={H || 1}
                preserveAspectRatio="none"
                result="disp"
              />
              <feDisplacementMap
                in="stage1"
                in2="disp"
                scale={maps.scale}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </>
          ) : null}
        </filter>
      </svg>

      {/* The button element. transform applies to everything (shadow + glass
          + content + highlight), matching graphicsLayer(layerBlock). */}
      <div
        ref={ref}
        className={className}
        role="button"
        tabIndex={0}
        data-interactive={interactive ? "true" : "false"}
        onClick={interactive ? onClick : undefined}
        style={{
          position: "relative",
          height,
          paddingInline: 16,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: capsuleRadius,
          overflow: "hidden",
          isolation: "isolate",
          cursor: interactive ? "pointer" : "default",
          userSelect: "none",
          // Allow press/drag gestures without scrolling the page on touch.
          touchAction: interactive ? "none" : "auto",
          // Glass backdrop (layer 2)
          WebkitBackdropFilter: backdropFilter,
          backdropFilter,
          // Drop shadow (layer 1) — Shadow.Default: 24px blur, 4px Y, Black@0.1
          boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          // Interactive transform (graphicsLayer)
          transform: interactive
            ? `translate(${translationX}px, ${translationY}px) scale(${scaleX}, ${scaleY})`
            : "none",
          transformOrigin: "center",
          ...style,
        }}
        {...pointerHandlers}
      >
        {/* Layer 3: Surface tint (onDrawSurface).
            Original LiquidButton.kt:
              drawRect(tint, blendMode = BlendMode.Hue)   // full-alpha tint, Hue blend
              drawRect(tint.copy(alpha = 0.75f))           // tint @ 0.75 alpha, normal src-over
            The Hue blend shifts the glass hue; the 0.75-alpha rect then lays a
            vivid but translucent color wash on top (25% wallpaper visible). */}
        {tint ? (
          <>
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: tint,
                mixBlendMode: "hue",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: tintRgba(0.75),
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
          </>
        ) : null}
        {surfaceColor ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: surfaceColor,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        ) : null}

        {/* Layer 4: InteractiveHighlight wash + glow (Plus blend) */}
        {interactive && progress > 0.001 ? (
          <>
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: "#ffffff",
                opacity: washOpacity,
                mixBlendMode: "plus-lighter",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: glowCx - glowR,
                top: glowCy - glowR,
                width: glowR * 2,
                height: glowR * 2,
                backgroundImage: `url(${glowUrl})`,
                backgroundSize: "100% 100%",
                opacity: glowOpacity,
                mixBlendMode: "plus-lighter",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
          </>
        ) : null}

        {/* Layer 5: Text content */}
        <span
          style={{
            position: "relative",
            zIndex: 2,
            fontSize: 15,
            fontWeight: 500,
            color: tint ? "#fff" : "inherit",
            textShadow: tint ? "0 1px 1px rgba(0,0,0,0.18)" : "none",
            letterSpacing: 0.1,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {children}
        </span>

        {/* Layer 6: Highlight rim (Highlight.Default — on top of text, Plus blend) */}
        {maps.litUrl ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${maps.litUrl})`,
              backgroundSize: "100% 100%",
              mixBlendMode: "plus-lighter",
              filter: `blur(${maps.highlightBlurRadius}px)`,
              pointerEvents: "none",
              zIndex: 3,
            }}
          />
        ) : null}
      </div>
    </>
  );
}
