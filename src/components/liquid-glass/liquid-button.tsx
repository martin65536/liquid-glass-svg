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

/**
 * LiquidButton — faithful port of `app/.../catalog/components/LiquidButton.kt`.
 *
 * Effects: vibrancy() + blur(2px) + lens(12px, 24px).
 * Interactive layer block (ported from LiquidButton.kt):
 *   - press scale: lerp(1, 1 + 4dp/h, pressProgress)
 *   - drag translation: maxOffset * tanh(0.05 * offset / maxOffset)
 *   - asymmetric drag scale: scaleX/Y grow along the drag direction
 * Plus the InteractiveHighlight radial glow that follows the pointer.
 */
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
  const glowId = `lg-btn-glow-${reactId.replace(/[:]/g, "")}`;

  const ih = useInteractiveHighlight();

  // Maps for the glass effect (vibrancy + blur + lens refraction).
  const maps = useGlass(ref, {
    radius: 24, // capsule (height/2); updated once measured
    refractionHeight: 12,
    refractionAmount: 24,
    saturation: 1.5,
    blur: 2,
    highlight: "default",
    highlightWidth: 1.5,
    highlightAlpha: 0.5,
  });

  const W = maps.width;
  const H = maps.height;
  const height = 48;
  const radius = height / 2; // capsule

  const satMatrix = vibrancyMatrix(1.5).join(" ");
  const hasRefraction = maps.displacementUrl !== "" && maps.scale > 0;
  const backdropFilter = hasRefraction
    ? `url(#${filterId})`
    : `blur(2px) saturate(1.5)`;

  // ---- InteractiveHighlight layer block (ported from LiquidButton.kt) ----
  const width = W || 1;
  const h = H || height;
  const minDim = Math.min(width, h);
  const maxDim = Math.max(width, h);
  const progress = ih.pressProgress;
  const scale = 1 + (4 / h) * progress; // 4dp press bulge
  const maxOffset = minDim;
  const initialDerivative = 0.05;
  const dx = ih.offset.x;
  const dy = ih.offset.y;
  const translationX = maxOffset * Math.tanh(initialDerivative * dx / maxOffset);
  const translationY = maxOffset * Math.tanh(initialDerivative * dy / maxOffset);
  const maxDragScale = 4 / h;
  const offsetAngle = Math.atan2(dy, dx);
  const dragX = Math.abs(Math.cos(offsetAngle) * dx / maxDim) * Math.min(width / h, 1);
  const dragY = Math.abs(Math.sin(offsetAngle) * dy / maxDim) * Math.min(h / width, 1);
  const scaleX = scale + maxDragScale * dragX;
  const scaleY = scale + maxDragScale * dragY;

  // Radial highlight glow position (clamped to element bounds).
  const glowCx = Math.max(0, Math.min(width, ih.position.x));
  const glowCy = Math.max(0, Math.min(h, ih.position.y));
  const glowR = minDim * 1.5;
  const glowAlpha = 0.15 * progress;
  const washAlpha = 0.08 * progress;

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
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
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
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values={satMatrix}
            result="vibrant"
          />
          <feGaussianBlur in="vibrant" stdDeviation={2} result="stage1" />
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

        {/* Radial highlight glow (InteractiveHighlight shader port). */}
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={glowAlpha} />
          <stop offset="60%" stopColor="#ffffff" stopOpacity={glowAlpha * 0.35} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>
      </svg>

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
          borderRadius: radius,
          overflow: "hidden",
          isolation: "isolate",
          cursor: interactive ? "pointer" : "default",
          userSelect: "none",
          WebkitBackdropFilter: backdropFilter,
          backdropFilter,
          // The transform is applied on an inner wrapper so the backdrop-filter
          // box stays put (transforming a backdrop-filtered element re-samples
          // the backdrop, which we want here — faithful to graphicsLayer).
          transform: interactive
            ? `translate(${translationX}px, ${translationY}px) scale(${scaleX}, ${scaleY})`
            : "none",
          transformOrigin: "center",
          transition: interactive
            ? "none"
            : "transform 220ms cubic-bezier(0.34,1.56,0.64,1)",
          ...style,
        }}
        {...pointerHandlers}
      >
        {/* InteractiveHighlight: full-rect white wash (BlendMode.Plus) */}
        {interactive && progress > 0.001 ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: "#ffffff",
              opacity: washAlpha,
              mixBlendMode: "plus-lighter",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        ) : null}

        {/* InteractiveHighlight: radial glow following the pointer */}
        {interactive && progress > 0.001 ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: glowCx - glowR,
              top: glowCy - glowR,
              width: glowR * 2,
              height: glowR * 2,
              background: `radial-gradient(circle, rgba(255,255,255,${glowAlpha}) 0%, rgba(255,255,255,${glowAlpha * 0.35}) 60%, rgba(255,255,255,0) 100%)`,
              mixBlendMode: "plus-lighter",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        ) : null}

        {/* surface tint */}
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

        {/* hue tint: Hue blend + 0.75-alpha color (onDrawSurface) */}
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
                background: tint,
                opacity: 0.75,
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
          </>
        ) : null}

        {/* directional sheen */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 32%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.06) 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* rim-light highlight */}
        {maps.litUrl ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${maps.litUrl})`,
              backgroundSize: "100% 100%",
              mixBlendMode: "plus-lighter",
              filter: "blur(0.75px)",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
        ) : null}

        {/* crisp inner outline */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.35), inset 0 0 0 0.5px rgba(0,0,0,0.08)",
            pointerEvents: "none",
            zIndex: 3,
          }}
        />

        {/* content */}
        <span
          style={{
            position: "relative",
            zIndex: 4,
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
      </div>
    </>
  );
}
