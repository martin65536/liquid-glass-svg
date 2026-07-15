# Liquid Glass — HTML Port of AndroidLiquidGlass

A faithful HTML/TypeScript port of [Kyant0/AndroidLiquidGlass](https://github.com/Kyant0/AndroidLiquidGlass) — the Compose Multiplatform liquid-glass effect library — built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**.

The lens refraction is computed with the **same rounded-rect SDF + `circleMap` easing** as the original AGSL shaders, but instead of a GPU `RuntimeShader` it is baked into a **canvas displacement-map PNG** and applied through an **SVG `<feImage>` + `<feDisplacementMap>` filter** on `backdrop-filter` — the "SVG filter image" approach.

## How it works

```
backdrop-filter: url(#lg-filter)

  <filter id="lg-filter">
    feColorMatrix   (vibrancy — saturate 1.5, ported from ColorFilter.kt)
    feGaussianBlur  (blur radius)
    feImage         (canvas-baked displacement map: R/G = dx/dy)
    feDisplacementMap (lens refraction via the rounded-rect SDF)
  </filter>
```

The displacement map is generated per element by re-evaluating the AGSL math on a `<canvas>`:

- `sdRoundedRect` / `gradSdRoundedRect` — signed distance field + gradient (`Shaders.kt`)
- `circleMap(x) = 1 - sqrt(1 - x*x)` — the lens-bulge easing curve
- refraction: `d = circleMap(1 - -sd/h) * (-amount)` along the SDF gradient
- Default / Ambient rim-light highlights: `pow(|dot(grad, normal)|, falloff)`

## Catalog

The app faithfully reproduces the original's catalog home and routing (in-memory destination state + back navigation):

- **Liquid glass components** — Buttons, Toggle, Slider, Bottom tabs, Dialog
- **System UIs** — Lock screen, Control center, Magnifier
- **Experiments** — Glass playground, Adaptive luminance glass, Progressive blur, Scroll container, Lazy scroll container
- **HTML port** — the rich showcase (hero + draggable magnifier + live playground)

## Tech stack

- Next.js 16 (App Router) + TypeScript 5
- Tailwind CSS 4 + shadcn/ui (New York)
- SVG filters + Canvas 2D for the glass engine (no WebGL / GPU shaders)

## Project structure

```
src/lib/liquid-glass/
  sdf.ts       # rounded-rect SDF + gradient + circleMap (ported from Shaders.kt)
  maps.ts      # canvas displacement-map + highlight PNG generator

src/components/liquid-glass/
  liquid-glass.tsx        # core wrapper: inline SVG <filter> + backdrop-filter
  use-glass.ts            # ResizeObserver-driven map regeneration
  liquid-button.tsx       # port of LiquidButton.kt
  liquid-toggle.tsx       # port of LiquidToggle.kt
  liquid-slider.tsx       # port of LiquidSlider.kt
  liquid-bottom-tabs.tsx  # port of LiquidBottomTabs.kt

src/components/liquid-glass-catalog/
  catalog-app.tsx          # port of MainContent.kt (destination state + BackHandler)
  home-content.tsx         # port of HomeContent.kt
  destinations/*.tsx       # ports of the 13 *Content.kt screens + HTML showcase
```

## Develop

```bash
bun install
bun run dev      # http://localhost:3000
bun run lint
```

## Credits

- Original effect & shaders: [Kyant0/AndroidLiquidGlass](https://github.com/Kyant0/AndroidLiquidGlass) (Apache-2.0)
- This port is for demonstration purposes.
