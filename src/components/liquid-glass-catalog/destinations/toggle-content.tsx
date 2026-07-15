"use client";

import { useState } from "react";
import { LiquidToggle } from "@/components/liquid-glass";
import { demoColors, type DestinationProps } from "../types";

/** Faithful port of `destinations/ToggleContent.kt`. */
export function ToggleContent({ dark }: DestinationProps) {
  const c = demoColors(dark);
  const [selected, setSelected] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <LiquidToggle
        checked={selected}
        onChange={setSelected}
        accentColor={c.accentGreen}
        trackColor={c.trackColor}
        style={{ marginInline: 32 }}
      />

      {/* A solid card variant so the glass knob refracts a flat color too. */}
      <div
        style={{
          margin: 24,
          borderRadius: 32,
          background: c.backgroundColor,
          padding: 24,
        }}
      >
        <LiquidToggle
          checked={selected}
          onChange={setSelected}
          accentColor={c.accentGreen}
          trackColor={c.trackColor}
          style={{ marginInline: 32 }}
        />
      </div>
    </div>
  );
}
