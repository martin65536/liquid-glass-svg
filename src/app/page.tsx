"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  LiquidButton,
  LiquidGlass,
  LiquidBottomTabs,
  LiquidSlider,
  LiquidToggle,
} from "@/components/liquid-glass";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Plane,
  Sun,
  Moon,
  Github,
  Sparkles,
  MousePointerClick,
  Palette,
  SlidersHorizontal,
  Move,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Background — a vibrant, detail-rich layer so the glass reads.     */
/* ------------------------------------------------------------------ */

const FLOATERS = [
  { emoji: "🌆", top: "8%", left: "6%", size: 64, rot: -8 },
  { emoji: "🍓", top: "22%", left: "78%", size: 52, rot: 12 },
  { emoji: "🌊", top: "44%", left: "12%", size: 56, rot: 6 },
  { emoji: "🪩", top: "60%", left: "84%", size: 60, rot: -10 },
  { emoji: "🎨", top: "76%", left: "20%", size: 48, rot: 8 },
  { emoji: "✨", top: "12%", left: "44%", size: 40, rot: 0 },
  { emoji: "🌈", top: "88%", left: "62%", size: 54, rot: -6 },
  { emoji: "🦋", top: "34%", left: "52%", size: 44, rot: 14 },
];

function Backdrop({ dark }: { dark: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        background: dark ? "#0b0b10" : "#f4f1ea",
      }}
    >
      <img
        src="/glass/bg.jpg"
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: dark ? 0.55 : 0.95,
          transform: "scale(1.05)",
        }}
      />
      {/* color blobs for extra vibrancy */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(40% 50% at 18% 20%, rgba(255,90,160,0.55), transparent 60%), radial-gradient(45% 55% at 85% 30%, rgba(60,220,200,0.5), transparent 60%), radial-gradient(50% 50% at 70% 85%, rgba(255,170,60,0.5), transparent 60%), radial-gradient(40% 40% at 25% 80%, rgba(120,90,255,0.5), transparent 60%)",
          mixBlendMode: dark ? "screen" : "multiply",
          opacity: dark ? 0.7 : 0.5,
        }}
      />
      {/* detail floaters (great refraction fodder) */}
      {FLOATERS.map((f, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: f.top,
            left: f.left,
            fontSize: f.size,
            transform: `rotate(${f.rot}deg)`,
            opacity: dark ? 0.85 : 0.9,
            filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.25))",
          }}
        >
          {f.emoji}
        </span>
      ))}
      {/* legibility scrim */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: dark
            ? "linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.45))"
            : "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.12))",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section heading                                                   */
/* ------------------------------------------------------------------ */

function SectionTitle({
  icon,
  title,
  subtitle,
  dark,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  dark: boolean;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: dark ? "#fff" : "#1a1a1a",
        }}
      >
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
            color: dark ? "#fff" : "#1a1a1a",
          }}
        >
          {icon}
        </span>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: -0.2,
            margin: 0,
            textShadow: dark
              ? "0 1px 2px rgba(0,0,0,0.4)"
              : "0 1px 2px rgba(255,255,255,0.5)",
          }}
        >
          {title}
        </h2>
      </div>
      <p
        style={{
          margin: "6px 0 0 44",
          fontSize: 14,
          color: dark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)",
          textShadow: dark
            ? "0 1px 2px rgba(0,0,0,0.4)"
            : "0 1px 2px rgba(255,255,255,0.5)",
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Draggable magnifier                                               */
/* ------------------------------------------------------------------ */

function Magnifier({ dark }: { dark: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 120, y: 80 });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      px: pos.x,
      py: pos.y,
    };
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const size = 150;
    const nx = startRef.current.px + (e.clientX - startRef.current.x);
    const ny = startRef.current.py + (e.clientY - startRef.current.y);
    setPos({
      x: Math.max(0, Math.min(rect.width - size, nx)),
      y: Math.max(0, Math.min(rect.height - size, ny)),
    });
  }, [dragging]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: 320,
        borderRadius: 24,
        overflow: "hidden",
        background:
          "linear-gradient(120deg, #ff5e9c, #ffb347 30%, #4dd0c1 60%, #8a5cf6)",
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      onPointerMove={onPointerMove}
    >
      {/* tiny text grid for refraction detail */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)",
          gridTemplateRows: "repeat(6, 1fr)",
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRight: "1px solid rgba(255,255,255,0.18)",
              borderBottom: "1px solid rgba(255,255,255,0.18)",
              display: "grid",
              placeItems: "center",
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {String.fromCharCode(65 + (i % 26))}
            {(i % 9) + 1}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          top: pos.y,
          left: pos.x,
          width: 150,
          height: 150,
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <LiquidGlass
          radius={75}
          refractionHeight={20}
          refractionAmount={34}
          depthEffect
          saturation={1.6}
          blur={1}
          highlight="ambient"
          highlightWidth={2}
          highlightAlpha={0.9}
          shadowAlpha={0.25}
          innerShadowAlpha={0.3}
          style={{
            width: "100%",
            height: "100%",
            cursor: dragging ? "grabbing" : "grab",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 14,
          color: "#fff",
          fontSize: 13,
          fontWeight: 500,
          textShadow: "0 1px 3px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          pointerEvents: "none",
        }}
      >
        <Move size={14} /> Drag the lens
      </div>
      <div
        style={{
          position: "absolute",
          right: 16,
          top: 14,
          color: "rgba(255,255,255,0.9)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          pointerEvents: "none",
        }}
      >
        SDF refraction · circleMap bulge
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Playground — live-tunable glass panel                             */
/* ------------------------------------------------------------------ */

function Playground({ dark }: { dark: boolean }) {
  const [blur, setBlur] = useState(4);
  const [refractionHeight, setRefractionHeight] = useState(18);
  const [refractionAmount, setRefractionAmount] = useState(28);
  const [highlightAlpha, setHighlightAlpha] = useState(0.6);
  const [depthEffect, setDepthEffect] = useState(true);
  const [highlightMode, setHighlightMode] =
    useState<"default" | "ambient">("ambient");

  const labelColor = dark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)";

  const controlStyle: React.CSSProperties = {
    padding: "14px 16px",
    borderRadius: 16,
    background: dark
      ? "rgba(255,255,255,0.07)"
      : "rgba(255,255,255,0.55)",
    border: dark
      ? "1px solid rgba(255,255,255,0.12)"
      : "1px solid rgba(255,255,255,0.6)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr)",
        gap: 20,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
          gap: 20,
        }}
        className="lg-playground-grid"
      >
        {/* the live glass panel */}
        <div
          style={{
            position: "relative",
            minHeight: 280,
            borderRadius: 24,
            overflow: "hidden",
            background:
              "linear-gradient(135deg, #ff7ab0, #ffd166 35%, #06d6a0 65%, #4361ee)",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)",
              gridTemplateRows: "repeat(5, 1fr)",
              pointerEvents: "none",
            }}
          >
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                style={{
                  borderRight: "1px solid rgba(255,255,255,0.2)",
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                GLM
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "70%",
              maxWidth: 360,
              height: 160,
            }}
          >
            <LiquidGlass
              radius={36}
              refractionHeight={refractionHeight}
              refractionAmount={refractionAmount}
              depthEffect={depthEffect}
              saturation={1.6}
              blur={blur}
              highlight={highlightMode}
              highlightWidth={2}
              highlightAlpha={highlightAlpha}
              shadowAlpha={0.18}
              innerShadowAlpha={0.18}
              style={{ width: "100%", height: "100%" }}
            >
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  color: "#fff",
                  textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}
              >
                <Sparkles size={26} />
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  Liquid Glass
                </div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  SVG filter + canvas SDF displacement
                </div>
              </div>
            </LiquidGlass>
          </div>
        </div>

        {/* controls */}
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <div style={controlStyle}>
            <ControlRow
              label="Blur"
              value={blur.toFixed(1)}
              color={labelColor}
            />
            <Slider
              value={[blur]}
              min={0}
              max={20}
              step={0.5}
              onValueChange={(v) => setBlur(v[0])}
            />
          </div>
          <div style={controlStyle}>
            <ControlRow
              label="Refraction height"
              value={refractionHeight.toFixed(0) + "px"}
              color={labelColor}
            />
            <Slider
              value={[refractionHeight]}
              min={0}
              max={60}
              step={1}
              onValueChange={(v) => setRefractionHeight(v[0])}
            />
          </div>
          <div style={controlStyle}>
            <ControlRow
              label="Refraction amount"
              value={refractionAmount.toFixed(0) + "px"}
              color={labelColor}
            />
            <Slider
              value={[refractionAmount]}
              min={0}
              max={60}
              step={1}
              onValueChange={(v) => setRefractionAmount(v[0])}
            />
          </div>
          <div style={controlStyle}>
            <ControlRow
              label="Highlight"
              value={Math.round(highlightAlpha * 100) + "%"}
              color={labelColor}
            />
            <Slider
              value={[highlightAlpha]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={(v) => setHighlightAlpha(v[0])}
            />
          </div>
          <div
            style={{
              ...controlStyle,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <ToggleRow
              label="Depth effect"
              color={labelColor}
              checked={depthEffect}
              onChange={setDepthEffect}
            />
            <ToggleRow
              label="Ambient rim (vs Default)"
              color={labelColor}
              checked={highlightMode === "ambient"}
              onChange={(v) => setHighlightMode(v ? "ambient" : "default")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 10,
        fontSize: 13,
        fontWeight: 500,
        color,
      }}
    >
      <span>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums", opacity: 0.8 }}>
        {value}
      </span>
    </div>
  );
}

function ToggleRow({
  label,
  color,
  checked,
  onChange,
}: {
  label: string;
  color: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 13,
        fontWeight: 500,
        color,
      }}
    >
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function Page() {
  const [dark, setDark] = useState(false);
  const [toggleOn, setToggleOn] = useState(true);
  const [sliderVal, setSliderVal] = useState(50);
  const [tab, setTab] = useState(0);
  const [tab2, setTab2] = useState(0);

  const textColor = dark ? "#fff" : "#15161a";
  const subColor = dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)";

  const tabs = useMemo(
    () => [
      { id: "tab1", label: "Tab 1", icon: <Plane size={22} /> },
      { id: "tab2", label: "Tab 2", icon: <Plane size={22} /> },
      { id: "tab3", label: "Tab 3", icon: <Plane size={22} /> },
    ],
    [],
  );
  const tabs4 = useMemo(
    () => [
      { id: "h", label: "Home", icon: <Plane size={20} /> },
      { id: "s", label: "Search", icon: <Sparkles size={20} /> },
      { id: "p", label: "Plan", icon: <Palette size={20} /> },
      { id: "m", label: "Me", icon: <MousePointerClick size={20} /> },
    ],
    [],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        color: textColor,
        transition: "color 200ms ease",
      }}
    >
      <Backdrop dark={dark} />

      {/* sticky header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          background: dark
            ? "rgba(10,10,16,0.35)"
            : "rgba(255,255,255,0.35)",
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          borderBottom: dark
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(255,255,255,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg,#ff5e9c,#4dd0c1)",
              color: "#fff",
            }}
          >
            <Sparkles size={16} />
          </span>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>
              Liquid Glass
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              HTML port · SVG filter + SDF
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a
            href="https://github.com/Kyant0/AndroidLiquidGlass"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              color: textColor,
              background: dark
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.5)",
              border: dark
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(255,255,255,0.6)",
              textDecoration: "none",
            }}
          >
            <Github size={15} /> Source
          </a>
          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle theme"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: textColor,
              background: dark
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.5)",
              border: dark
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(255,255,255,0.6)",
            }}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 880,
          margin: "0 auto",
          padding: "32px 20px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 56,
        }}
      >
        {/* hero */}
        <section>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#ff5e9c",
              marginBottom: 12,
              textShadow: "0 1px 2px rgba(0,0,0,0.2)",
            }}
          >
            Ported from Kyant0/AndroidLiquidGlass
          </div>
          <h1
            style={{
              fontSize: "clamp(34px, 7vw, 56px)",
              fontWeight: 800,
              letterSpacing: -1.2,
              lineHeight: 1.02,
              margin: 0,
              textShadow: dark
                ? "0 2px 10px rgba(0,0,0,0.5)"
                : "0 2px 8px rgba(255,255,255,0.4)",
            }}
          >
            Liquid Glass,
            <br />
            rendered in the browser.
          </h1>
          <p
            style={{
              marginTop: 16,
              fontSize: 17,
              maxWidth: 560,
              lineHeight: 1.55,
              color: subColor,
              textShadow: dark
                ? "0 1px 3px rgba(0,0,0,0.4)"
                : "0 1px 2px rgba(255,255,255,0.5)",
            }}
          >
            A faithful HTML port of the Compose-Multiplatform liquid-glass
            effect. The lens refraction is computed with the same rounded-rect
            SDF + <code>circleMap</code> easing, then baked into an SVG
            <code> feDisplacementMap</code> filter image and applied through
            <code> backdrop-filter</code>.
          </p>
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <LiquidButton onClick={() => setDark((d) => !d)}>
              Toggle theme
            </LiquidButton>
            <LiquidButton
              tint="#0091FF"
              onClick={() =>
                window.open(
                  "https://github.com/Kyant0/AndroidLiquidGlass",
                  "_blank",
                )
              }
            >
              View original
            </LiquidButton>
          </div>

          <div style={{ marginTop: 32 }}>
            <Magnifier dark={dark} />
          </div>
        </section>

        {/* buttons */}
        <section>
          <SectionTitle
            icon={<MousePointerClick size={18} />}
            title="Liquid buttons"
            subtitle="Capsule glass with vibrancy + blur + lens refraction. Transparent, surface and hue-tinted variants."
            dark={dark}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              alignItems: "stretch",
            }}
          >
            <LiquidButton>Transparent Liquid Button</LiquidButton>
            <LiquidButton surfaceColor="rgba(255,255,255,0.3)">
              Surface Liquid Button
            </LiquidButton>
            <LiquidButton tint="#0091FF">Tinted Liquid Button</LiquidButton>
            <LiquidButton tint="#FF8D28">Tinted Liquid Button</LiquidButton>
          </div>
        </section>

        {/* toggle + slider */}
        <section>
          <SectionTitle
            icon={<SlidersHorizontal size={18} />}
            title="Toggle & slider"
            subtitle="Ambient rim-lit knobs with press-to-squash springs. Drag the knob."
            dark={dark}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 28,
              padding: 24,
              borderRadius: 24,
              background: dark
                ? "rgba(255,255,255,0.06)"
                : "rgba(255,255,255,0.4)",
              border: dark
                ? "1px solid rgba(255,255,255,0.1)"
                : "1px solid rgba(255,255,255,0.6)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 500 }}>
                Airplane mode
              </span>
              <LiquidToggle
                checked={toggleOn}
                onChange={setToggleOn}
              />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: 13,
                  opacity: 0.8,
                }}
              >
                <span>Brightness</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {Math.round(sliderVal)}%
                </span>
              </div>
              <LiquidSlider
                value={sliderVal}
                onChange={setSliderVal}
                min={0}
                max={100}
              />
            </div>
          </div>
        </section>

        {/* bottom tabs */}
        <section>
          <SectionTitle
            icon={<Palette size={18} />}
            title="Bottom tabs"
            subtitle="A liquid-glass bar with a sliding capsule indicator."
            dark={dark}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <LiquidBottomTabs
              tabs={tabs}
              selected={tab}
              onSelect={setTab}
            />
            <LiquidBottomTabs
              tabs={tabs4}
              selected={tab2}
              onSelect={setTab2}
            />
          </div>
        </section>

        {/* playground */}
        <section>
          <SectionTitle
            icon={<Sparkles size={18} />}
            title="Glass playground"
            subtitle="Tune the SDF refraction, blur and rim light live. Every slider re-bakes the displacement map."
            dark={dark}
          />
          <Playground dark={dark} />
        </section>
      </main>

      {/* sticky footer */}
      <footer
        style={{
          marginTop: "auto",
          padding: "20px",
          textAlign: "center",
          fontSize: 13,
          color: subColor,
          background: dark
            ? "rgba(10,10,16,0.4)"
            : "rgba(255,255,255,0.35)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: dark
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(255,255,255,0.5)",
        }}
      >
        <div>
          Liquid Glass HTML port · SDF + SVG{" "}
          <code>feDisplacementMap</code> · Original by{" "}
          <a
            href="https://github.com/Kyant0/AndroidLiquidGlass"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#ff5e9c", textDecoration: "none" }}
          >
            Kyant0
          </a>
        </div>
      </footer>

      {/* responsive: stack playground on small screens */}
      <style>{`
        @media (max-width: 720px) {
          .lg-playground-grid { grid-template-columns: minmax(0,1fr) !important; }
        }
      `}</style>
    </div>
  );
}
