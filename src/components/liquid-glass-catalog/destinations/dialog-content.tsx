"use client";

import { LiquidGlass } from "@/components/liquid-glass";
import { LOREM_IPSUM } from "../lorem-ipsum";
import { demoColors, type DestinationProps } from "../types";

/**
 * Faithful port of `destinations/DialogContent.kt`.
 *
 * A rounded-rect glass dialog with a dimmed backdrop, a title, lorem body,
 * and two capsule action buttons (Cancel / Okay).
 */
export function DialogContent({ dark }: DestinationProps) {
  const c = demoColors(dark);

  return (
    <div
      style={{
        position: "relative",
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
      }}
    >
      {/* dim overlay (drawWithContent + drawRect(dimColor) in the original) */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: c.dimColor,
          zIndex: 0,
        }}
      />

      <LiquidGlass
        radius={48}
        refractionHeight={24}
        refractionAmount={48}
        depthEffect
        saturation={1.5}
        blur={dark ? 8 : 16}
        highlight="none"
        surfaceColor={c.containerStrong}
        shadowAlpha={0.25}
        innerShadowAlpha={0.15}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 460,
          padding: "0 0 24px",
        }}
      >
        <div style={{ padding: "28px 28px 12px", fontSize: 24, fontWeight: 500, color: c.contentColor }}>
          Dialog Title
        </div>
        <div
          style={{
            padding: "12px 24px",
            fontSize: 15,
            lineHeight: 1.5,
            color: c.contentColor,
            opacity: 0.68,
            mixBlendMode: dark ? "plus-lighter" : "normal",
          }}
        >
          {LOREM_IPSUM}
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            padding: "12px 24px 0",
          }}
        >
          <button
            style={{
              flex: 1,
              height: 48,
              borderRadius: 24,
              border: "none",
              cursor: "pointer",
              background: "rgba(255,255,255,0.2)",
              color: c.contentColor,
              fontSize: 16,
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            style={{
              flex: 1,
              height: 48,
              borderRadius: 24,
              border: "none",
              cursor: "pointer",
              background: c.accentColor,
              color: "#fff",
              fontSize: 16,
              fontFamily: "inherit",
            }}
          >
            Okay
          </button>
        </div>
      </LiquidGlass>
    </div>
  );
}
