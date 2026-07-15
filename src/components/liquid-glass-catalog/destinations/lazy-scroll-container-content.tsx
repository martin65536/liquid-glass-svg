"use client";

import { useEffect, useRef, useState } from "react";
import { LiquidGlass } from "@/components/liquid-glass";
import { type DestinationProps } from "../types";

/** Faithful port of `destinations/LazyScrollContainerContent.kt`. */
export function LazyScrollContainerContent({}: DestinationProps) {
  const [count, setCount] = useState(20);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCount((c) => Math.min(c + 20, 100));
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
      {Array.from({ length: count }).map((_, i) => (
        <LiquidGlass
          key={i}
          radius={32}
          refractionHeight={16}
          refractionAmount={32}
          saturation={1.5}
          highlight="default"
          highlightWidth={1.5}
          highlightAlpha={0.4}
          style={{ height: 160, width: "100%" }}
        />
      ))}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
}
