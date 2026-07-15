"use client";

import { LiquidGlass } from "@/components/liquid-glass";
import { type DestinationProps } from "../types";

/** Faithful port of `destinations/ScrollContainerContent.kt`. */
export function ScrollContainerContent({}: DestinationProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxHeight: "70vh",
        overflowY: "auto",
        paddingRight: 4,
      }}
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <LiquidGlass
          key={i}
          radius={32}
          refractionHeight={16}
          refractionAmount={32}
          saturation={1.5}
          blur={0}
          highlight="default"
          highlightWidth={1.5}
          highlightAlpha={0.4}
          style={{ height: 160, width: "100%" }}
        />
      ))}
    </div>
  );
}
