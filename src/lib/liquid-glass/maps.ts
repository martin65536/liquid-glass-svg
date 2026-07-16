/**
 * Liquid Glass map generator.
 *
 * The Android library runs AGSL `RuntimeShader`s per pixel to refract the
 * backdrop and to draw the rim-light highlight. Browsers cannot run AGSL, so
 * we faithfully re-evaluate the *same* SDF math on a <canvas> to produce a
 * displacement map that is consumed by an SVG `<feImage>` + `<feDisplacementMap>`
 * filter.
 *
 * Performance: the displacement map and the highlight rim are generated
 * independently and cached by their own keys. The highlight is always
 * generated at full alpha (its shape/width/angle never change) and the
 * caller scales its opacity via CSS — so dragging the toggle (which only
 * changes highlightAlpha and refraction params) never re-rasters the rim.
 */

import {
  circleMap,
  gradSdRoundedRect,
  sdRoundedRect,
} from "./sdf";

export type HighlightMode = "none" | "default" | "ambient";

export interface GlassMapOptions {
  /** CSS-pixel size of the element. */
  width: number;
  height: number;
  /** Corner radius (px). Use min(w,h)/2 for a capsule. */
  radius: number;
  /** Lens refraction band height (px). */
  refractionHeight: number;
  /** Lens refraction magnitude (px, positive). Samples inward. */
  refractionAmount: number;
  /** Adds a subtle radial lens pull toward the center (AGSL depthEffect). */
  depthEffect?: boolean;
  /** Saturate the backdrop (vibrancy from ColorFilter.kt, saturation 1.5). */
  saturation?: number;
  /** Gaussian blur radius applied to the backdrop (px, std deviation). */
  blur?: number;
  /** Highlight style. */
  highlight?: HighlightMode;
  /** Highlight stroke width (px, full stroke). Visible inner half = width/2. */
  highlightWidth?: number;
  /** Highlight blur radius (px), applied in CSS. Default = highlightWidth/4. */
  highlightBlurRadius?: number;
  /** Highlight direction angle (radians). Default 45deg. */
  highlightAngle?: number;
  /** Highlight falloff exponent. Default 1. */
  highlightFalloff?: number;
  /** Overall highlight alpha (0..1), e.g. press progress. */
  highlightAlpha?: number;
}

export interface GlassMaps {
  /** PNG data URI fed to <feImage> as the displacement map. */
  displacementUrl: string;
  /** feDisplacementMap `scale` that matches the encoded displacement. */
  scale: number;
  /** White rim-light overlay (color+alpha baked in). */
  litUrl: string | null;
  /** Black shadow rim overlay (color+alpha baked in). */
  shadowUrl: string | null;
  /** CSS blur to apply on the highlight overlay (px). */
  highlightBlurRadius: number;
  /** A short cache key describing the inputs. */
  key: string;
}

function toDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

/* ------------------------------------------------------------------ */
/*  Highlight rim (always full-alpha; caller scales via CSS opacity). */
/*  Cached by (W,H,r,width,angle,falloff,mode) — independent of alpha. */
/* ------------------------------------------------------------------ */

interface HighlightKey {
  W: number;
  H: number;
  r: number;
  width: number;
  angle: number;
  falloff: number;
  mode: "default" | "ambient";
}

const highlightCache = new Map<string, { lit: string; shadow: string | null }>();

function highlightKey(k: HighlightKey): string {
  return [k.W, k.H, k.r.toFixed(2), k.width.toFixed(3), k.angle.toFixed(4), k.falloff, k.mode].join("|");
}

/**
 * Generate the highlight rim at full alpha. 2× supersample + single bilinear
 * downsample (the CSS `filter: blur()` softens the edge further, so 2× is
 * enough and keeps it fast).
 */
function generateHighlight(k: HighlightKey): { lit: string; shadow: string | null } {
  const cached = highlightCache.get(highlightKey(k));
  if (cached) return cached;
  const { W, H, r, width, angle, falloff, mode } = k;

  const SS = 2;
  const W2 = W * SS;
  const H2 = H * SS;
  const halfW2 = W2 / 2;
  const halfH2 = H2 / 2;
  const r2 = r * SS;
  const gradRadius2 = Math.min(r2 * 1.5, Math.min(halfW2, halfH2));
  const strokeVisible2 = Math.max(0.5, width / 2) * SS;
  const normalX = Math.cos(angle);
  const normalY = Math.sin(angle);

  const lit2 = document.createElement("canvas");
  lit2.width = W2;
  lit2.height = H2;
  const lctx2 = lit2.getContext("2d")!;
  const litImg2 = lctx2.createImageData(W2, H2);

  const shadow2 = document.createElement("canvas");
  shadow2.width = W2;
  shadow2.height = H2;
  const sctx2 = shadow2.getContext("2d")!;
  const shadowImg2 = sctx2.createImageData(W2, H2);

  for (let y = 0; y < H2; y++) {
    for (let x = 0; x < W2; x++) {
      const cx = x - halfW2 + 0.5;
      const cy = y - halfH2 + 0.5;
      const sd = sdRoundedRect(cx, cy, halfW2, halfH2, r2);
      const insideDist = -sd;
      const edgeWeight =
        insideDist <= 0 ? 0 : insideDist <= strokeVisible2 ? 1 : 0;
      if (edgeWeight <= 0.001) continue;

      const idx = (y * W2 + x) * 4;
      const [gx, gy] = gradSdRoundedRect(cx, cy, halfW2, halfH2, gradRadius2);
      const dot = gx * normalX + gy * normalY;
      const intensity = Math.pow(Math.abs(dot), falloff);
      // Full alpha (255) — caller scales via CSS opacity.
      const a = Math.round(255 * intensity * edgeWeight);

      if (mode === "default") {
        litImg2.data[idx] = 255;
        litImg2.data[idx + 1] = 255;
        litImg2.data[idx + 2] = 255;
        litImg2.data[idx + 3] = a;
      } else {
        // Ambient: lit side white (t=1), shadow side black (t=0).
        // AGSL: half4(t,t,t,1) * intensity  →  alpha = intensity.
        if (dot >= 0) {
          litImg2.data[idx] = 255;
          litImg2.data[idx + 1] = 255;
          litImg2.data[idx + 2] = 255;
          litImg2.data[idx + 3] = a;
        } else {
          shadowImg2.data[idx] = 0;
          shadowImg2.data[idx + 1] = 0;
          shadowImg2.data[idx + 2] = 0;
          shadowImg2.data[idx + 3] = a;
        }
      }
    }
  }
  lctx2.putImageData(litImg2, 0, 0);
  sctx2.putImageData(shadowImg2, 0, 0);

  // Downsample 2× → 1×.
  const lit = document.createElement("canvas");
  lit.width = W;
  lit.height = H;
  const lctx = lit.getContext("2d")!;
  lctx.imageSmoothingEnabled = true;
  lctx.imageSmoothingQuality = "high";
  lctx.drawImage(lit2, 0, 0, W, H);

  const result: { lit: string; shadow: string | null } = { lit: toDataUrl(lit), shadow: null };
  if (mode === "ambient") {
    const shadow = document.createElement("canvas");
    shadow.width = W;
    shadow.height = H;
    const sctx = shadow.getContext("2d")!;
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(shadow2, 0, 0, W, H);
    result.shadow = toDataUrl(shadow);
  }

  if (highlightCache.size > 64) highlightCache.clear();
  highlightCache.set(highlightKey(k), result);
  return result;
}

/* ------------------------------------------------------------------ */
/*  Displacement map (cached by size + refraction params).            */
/* ------------------------------------------------------------------ */

const dispCache = new Map<string, { url: string; scale: number }>();

function dispKey(opts: {
  W: number;
  H: number;
  r: number;
  refractionHeight: number;
  refractionAmount: number;
  depthEffect: boolean;
}): string {
  return [
    opts.W,
    opts.H,
    opts.r.toFixed(2),
    opts.refractionHeight.toFixed(2),
    opts.refractionAmount.toFixed(2),
    opts.depthEffect ? 1 : 0,
  ].join("|");
}

function generateDisplacement(opts: {
  W: number;
  H: number;
  r: number;
  refractionHeight: number;
  refractionAmount: number;
  depthEffect: boolean;
}): { url: string; scale: number } {
  const key = dispKey(opts);
  const cached = dispCache.get(key);
  if (cached) return cached;

  const { W, H, r, refractionHeight, refractionAmount, depthEffect } = opts;
  const halfW = W / 2;
  const halfH = H / 2;
  const h = Math.max(0.0001, refractionHeight);
  const gradRadius = Math.min(r * 1.5, Math.min(halfW, halfH));
  const scale = Math.max(1, 2 * refractionAmount);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(W, H);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const cx = x - halfW + 0.5;
      const cy = y - halfH + 0.5;
      const idx = (y * W + x) * 4;
      const sd = sdRoundedRect(cx, cy, halfW, halfH, r);
      const insideDist = -sd;
      let dx = 0;
      let dy = 0;
      if (insideDist < h) {
        const sdClamped = Math.min(sd, 0);
        const xx = 1 - -sdClamped / h;
        const d = circleMap(xx) * -refractionAmount;
        let [gx, gy] = gradSdRoundedRect(cx, cy, halfW, halfH, gradRadius);
        if (depthEffect) {
          const cl = Math.hypot(cx, cy) || 1e-6;
          gx += cx / cl;
          gy += cy / cl;
          const gl = Math.hypot(gx, gy) || 1e-6;
          gx /= gl;
          gy /= gl;
        }
        dx = d * gx;
        dy = d * gy;
      }
      img.data[idx] = Math.max(0, Math.min(255, Math.round((0.5 + dx / scale) * 255)));
      img.data[idx + 1] = Math.max(0, Math.min(255, Math.round((0.5 + dy / scale) * 255)));
      img.data[idx + 2] = 128;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const result = { url: toDataUrl(canvas), scale };
  if (dispCache.size > 64) dispCache.clear();
  dispCache.set(key, result);
  return result;
}

/* ------------------------------------------------------------------ */
/*  Main entry: combine displacement + highlight (independent caches). */
/* ------------------------------------------------------------------ */

const cache = new Map<string, GlassMaps>();

export function generateGlassMaps(opts: GlassMapOptions): GlassMaps {
  const {
    width,
    height,
    radius,
    refractionHeight,
    refractionAmount,
    depthEffect = false,
    saturation = 1.5,
    blur = 0,
    highlight = "default",
    highlightWidth = 2,
    highlightBlurRadius = highlightWidth / 4,
    highlightAngle = Math.PI / 4,
    highlightFalloff = 1,
    highlightAlpha = 1,
  } = opts;

  const key = [
    "lg",
    Math.round(width),
    Math.round(height),
    radius.toFixed(2),
    refractionHeight.toFixed(2),
    refractionAmount.toFixed(2),
    depthEffect ? 1 : 0,
    saturation.toFixed(2),
    blur.toFixed(2),
    highlight,
    highlightWidth.toFixed(2),
    highlightBlurRadius.toFixed(3),
    highlightAngle.toFixed(3),
    highlightFalloff.toFixed(2),
    highlightAlpha.toFixed(3),
  ].join("|");

  const cached = cache.get(key);
  if (cached) return cached;

  const W = Math.max(1, Math.round(width));
  const H = Math.max(1, Math.round(height));
  const r = Math.max(0, Math.min(radius, Math.min(W, H) / 2));

  // Displacement map (cached independently).
  const hasRefraction = refractionAmount > 0.01 && refractionHeight > 0.01;
  const disp = hasRefraction
    ? generateDisplacement({ W, H, r, refractionHeight, refractionAmount, depthEffect })
    : { url: "", scale: 0 };

  // Highlight rim (cached independently, always full alpha).
  const needHighlight = highlight !== "none" && highlightAlpha > 0;
  let litUrl: string | null = null;
  let shadowUrl: string | null = null;
  if (needHighlight && (highlight === "default" || highlight === "ambient")) {
    const hl = generateHighlight({
      W,
      H,
      r,
      width: highlightWidth,
      angle: highlightAngle,
      falloff: highlightFalloff,
      mode: highlight,
    });
    litUrl = hl.lit;
    shadowUrl = hl.shadow;
  }

  const maps: GlassMaps = {
    displacementUrl: disp.url,
    scale: disp.scale,
    litUrl,
    shadowUrl,
    highlightBlurRadius,
    key,
  };
  if (cache.size > 128) cache.clear();
  cache.set(key, maps);
  return maps;
}

/**
 * Vibrancy color matrix (saturation 1.5), ported from ColorFilter.kt
 * `colorControlsColorFilter(saturation = 1.5f)`. Returns a 20-value
 * feColorMatrix row-major array.
 */
export function vibrancyMatrix(saturation = 1.5): number[] {
  const invSat = 1 - saturation;
  const r = 0.213 * invSat;
  const g = 0.715 * invSat;
  const b = 0.072 * invSat;
  const s = saturation;
  return [
    r + s, g, b, 0, 0,
    r, g + s, b, 0, 0,
    r, g, b + s, 0, 0,
    0, 0, 0, 1, 0,
  ];
}
