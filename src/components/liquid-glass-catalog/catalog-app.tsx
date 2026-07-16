"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Sun, Moon, ImagePlus } from "lucide-react";
import {
  DESTINATION_TITLE,
  type CatalogDestination,
} from "./types";
import { HomeContent } from "./home-content";
import { LiquidButton } from "@/components/liquid-glass";

import { ButtonsContent } from "./destinations/buttons-content";
import { ToggleContent } from "./destinations/toggle-content";
import { SliderContent } from "./destinations/slider-content";
import { BottomTabsContent } from "./destinations/bottom-tabs-content";
import { DialogContent } from "./destinations/dialog-content";
import { LockScreenContent } from "./destinations/lock-screen-content";
import { ControlCenterContent } from "./destinations/control-center-content";
import { MagnifierContent } from "./destinations/magnifier-content";
import { GlassPlaygroundContent } from "./destinations/glass-playground-content";
import { AdaptiveLuminanceGlassContent } from "./destinations/adaptive-luminance-glass-content";
import { ProgressiveBlurContent } from "./destinations/progressive-blur-content";
import { ScrollContainerContent } from "./destinations/scroll-container-content";
import { LazyScrollContainerContent } from "./destinations/lazy-scroll-container-content";
import { ShowcaseContent } from "./destinations/showcase-content";

const DEFAULT_WALLPAPER = "/glass/wallpaper_light.webp";

/**
 * CatalogApp — faithful port of `app/.../catalog/MainContent.kt`.
 *
 * The original holds a `var destination` state and switches on it with a
 * `when` block; a `BackHandler` returns to Home. We mirror that with React
 * state and wire the browser history so the hardware/browser back button
 * behaves like the Android back button.
 *
 * The app shell also hosts the shared `BackdropDemoScaffold`-style wallpaper
 * (with a "Pick an image" button), the top app bar (back + title + theme),
 * and renders the active destination on top.
 */
export function CatalogApp() {
  const [destination, setDestination] =
    useState<CatalogDestination>("home");
  const [dark, setDark] = useState(false);
  const [wallpaperUrl, setWallpaperUrl] = useState(DEFAULT_WALLPAPER);

  // Navigate to a destination and push a history entry so the browser back
  // button returns to the previous screen (faithful to BackHandler).
  const navigate = useCallback((d: CatalogDestination) => {
    setDestination(d);
    if (d !== "home") {
      window.history.pushState({ destination: d }, "");
    }
  }, []);

  const goHome = useCallback(() => {
    setDestination("home");
  }, []);

  // Listen to popstate (browser back / forward). If we're not home, go home;
  // otherwise there's nothing above home.
  useEffect(() => {
    const onPop = () => {
      setDestination((cur) => {
        if (cur !== "home") return "home";
        return cur;
      });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Reset scroll on destination change.
  useEffect(() => {
    const main = document.getElementById("catalog-main");
    if (main) main.scrollTo({ top: 0 });
  }, [destination]);

  const onPickImage = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setWallpaperUrl(url);
      }
    },
    [],
  );

  const isHome = destination === "home";
  const title = DESTINATION_TITLE[destination];

  const destProps = { dark, wallpaperUrl };

  return (
    <div
      style={{
        // 100dvh (dynamic viewport height) tracks the mobile browser chrome
        // so the address bar show/hide doesn't resize the page. overflow:hidden
        // on the root + scrollable main contains scrolling and prevents the
        // whole page from being dragged (no rubber-band / nav-bar drag).
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        overscrollBehavior: "none",
        color: dark ? "#fff" : "#000",
      }}
    >
      {/* BackdropDemoScaffold: full-screen wallpaper + legibility scrim */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          overflow: "hidden",
          background: dark ? "#0b0b10" : "#e9e6df",
        }}
      >
        <img
          src={wallpaperUrl}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: dark
              ? "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55))"
              : "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.18))",
          }}
        />
      </div>

      {/* Top app bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
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
        {isHome ? (
          <div style={{ width: 38 }} />
        ) : (
          <button
            onClick={goHome}
            aria-label="Back"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "inherit",
              background: dark
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.5)",
              border: dark
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(255,255,255,0.6)",
            }}
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div
          style={{
            flex: 1,
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: -0.2,
            textAlign: isHome ? "left" : "center",
            textShadow: dark
              ? "0 1px 2px rgba(0,0,0,0.4)"
              : "0 1px 2px rgba(255,255,255,0.5)",
          }}
        >
          {title}
        </div>
        <button
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle theme"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            color: "inherit",
            background: dark
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.5)",
            border: dark
              ? "1px solid rgba(255,255,255,0.12)"
              : "1px solid rgba(255,255,255,0.6)",
          }}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Active destination — mirrors MainContent.kt's `when (destination)`. */}
      <main
        id="catalog-main"
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 880,
          margin: "0 auto",
          padding: isHome ? 0 : "20px 16px 96px",
          display: "flex",
          flexDirection: "column",
          // Contained scrolling: the main area scrolls independently and
          // does not propagate scroll/bounce to the root (no nav-bar drag).
          overflowY: "auto",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {destination === "home" && (
          <HomeContent dark={dark} onNavigate={navigate} />
        )}
        {destination === "buttons" && <ButtonsContent {...destProps} />}
        {destination === "toggle" && <ToggleContent {...destProps} />}
        {destination === "slider" && <SliderContent {...destProps} />}
        {destination === "bottomTabs" && <BottomTabsContent {...destProps} />}
        {destination === "dialog" && <DialogContent {...destProps} />}
        {destination === "lockScreen" && <LockScreenContent {...destProps} />}
        {destination === "controlCenter" && (
          <ControlCenterContent {...destProps} />
        )}
        {destination === "magnifier" && <MagnifierContent {...destProps} />}
        {destination === "glassPlayground" && (
          <GlassPlaygroundContent {...destProps} />
        )}
        {destination === "adaptiveLuminanceGlass" && (
          <AdaptiveLuminanceGlassContent {...destProps} />
        )}
        {destination === "progressiveBlur" && (
          <ProgressiveBlurContent {...destProps} />
        )}
        {destination === "scrollContainer" && (
          <ScrollContainerContent {...destProps} />
        )}
        {destination === "lazyScrollContainer" && (
          <LazyScrollContainerContent {...destProps} />
        )}
        {destination === "showcase" && <ShowcaseContent {...destProps} />}
      </main>

      {/* BackdropDemoScaffold "Pick an image" button (shown on demo screens). */}
      {!isHome && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 40,
            pointerEvents: "none",
          }}
        >
          <label
            style={{
              pointerEvents: "auto",
              display: "inline-flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={onPickImage}
              style={{ display: "none" }}
            />
            <LiquidButton tint="#0091FF" interactive>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  paddingInline: 8,
                }}
              >
                <ImagePlus size={16} /> Pick an image
              </span>
            </LiquidButton>
          </label>
        </div>
      )}
    </div>
  );
}
