"use client";

import { useState } from "react";
import { LiquidToggle } from "@/components/liquid-glass";
import { demoColors, type DestinationProps } from "../types";

/**
 * Faithful port of `destinations/ToggleContent.kt`.
 * A Column centered (horizontally + vertically), 16dp gap, with a toggle and a
 * solid-color rounded card containing another toggle.
 */
export function ToggleContent({ dark }: DestinationProps) {
  const c = demoColors(dark);
  const [selected, setSelected] = useState(false);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        minHeight: "100%",
      }}
    >
      <LiquidToggle
        checked={selected}
        onChange={setSelected}
        accentColor={c.accentGreen}
        trackColor={c.trackColor}
      />

      <div
        style={{
          margin: 24,
          borderRadius: 32,
          background: c.backgroundColor,
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LiquidToggle
          checked={selected}
          onChange={setSelected}
          accentColor={c.accentGreen}
          trackColor={c.trackColor}
        />
      </div>
    </div>
  );
}
