"use client";

import { LiquidButton } from "@/components/liquid-glass";
import { type DestinationProps } from "../types";

/**
 * Faithful port of `destinations/ButtonsContent.kt`.
 *
 * A centered vertical Column with 16dp spacing and four LiquidButtons:
 * transparent, surface (white 0.3), tinted blue (#0088FF), tinted orange
 * (#FF8D28). Text is black for the non-tinted buttons (matches the original
 * `TextStyle(Color.Black, 15f.sp)`).
 */
export function ButtonsContent({}: DestinationProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <LiquidButton onClick={() => {}}>
        <span style={{ color: "#000" }}>Transparent Liquid Button</span>
      </LiquidButton>
      <LiquidButton surfaceColor="rgba(255,255,255,0.3)" onClick={() => {}}>
        <span style={{ color: "#000" }}>Surface Liquid Button</span>
      </LiquidButton>
      <LiquidButton tint="#0088FF" onClick={() => {}}>
        Tinted Liquid Button
      </LiquidButton>
      <LiquidButton tint="#FF8D28" onClick={() => {}}>
        Tinted Liquid Button
      </LiquidButton>
    </div>
  );
}
