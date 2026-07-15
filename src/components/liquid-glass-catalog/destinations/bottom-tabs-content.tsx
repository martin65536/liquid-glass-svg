"use client";

import { useMemo, useState } from "react";
import { LiquidBottomTabs, type TabItem } from "@/components/liquid-glass";
import { Plane, Sparkles, Palette, MousePointerClick } from "lucide-react";
import { demoColors, type DestinationProps } from "../types";

/** Faithful port of `destinations/BottomTabsContent.kt`. */
export function BottomTabsContent({ dark }: DestinationProps) {
  const c = demoColors(dark);
  const [tabA, setTabA] = useState(0);
  const [tabB, setTabB] = useState(0);

  const tabs3 = useMemo<TabItem[]>(
    () => [
      { id: "t1", label: "Tab 1", icon: <Plane size={22} /> },
      { id: "t2", label: "Tab 2", icon: <Plane size={22} /> },
      { id: "t3", label: "Tab 3", icon: <Plane size={22} /> },
    ],
    [],
  );
  const tabs4 = useMemo<TabItem[]>(
    () => [
      { id: "h", label: "Home", icon: <Plane size={20} /> },
      { id: "s", label: "Search", icon: <Sparkles size={20} /> },
      { id: "p", label: "Plan", icon: <Palette size={20} /> },
      { id: "m", label: "Me", icon: <MousePointerClick size={20} /> },
    ],
    [],
  );

  const iconColor = dark ? "#fff" : "#000";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ paddingInline: 36 }}>
        <LiquidBottomTabs
          tabs={tabs3.map((t) => ({ ...t, icon: <Plane size={22} color={iconColor} /> }))}
          selected={tabA}
          onSelect={setTabA}
          accentColor={c.accentColor}
        />
      </div>
      <div style={{ paddingInline: 36 }}>
        <LiquidBottomTabs
          tabs={tabs4.map((t) => ({
            ...t,
            icon:
              t.id === "h" ? <Plane size={20} color={iconColor} /> :
              t.id === "s" ? <Sparkles size={20} color={iconColor} /> :
              t.id === "p" ? <Palette size={20} color={iconColor} /> :
              <MousePointerClick size={20} color={iconColor} />,
          }))}
          selected={tabB}
          onSelect={setTabB}
          accentColor={c.accentColor}
        />
      </div>
    </div>
  );
}
