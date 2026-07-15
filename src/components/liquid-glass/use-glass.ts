"use client";

import { useLayoutEffect, useState } from "react";
import { generateGlassMaps, type GlassMapOptions, type GlassMaps } from "@/lib/liquid-glass/maps";

export type UseGlassOptions = Omit<GlassMapOptions, "width" | "height">;

const EMPTY: GlassMaps = {
  displacementUrl: "",
  scale: 0,
  litUrl: null,
  shadowUrl: null,
  key: "",
};

/**
 * Measures a ref'd element and (re)generates the liquid-glass maps whenever
 * its size or any effect parameter changes. The maps are produced in a layout
 * effect so the SVG filter is ready before paint.
 */
export function useGlass<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  options: UseGlassOptions,
): GlassMaps {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [maps, setMaps] = useState<GlassMaps>(EMPTY);

  // Track size with ResizeObserver.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize((prev) => {
        if (
          Math.abs(prev.width - rect.width) < 0.5 &&
          Math.abs(prev.height - rect.height) < 0.5
        ) {
          return prev;
        }
        return { width: rect.width, height: rect.height };
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  // Regenerate maps when size or options change.
  useLayoutEffect(() => {
    if (size.width < 2 || size.height < 2) return;
    const raf = requestAnimationFrame(() => {
      const next = generateGlassMaps({ ...options, ...size });
      setMaps((prev) => (prev.key === next.key ? prev : next));
    });
    return () => cancelAnimationFrame(raf);
  }, [
    size.width,
    size.height,
    options.radius,
    options.refractionHeight,
    options.refractionAmount,
    options.depthEffect,
    options.saturation,
    options.blur,
    options.highlight,
    options.highlightWidth,
    options.highlightAngle,
    options.highlightFalloff,
    options.highlightAlpha,
  ]);

  return maps;
}
