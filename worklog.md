---
Task ID: 1
Agent: Z.ai Code (main)
Task: Port the GitHub project https://github.com/Kyant0/AndroidLiquidGlass to HTML, using an SVG filter image (`feImage` + `feDisplacementMap`) for the glass effect.

Work Log:
- Fetched and studied the AndroidLiquidGlass repo (README, Shaders.kt AGSL shaders, Lens/Blur/ColorFilter/Highlight effects, LiquidButton/LiquidToggle/LiquidSlider/LiquidBottomTabs demo components, catalog screens).
- Identified the core math to port:
  - `sdRoundedRect` / `gradSdRoundedRect` (rounded-rect SDF + gradient) from `internal/Shaders.kt`.
  - `circleMap(x) = 1 - sqrt(1 - x*x)` easing that drives the lens bulge.
  - `RoundedRectRefractionShaderString`: `d = circleMap(1 - -sd/h) * (-amount)` along the SDF gradient.
  - `Default`/`AmbientHighlightShaderString`: rim light = `pow(|dot(grad, normal)|, falloff)`.
  - `vibrancy` = saturation 1.5 color matrix (from `ColorFilter.kt`).
- Generated a vibrant background image with the image-generation skill (`public/glass/bg.jpg`, 1344x768) so the glass blur/refraction is clearly visible.
- Ported the SDF math to `src/lib/liquid-glass/sdf.ts` (faithful to AGSL).
- Built a canvas map generator `src/lib/liquid-glass/maps.ts` that re-evaluates the SDF per pixel and bakes:
  - a displacement-map PNG (R/G = dx/dy) consumed by `<feImage>` + `<feDisplacementMap>` (the "svg filter image"),
  - white/black rim-light PNGs (Default + Ambient highlights) used as overlay backgrounds,
  - plus a vibrancy `feColorMatrix` helper. Results are cached by an inputs key.
- Built the core `LiquidGlass` component (`src/components/liquid-glass/liquid-glass.tsx`) that renders an inline `<svg><filter>` (vibrancy → feGaussianBlur → feImage(displacement) → feDisplacementMap) and applies it via `backdrop-filter`, layered with surface tint, hue tint, directional sheen, rim-light overlays, inner outline, and drop/inner shadows. A `useGlass` hook measures the element (ResizeObserver) and regenerates the maps.
- Ported the four catalog components: `LiquidButton`, `LiquidToggle`, `LiquidSlider`, `LiquidBottomTabs` (capsule shapes, press-squash springs, sliding indicator, ambient/default highlights) — matching the Android effects (vibrancy + blur + lens).
- Built the single `/` page (`src/app/page.tsx`): vibrant fixed background with gradient blobs + emoji floaters (refraction fodder), sticky header with theme toggle, hero with a draggable circular magnifier lens (depthEffect + ambient rim), sections for buttons / toggle+slider / bottom tabs, and a live "Glass playground" with shadcn Sliders/Switches that re-bake the displacement map in real time. Responsive (stacks on mobile), sticky footer.
- Linted clean (`bun run lint`).
- Verified end-to-end with Agent Browser + VLM:
  - Page renders, no console/runtime errors.
  - Glass blur + refraction visible on the lens, buttons, knobs, tab indicator, and playground panel (confirmed by VLM).
  - Interactions verified: bottom-tab click slides the indicator, toggle tap flips state (fixed a missing `didDrag` tap-vs-drag branch), slider drag updates the value, magnifier lens drag moves across the box, theme toggle switches dark/light, playground controls live-tune the glass.
  - Mobile (390x844) single-column layout, no overflow, sticky footer present.
- Updated `src/app/layout.tsx` metadata (title/description) to reflect the Liquid Glass port.

Stage Summary:
- The AndroidLiquidGlass effect is faithfully ported to HTML. The lens refraction uses the *same* rounded-rect SDF + `circleMap` math as the AGSL shader, but instead of a GPU shader it is baked into a canvas PNG displacement map and applied through an SVG `<filter>` (`feImage` + `feDisplacementMap`) on `backdrop-filter` — exactly the "svg filter image" approach requested.
- Artifacts: `src/lib/liquid-glass/{sdf.ts,maps.ts}`, `src/components/liquid-glass/{use-glass.ts,liquid-glass.tsx,liquid-button.tsx,liquid-toggle.tsx,liquid-slider.tsx,liquid-bottom-tabs.tsx,index.ts}`, `src/app/page.tsx`, `public/glass/bg.jpg`, updated `src/app/layout.tsx`.
- Dev server runs on port 3000; lint clean; browser-verified interactivity and rendering on desktop and mobile.
