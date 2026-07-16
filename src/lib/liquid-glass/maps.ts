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

/**
 * Generate the highlight rim textures with 2× supersampling + bilinear
 * downsample, so the clipped-stroke edge is antialiased (no pixel stairsteps).
 *
 * Mirrors HighlightNode: draw a stroke of `highlightWidth` centered on the
 * outline, clip to the shape interior (only the inner half is visible),
 * modulate alpha by the directional shader `pow(|dot(grad, normal)|, falloff)`,
 * then apply `paint.blur(highlightBlurRadius)` (done later via CSS blur).
 */
function generateHighlightMaps(opts: {
  W: number;
  H: number;
  r: number;
  highlightWidth: number;
  highlightAngle: number;
  highlightFalloff: number;
  highlightAlpha: number;
  mode: "default" | "ambient";
}): { lit: string | null; shadow: string | null } {
  const {
    W,
    H,
    r,
    highlightWidth,
    highlightAngle,
    highlightFalloff,
    highlightAlpha,
    mode,
  } = opts;
  if (highlightAlpha <= 0) return { lit: null, shadow: null };

  // 4× supersample for a crisp, high-resolution rim (the rim is only ~1px
  // visible, so low-res alpha looks blocky).
  const SS = 4;
  const W2 = W * SS;
  const H2 = H * SS;
  const halfW2 = W2 / 2;
  const halfH2 = H2 / 2;
  const r2 = r * SS;
  const gradRadius2 = Math.min(r2 * 1.5, Math.min(halfW2, halfH2));
  // Visible inner half of the stroke, scaled to 2×.
  const strokeVisible2 = Math.max(0.5, highlightWidth / 2) * SS;
  const normalX = Math.cos(highlightAngle);
  const normalY = Math.sin(highlightAngle);

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
      const insideDist = -sd; // >0 inside
      // Clipped stroke: 1 inside the band, 0 beyond. The 2× supersample +
      // bilinear downsample produces the antialiased edge.
      const edgeWeight =
        insideDist <= 0 ? 0 : insideDist <= strokeVisible2 ? 1 : 0;
      if (edgeWeight <= 0.001) continue;

      const idx = (y * W2 + x) * 4;
      const [gx, gy] = gradSdRoundedRect(cx, cy, halfW2, halfH2, gradRadius2);
      const dot = gx * normalX + gy * normalY;
      const intensity = Math.pow(Math.abs(dot), highlightFalloff);
      const a = Math.round(255 * intensity * edgeWeight * highlightAlpha);

      if (mode === "default") {
        litImg2.data[idx] = 255;
        litImg2.data[idx + 1] = 255;
        litImg2.data[idx + 2] = 255;
        litImg2.data[idx + 3] = a;
      } else {
        // Ambient: lit side white, shadow side black.
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

  // Downsample 4× → 2× → 1× in two bilinear passes for smoother edges.
  const litMid = document.createElement("canvas");
  litMid.width = W * 2;
  litMid.height = H * 2;
  const lmctx = litMid.getContext("2d")!;
  lmctx.imageSmoothingEnabled = true;
  lmctx.imageSmoothingQuality = "high";
  lmctx.drawImage(lit2, 0, 0, W * 2, H * 2);

  const lit = document.createElement("canvas");
  lit.width = W;
  lit.height = H;
  const lctx = lit.getContext("2d")!;
  lctx.imageSmoothingEnabled = true;
  lctx.imageSmoothingQuality = "high";
  lctx.drawImage(litMid, 0, 0, W, H);

  const shadowMid = document.createElement("canvas");
  shadowMid.width = W * 2;
  shadowMid.height = H * 2;
  const smctx = shadowMid.getContext("2d")!;
  smctx.imageSmoothingEnabled = true;
  smctx.imageSmoothingQuality = "high";
  smctx.drawImage(shadow2, 0, 0, W * 2, H * 2);

  const shadow = document.createElement("canvas");
  shadow.width = W;
  shadow.height = H;
  const sctx = shadow.getContext("2d")!;
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(shadowMid, 0, 0, W, H);

  return {
    lit: toDataUrl(lit),
    shadow: mode === "ambient" ? toDataUrl(shadow) : null,
  };
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

  // ---- displacement map ----
  const dispCanvas = document.createElement("canvas");
  dispCanvas.width = W;
  dispCanvas.height = H;
  const dctx = dispCanvas.getContext("2d")!;
  const dispImg = dctx.createImageData(W, H);

  const needHighlight = highlight !== "none" && highlightAlpha > 0;

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
    }
  }
  dctx.putImageData(dispImg, 0, 0);

  // ---- highlight maps (2× supersampled, antialiased) ----
  const hl =
    needHighlight && (highlight === "default" || highlight === "ambient")
      ? generateHighlightMaps({
          W,
          H,
          r,
          highlightWidth,
          highlightAngle,
          highlightFalloff,
          highlightAlpha,
          mode: highlight,
        })
      : { lit: null, shadow: null };

  // The displacement map encodes a "no displacement" mid-gray; if there's no
  // refraction at all we can skip the PNG entirely.
  const hasRefraction = refractionAmount > 0.01 && refractionHeight > 0.01;
  const displacementUrl = hasRefraction ? toDataUrl(dispCanvas) : "";
  const litUrl = hl.lit;
  const shadowUrl = hl.shadow;

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
