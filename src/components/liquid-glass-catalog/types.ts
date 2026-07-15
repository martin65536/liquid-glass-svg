/**
 * Catalog destination enum + metadata — faithful port of
 * `app/.../catalog/CatalogDestination.kt` and the group/label structure used
 * in `HomeContent.kt`.
 *
 * The original app navigates with an in-memory `var destination` state (no URL
 * routing). We mirror that here, plus an extra `showcase` destination that
 * holds the rich HTML-port landing built in the previous step.
 */

export type CatalogDestination =
  | "home"
  | "buttons"
  | "toggle"
  | "slider"
  | "bottomTabs"
  | "dialog"
  | "lockScreen"
  | "controlCenter"
  | "magnifier"
  | "glassPlayground"
  | "adaptiveLuminanceGlass"
  | "progressiveBlur"
  | "scrollContainer"
  | "lazyScrollContainer"
  | "showcase";

export interface DestinationGroup {
  subtitle: string;
  items: { destination: CatalogDestination; label: string }[];
}

/**
 * The exact group/label structure from HomeContent.kt, plus a "Port" group
 * that exposes the previous HTML showcase as a destination.
 */
export const DESTINATION_GROUPS: DestinationGroup[] = [
  {
    subtitle: "Liquid glass components",
    items: [
      { destination: "buttons", label: "Buttons" },
      { destination: "toggle", label: "Toggle" },
      { destination: "slider", label: "Slider" },
      { destination: "bottomTabs", label: "Bottom tabs" },
      { destination: "dialog", label: "Dialog" },
    ],
  },
  {
    subtitle: "System UIs",
    items: [
      { destination: "lockScreen", label: "Lock screen (SDF texture)" },
      { destination: "controlCenter", label: "Control center" },
      { destination: "magnifier", label: "Magnifier" },
    ],
  },
  {
    subtitle: "Experiments",
    items: [
      { destination: "glassPlayground", label: "Glass playground" },
      { destination: "adaptiveLuminanceGlass", label: "Adaptive luminance glass" },
      { destination: "progressiveBlur", label: "Progressive blur" },
      { destination: "scrollContainer", label: "Scroll container" },
      { destination: "lazyScrollContainer", label: "Lazy scroll container" },
    ],
  },
  {
    subtitle: "HTML port",
    items: [{ destination: "showcase", label: "HTML port showcase" }],
  },
];

export const ALL_DESTINATIONS: CatalogDestination[] = [
  "home",
  ...DESTINATION_GROUPS.flatMap((g) => g.items.map((i) => i.destination)),
];

export const DESTINATION_TITLE: Record<CatalogDestination, string> = {
  home: "Backdrop Catalog",
  buttons: "Buttons",
  toggle: "Toggle",
  slider: "Slider",
  bottomTabs: "Bottom tabs",
  dialog: "Dialog",
  lockScreen: "Lock screen",
  controlCenter: "Control center",
  magnifier: "Magnifier",
  glassPlayground: "Glass playground",
  adaptiveLuminanceGlass: "Adaptive luminance glass",
  progressiveBlur: "Progressive blur",
  scrollContainer: "Scroll container",
  lazyScrollContainer: "Lazy scroll container",
  showcase: "HTML port showcase",
};

/** Shared props every destination screen receives. */
export interface DestinationProps {
  dark: boolean;
  wallpaperUrl: string;
}

/**
 * Theme-aware color palette used across destinations — ported from the
 * `isLightTheme`/`isSystemInDarkTheme` conditionals in each *Content.kt.
 */
export function demoColors(dark: boolean) {
  return {
    contentColor: dark ? "#ffffff" : "#000000",
    accentColor: dark ? "#0091FF" : "#0088FF",
    accentGreen: dark ? "#30D158" : "#34C759",
    containerColor: dark ? "rgba(18,18,18,0.4)" : "rgba(250,250,250,0.4)",
    containerStrong: dark ? "rgba(18,18,18,0.6)" : "rgba(250,250,250,0.6)",
    backgroundColor: dark ? "#121212" : "#FFFFFF",
    trackColor: dark ? "rgba(120,128,128,0.36)" : "rgba(120,120,120,0.2)",
    dimColor: dark ? "rgba(18,18,18,0.56)" : "rgba(41,41,58,0.23)",
  };
}
