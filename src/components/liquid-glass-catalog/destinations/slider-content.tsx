"use client";

import { useState } from "react";
import { LiquidSlider } from "@/components/liquid-glass";
import { demoColors, type DestinationProps } from "../types";

/** Faithful port of `destinations/SliderContent.kt`. */
export function SliderContent({ dark }: DestinationProps) {
  const c = demoColors(dark);
  const [value, setValue] = useState(50);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <LiquidSlider
        value={value}
        onChange={setValue}
        min={0}
        max={100}
        accentColor={c.accentColor}
        trackColor={c.trackColor}
        style={{ marginInline: 32 }}
      />

      <div
        style={{
          margin: 24,
          borderRadius: 32,
          background: c.backgroundColor,
          padding: 24,
          width: "100%",
          maxWidth: 460,
        }}
      >
        <LiquidSlider
          value={value}
          onChange={setValue}
          min={0}
          max={100}
          accentColor={c.accentColor}
          trackColor={c.trackColor}
        />
      </div>
    </div>
  );
}
