"use client";

import { useId, useRef } from "react";
import { useGlass, type UseGlassOptions } from "./use-glass";
import { vibrancyMatrix } from "@/lib/liquid-glass/maps";

export interface LiquidGlassProps
  extends UseGlassOptions,
    React.HTMLAttributes<HTMLDivElement> {
  /** Corner radius in px (also drives the SDF). Applied as border-radius. */
  radius: number;
  /** Optional surface tint color drawn over the glass (e.g. white @ 30%). */
  surfaceColor?: string;
  /** Optional hue-tint color (drawn with mix-blend hue + color). */
  tintColor?: string;
  /** Drop shadow alpha (0..1). */
  shadowAlpha?: number;
  /** Inner shadow alpha (0..1). */
  innerShadowAlpha?: number;
  /** Add a subtle directional sheen across the body. */
  sheen?: boolean;
  children?: React.ReactNode;
}

/**
 * LiquidGlass — a faithful HTML port of Kyant0/AndroidLiquidGlass.
 *
 * The glass effect is an SVG `<filter>` applied via `backdrop-filter`:
 *   feColorMatrix (vibrancy) → feGaussianBlur → feImage (displacement map) →
 *   feDisplacementMap (lens refraction).
 *
 * The displacement map is the "svg filter image": a PNG generated on a canvas
 * whose R/G channels encode the rounded-rect SDF refraction from Shaders.kt.
 * Rim-light highlights and inner/drop shadows are layered on top.
 */
export function LiquidGlass({
  radius,
  refractionHeight,
  refractionAmount,
  depthEffect = false,
  saturation = 1.5,
  blur = 0,
  highlight = "default",
  highlightWidth = 2,
  highlightAngle = Math.PI / 4,
  highlightFalloff = 1,
  highlightAlpha = 1,
  surfaceColor,
  tintColor,
  shadowAlpha = 0,
  innerShadowAlpha = 0,
  sheen = true,
  children,
  style,
  className,
  ...rest
}: LiquidGlassProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const filterId = `lg-filter-${reactId.replace(/[:]/g, "")}`;
  const maps = useGlass(ref, {
    radius,
    refractionHeight,
    refractionAmount,
    depthEffect,
    saturation,
    blur,
    highlight,
    highlightWidth,
    highlightAngle,
    highlightFalloff,
    highlightAlpha,
  });

  const W = maps.width;
  const H = maps.height;
  const satMatrix = vibrancyMatrix(saturation).join(" ");
  const hasRefraction = maps.displacementUrl !== "" && maps.scale > 0;

  // Compose the backdrop-filter: prefer the SVG filter (does blur + vibrancy +
  // refraction). Fall back to plain CSS blur+saturate while the maps are not
  // ready yet.
  const backdropFilter = hasRefraction
    ? `url(#${filterId})`
    : `blur(${blur}px) saturate(${saturation})`;

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
          {/* vibrancy: saturate the backdrop */}
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values={satMatrix}
            result="vibrant"
          />
          {/* blur (or pass-through so the chain keeps a named result) */}
          {blur > 0 ? (
            <feGaussianBlur
              in="vibrant"
              stdDeviation={blur}
              result="stage1"
            />
          ) : (
            <feOffset in="vibrant" dx={0} dy={0} result="stage1" />
          )}
          {/* lens refraction via a generated displacement-map image */}
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

      <div
        ref={ref}
        className={className}
        style={{
          position: "relative",
          borderRadius: radius,
          overflow: "hidden",
          isolation: "isolate",
          WebkitBackdropFilter: backdropFilter,
          backdropFilter,
          boxShadow: [
            shadowAlpha > 0
              ? `0 8px 24px rgba(0,0,0,${shadowAlpha})`
              : "",
            innerShadowAlpha > 0
              ? `inset 0 1px 1px rgba(255,255,255,${innerShadowAlpha}), inset 0 -1px 2px rgba(0,0,0,${innerShadowAlpha * 0.7})`
              : "",
          ]
            .filter(Boolean)
            .join(", "),
          ...style,
        }}
        {...rest}
      >
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

        {/* hue tint (two layers mirror the AGSL onDrawSurface: Hue + color) */}
        {tintColor ? (
          <>
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: tintColor,
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
                background: tintColor,
                opacity: 0.75,
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
          </>
        ) : null}

        {/* directional sheen for depth */}
        {sheen ? (
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
        ) : null}

        {/* rim-light highlight (lit side, white, Plus blend) */}
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
              zIndex: 2,
            }}
          />
        ) : null}

        {/* ambient shadow rim (dark side) */}
        {maps.shadowUrl ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${maps.shadowUrl})`,
              backgroundSize: "100% 100%",
              filter: `blur(${maps.highlightBlurRadius}px)`,
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
        ) : null}

        {/* crisp inner outline so the glass edge stays defined */}
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
        <div style={{ position: "relative", zIndex: 4, height: "100%" }}>
          {children}
        </div>
      </div>
    </>
  );
}
