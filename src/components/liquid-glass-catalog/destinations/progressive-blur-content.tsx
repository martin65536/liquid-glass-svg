"use client";

import { type DestinationProps } from "../types";

/**
 * Faithful port of `destinations/ProgressiveBlurContent.kt`.
 *
 * A horizontal bar whose blur fades from full (bottom) to none (top) using an
 * alpha mask — implemented here as a stacked backdrop-blur with a gradient
 * mask, plus a tint overlay.
 */
export function ProgressiveBlurContent({ dark }: DestinationProps) {
  const contentColor = dark ? "#fff" : "#000";
  const tintColor = dark ? "#808080" : "#ffffff";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          position: "relative",
          height: 128,
          width: "100%",
          maxWidth: 640,
          borderRadius: 16,
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          color: contentColor,
          fontSize: 16,
          fontWeight: 500,
        }}
      >
        {/* progressively stronger blur toward the top via layered masks */}
        {[12, 8, 4, 1].map((b, i) => (
          <div
            key={i}
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backdropFilter: `blur(${b}px) saturate(1.4)`,
              WebkitBackdropFilter: `blur(${b}px) saturate(1.4)`,
              // mask so each layer covers a horizontal band, strongest at top
              WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,${
                1 - i * 0.22
              }) ${i * 22}%, transparent ${(i + 1) * 22}%)`,
              maskImage: `linear-gradient(to bottom, rgba(0,0,0,${
                1 - i * 0.22
              }) ${i * 22}%, transparent ${(i + 1) * 22}%)`,
            }}
          />
        ))}
        {/* tint overlay, stronger at top (matches tintAlpha smoothstep) */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: tintColor,
            opacity: 0.45,
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent 60%)",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent 60%)",
          }}
        />
        <span style={{ position: "relative", zIndex: 1 }}>
          alpha-masked progressive blur
        </span>
      </div>
    </div>
  );
}
