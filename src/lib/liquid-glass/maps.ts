/**
 * Liquid Glass map generator.
 *
 * The Android library runs AGSL `RuntimeShader`s per pixel to refract the
 * backdrop and to draw the rim-light highlight. Browsers cannot run AGSL, so
 * we faithfully re-evaluate the *same* SDF math on a <canvas> to produce two
 * kinds of images that are then consumed by an SVG `<filter>`:
 *
 *  1. A **displacement map** (PNG, R/G channels encode dx/dy) referenced by
 *     `<feImage>` + `<feDisplacementMap>`. This is the "svg filter image" that
 *     drives the lens refraction.
 *  2. **Highlight images** (PNG carrying color + alpha) used as overlay
 *     backgrounds to reproduce the Default / Ambient rim light.
 *
 * Everything here mirrors the AGSL uniforms and math from Shaders.kt /
 * HighlightStyle.kt so the look stays true to the source library.
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

const cache = new Map<string, GlassMaps>();

/**
 * Build (or fetch from cache) all the images needed for one glass element.
 * Pure DOM/canvas work — safe to call from a layout effect.
 */
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
    highlightAlpha.toFixed(2),
  ].join("|");

  const cached = cache.get(key);
  if (cached) return cached;

  const W = Math.max(1, Math.round(width));
  const H = Math.max(1, Math.round(height));
  const r = Math.max(0, Math.min(radius, Math.min(W, H) / 2));
  const halfW = W / 2;
  const halfH = H / 2;
  const h = Math.max(0.0001, refractionHeight);
  const gradRadius = Math.min(r * 1.5, Math.min(halfW, halfH));

  // feDisplacementMap displacement = scale * (channel - 0.5). To encode a
  // displacement of magnitude up to `refractionAmount` we need
  // scale = 2 * refractionAmount (channel ranges over [0,1] → ±scale/2).
  const scale = Math.max(1, 2 * refractionAmount);

  const normalX = Math.cos(highlightAngle);
  const normalY = Math.sin(highlightAngle);

  // ---- displacement map ----
  const dispCanvas = document.createElement("canvas");
  dispCanvas.width = W;
  dispCanvas.height = H;
  const dctx = dispCanvas.getContext("2d")!;
  const dispImg = dctx.createImageData(W, H);

  // ---- highlight maps ----
  const needHighlight = highlight !== "none" && highlightAlpha > 0;
  const litCanvas = document.createElement("canvas");
  litCanvas.width = W;
  litCanvas.height = H;
  const lctx = litCanvas.getContext("2d")!;
  const litImg = lctx.createImageData(W, H);

  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = W;
  shadowCanvas.height = H;
  const sctx = shadowCanvas.getContext("2d")!;
  const shadowImg = sctx.createImageData(W, H);

  // The original draws a stroke of width `highlightWidth` centered on the
  // outline, then clips to the shape interior (so only the inner half is
  // visible). We replicate with a hard edge at t = highlightWidth/2.
  const strokeVisible = Math.max(0.5, highlightWidth / 2);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const cx = x - halfW + 0.5;
      const cy = y - halfH + 0.5;
      const idx = (y * W + x) * 4;

      // -------- Refraction (AGSL RoundedRectRefractionShaderString) --------
      const sd = sdRoundedRect(cx, cy, halfW, halfH, r);
      const insideDist = -sd; // >0 inside
      let dx = 0;
      let dy = 0;
      if (insideDist < h) {
        const sdClamped = Math.min(sd, 0);
        const xx = 1 - -sdClamped / h; // 1 at edge / outside, -> 0 deep inside
        // refractionAmount is passed as -amount in AGSL, so d is negative
        // (samples inward → magnify).
        const d = circleMap(xx) * -refractionAmount;
        let gx: number;
        let gy: number;
        [gx, gy] = gradSdRoundedRect(cx, cy, halfW, halfH, gradRadius);
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
      const rCh = Math.max(0, Math.min(255, Math.round((0.5 + dx / scale) * 255)));
      const gCh = Math.max(0, Math.min(255, Math.round((0.5 + dy / scale) * 255)));
      dispImg.data[idx] = rCh;
      dispImg.data[idx + 1] = gCh;
      dispImg.data[idx + 2] = 128; // unused
      dispImg.data[idx + 3] = 255;

      // -------- Highlight (AGSL Default/AmbientHighlightShaderString) --------
      if (needHighlight) {
        // Clipped stroke: full alpha for pixels within `strokeVisible` of
        // the edge (inside), zero beyond. The CSS blur softens this to match
        // the original's paint.blur(highlightBlurRadius).
        const t = insideDist; // >0 inside
        const edgeWeight = t <= 0 ? 0 : t <= strokeVisible ? 1 : 0;
        if (edgeWeight > 0.001) {
          const [gx, gy] = gradSdRoundedRect(cx, cy, halfW, halfH, gradRadius);
          const dot = gx * normalX + gy * normalY;
          const intensity = Math.pow(Math.abs(dot), highlightFalloff);
          const a = Math.round(
            255 * intensity * edgeWeight * highlightAlpha,
          );
          if (highlight === "default") {
            // Symmetric white rim (Plus blend).
            litImg.data[idx] = 255;
            litImg.data[idx + 1] = 255;
            litImg.data[idx + 2] = 255;
            litImg.data[idx + 3] = a;
          } else {
            // Ambient: lit side white, shadow side black.
            if (dot >= 0) {
              litImg.data[idx] = 255;
              litImg.data[idx + 1] = 255;
              litImg.data[idx + 2] = 255;
              litImg.data[idx + 3] = a;
            } else {
              shadowImg.data[idx] = 0;
              shadowImg.data[idx + 1] = 0;
              shadowImg.data[idx + 2] = 0;
              shadowImg.data[idx + 3] = a;
            }
          }
        }
      }
    }
  }

  dctx.putImageData(dispImg, 0, 0);
  lctx.putImageData(litImg, 0, 0);
  sctx.putImageData(shadowImg, 0, 0);

  // The displacement map encodes a "no displacement" mid-gray; if there's no
  // refraction at all we can skip the PNG entirely.
  const hasRefraction = refractionAmount > 0.01 && refractionHeight > 0.01;
  const displacementUrl = hasRefraction ? toDataUrl(dispCanvas) : "";
  const litUrl = needHighlight ? toDataUrl(litCanvas) : null;
  const shadowUrl =
    needHighlight && highlight === "ambient" ? toDataUrl(shadowCanvas) : null;

  const maps: GlassMaps = {
    displacementUrl,
    scale,
    litUrl,
    shadowUrl,
    highlightBlurRadius,
    key,
  };
  // Bound the cache so long sessions don't leak memory.
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
