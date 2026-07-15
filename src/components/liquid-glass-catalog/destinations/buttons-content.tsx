"use client";

import { LiquidButton } from "@/components/liquid-glass";
import { type DestinationProps } from "../types";

/** Faithful port of `destinations/ButtonsContent.kt`. */
export function ButtonsContent({ dark }: DestinationProps) {
  const textColor = dark ? "#000" : "#000";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <LiquidButton>
        <span style={{ color: textColor }}>Transparent Liquid Button</span>
      </LiquidButton>
      <LiquidButton surfaceColor="rgba(255,255,255,0.3)">
        <span style={{ color: textColor }}>Surface Liquid Button</span>
      </LiquidButton>
      <LiquidButton tint="#0088FF">Tinted Liquid Button</LiquidButton>
      <LiquidButton tint="#FF8D28">Tinted Liquid Button</LiquidButton>
    </div>
  );
}
