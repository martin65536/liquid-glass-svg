/**
 * Liquid Glass SDF math — ported faithfully from the AGSL shaders in
 * Kyant0/AndroidLiquidGlass (backdrop/.../internal/Shaders.kt).
 *
 * These functions are the geometric core of the liquid-glass refraction and
 * highlight effects. They are kept as close to the original GLSL/AGSL as
 * possible so the visual result matches the Android library.
 */

/**
 * Signed distance to a rounded rectangle (uniform corner radius).
 * Negative inside, positive outside, zero on the outline.
 *
 * Ported from `sdRoundedRect` in Shaders.kt.
 */
export function sdRoundedRect(
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  radius: number,
): number {
  const ccx = Math.abs(cx) - (halfW - radius);
  const ccy = Math.abs(cy) - (halfH - radius);
  const outside =
    Math.hypot(Math.max(ccx, 0), Math.max(ccy, 0)) - radius;
  const inside = Math.min(Math.max(ccx, ccy), 0);
  return outside + inside;
}

/**
 * Gradient of the rounded-rect SDF. Returns a unit-ish vector pointing
 * outward (away from the shape). Used both for refraction direction and for
 * the directional rim-light highlight.
 *
 * Ported from `gradSdRoundedRect` in Shaders.kt.
 */
export function gradSdRoundedRect(
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  radius: number,
): [number, number] {
  const ccx = Math.abs(cx) - (halfW - radius);
  const ccy = Math.abs(cy) - (halfH - radius);
  const sx = Math.sign(cx);
  const sy = Math.sign(cy);

  if (ccx >= 0 || ccy >= 0) {
    // Outside-corner region: gradient points away from the nearest corner.
    const gx = Math.max(ccx, 0);
    const gy = Math.max(ccy, 0);
    const len = Math.hypot(gx, gy) || 1e-6;
    return [(sx * gx) / len, (sy * gy) / len];
  }

  // Interior region: gradient is along the nearest axis (step(y, x)).
  const gradX = ccx >= ccy ? 1 : 0;
  return [sx * gradX, sy * (1 - gradX)];
}

/**
 * `circleMap(x) = 1 - sqrt(1 - x*x)` — a smooth easing curve that maps the
 * normalized distance-from-edge (0..1) to a bulge displacement. It is 0 at the
 * deep center and 1 at the very edge, producing the characteristic lens bulge.
 *
 * Ported from `circleMap` in Shaders.kt.
 */
export function circleMap(x: number): number {
  const c = Math.max(0, Math.min(1, x));
  return 1 - Math.sqrt(1 - c * c);
}

/**
 * Pick the corner radius for a given quadrant, mirroring AGSL `radiusAt`.
 * For a uniform radius this is just `r`, but we keep the helper for parity.
 *
 * radii order: [topLeft, topRight, bottomRight, bottomLeft]
 * coord origin is the shape center (AGSL uses coord = local position).
 */
export function radiusAt(
  cx: number,
  cy: number,
  radii: [number, number, number, number],
): number {
  if (cx >= 0) {
    return cy <= 0 ? radii[1] : radii[2];
  }
  return cy <= 0 ? radii[0] : radii[3];
}
