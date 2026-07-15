"use client";

import { DESTINATION_GROUPS, type CatalogDestination } from "./types";

/**
 * Faithful port of `app/.../catalog/destinations/HomeContent.kt`.
 *
 * A scrollable list: a large title, grouped subtitles (accent blue) and
 * tappable list items. Each item calls `onNavigate(destination)`.
 */
export function HomeContent({
  dark,
  onNavigate,
}: {
  dark: boolean;
  onNavigate: (d: CatalogDestination) => void;
}) {
  const contentColor = dark ? "#fff" : "#000";
  const accent = dark ? "#0091FF" : "#0088FF";

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "16px 16px 96px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <h1
        style={{
          margin: "24px 0 0",
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: -0.3,
          color: contentColor,
          textShadow: dark
            ? "0 1px 3px rgba(0,0,0,0.45)"
            : "0 1px 2px rgba(255,255,255,0.5)",
        }}
      >
        Backdrop Catalog
      </h1>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {DESTINATION_GROUPS.map((group) => (
          <div key={group.subtitle}>
            <div
              style={{
                padding: "24px 16px 8px",
                fontSize: 15,
                fontWeight: 500,
                color: accent,
                textShadow: dark
                  ? "0 1px 3px rgba(0,0,0,0.5)"
                  : "0 1px 2px rgba(255,255,255,0.6)",
              }}
            >
              {group.subtitle}
            </div>
            {group.items.map((item) => (
              <button
                key={item.destination}
                onClick={() => onNavigate(item.destination)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: 16,
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 17,
                  color: contentColor,
                  textShadow: dark
                    ? "0 1px 2px rgba(0,0,0,0.4)"
                    : "0 1px 2px rgba(255,255,255,0.5)",
                  fontFamily: "inherit",
                  borderBottom: dark
                    ? "1px solid rgba(255,255,255,0.06)"
                    : "1px solid rgba(0,0,0,0.06)",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
