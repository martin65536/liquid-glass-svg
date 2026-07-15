"use client";

import { useState } from "react";
import { LiquidGlass } from "./liquid-glass";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface LiquidBottomTabsProps {
  tabs: TabItem[];
  selected: number;
  onSelect: (index: number) => void;
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A capsule liquid-glass bottom-tab bar — port of LiquidBottomTabs.kt.
 * The selected indicator is a liquid-glass capsule that slides between tabs.
 * The whole bar is itself a large liquid-glass capsule.
 */
export function LiquidBottomTabs({
  tabs,
  selected,
  onSelect,
  accentColor = "#0091FF",
  className,
  style,
}: LiquidBottomTabsProps) {
  const count = tabs.length;
  const [pressed, setPressed] = useState(false);
  const height = 64;
  const indicatorH = 56;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: height,
        ...style,
      }}
    >
      {/* Bar (liquid glass capsule) */}
      <LiquidGlass
        radius={height / 2}
        refractionHeight={24}
        refractionAmount={24}
        saturation={1.5}
        blur={8}
        highlight="default"
        highlightWidth={1.5}
        highlightAlpha={0.45}
        surfaceColor="rgba(250,250,250,0.4)"
        shadowAlpha={0.12}
        innerShadowAlpha={0.12}
        style={{
          position: "absolute",
          inset: 0,
          padding: 4,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${count}, 1fr)`,
            height: "100%",
            position: "relative",
          }}
        >
          {tabs.map((tab, i) => {
            const active = i === selected;
            return (
              <button
                key={tab.id}
                onClick={() => onSelect(i)}
                role="tab"
                aria-selected={active}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  color: active ? accentColor : "inherit",
                  opacity: active ? 1 : 0.7,
                  transition: "color 200ms ease, opacity 200ms ease",
                  fontFamily: "inherit",
                }}
              >
                {tab.icon ? (
                  <span style={{ display: "flex" }}>{tab.icon}</span>
                ) : null}
                <span style={{ fontSize: 12, fontWeight: 500 }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </LiquidGlass>

      {/* Sliding selected indicator (liquid glass capsule) */}
      <div
        style={{
          position: "absolute",
          top: (height - indicatorH) / 2,
          left: 4,
          width: `calc((100% - 8px) / ${count})`,
          height: indicatorH,
          transform: `translateX(${selected * 100}%)`,
          transition:
            "transform 420ms cubic-bezier(0.34,1.56,0.64,1)",
          pointerEvents: "none",
        }}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
      >
        <LiquidGlass
          radius={indicatorH / 2}
          refractionHeight={10}
          refractionAmount={14}
          saturation={1.5}
          blur={pressed ? 2 : 0}
          highlight="default"
          highlightWidth={1.6}
          highlightAlpha={pressed ? 0.9 : 0.5}
          surfaceColor="rgba(0,0,0,0.04)"
          shadowAlpha={pressed ? 0.18 : 0.1}
          innerShadowAlpha={pressed ? 0.4 : 0.12}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
