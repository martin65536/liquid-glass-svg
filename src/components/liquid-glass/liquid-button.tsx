"use client";

import { useState } from "react";
import { LiquidGlass } from "./liquid-glass";

export interface LiquidButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  /** Hue tint color (e.g. "#0091FF"). */
  tint?: string;
  /** Surface fill color (e.g. "rgba(255,255,255,0.3)"). */
  surfaceColor?: string;
  /** Press scale animation on click. */
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A capsule liquid-glass button — port of LiquidButton.kt.
 * Effects: vibrancy + blur(2) + lens(12, 24). Press springs a subtle scale.
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
  const [pressed, setPressed] = useState(false);
  const height = 48;
  const radius = height / 2; // capsule

  return (
    <LiquidGlass
      radius={radius}
      refractionHeight={12}
      refractionAmount={24}
      saturation={1.5}
      blur={2}
      highlight="default"
      highlightWidth={1.5}
      highlightAlpha={0.5}
      tintColor={tint}
      surfaceColor={surfaceColor}
      shadowAlpha={0.12}
      innerShadowAlpha={0.18}
      onClick={interactive ? onClick : undefined}
      onMouseDown={() => interactive && setPressed(true)}
      onMouseUp={() => interactive && setPressed(false)}
      onMouseLeave={() => interactive && setPressed(false)}
      onTouchStart={() => interactive && setPressed(true)}
      onTouchEnd={() => interactive && setPressed(false)}
      role="button"
      tabIndex={0}
      data-interactive={interactive ? "true" : "false"}
      className={className}
      style={{
        height,
        paddingInline: 16,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: interactive ? "pointer" : "default",
        userSelect: "none",
        transition:
          "transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms ease",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: tint ? "#fff" : "inherit",
          textShadow: tint ? "0 1px 1px rgba(0,0,0,0.18)" : "none",
          letterSpacing: 0.1,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
    </LiquidGlass>
  );
}
