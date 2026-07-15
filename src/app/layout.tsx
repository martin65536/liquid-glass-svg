import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Liquid Glass — HTML Port of AndroidLiquidGlass",
  description:
    "A faithful HTML port of Kyant0/AndroidLiquidGlass. The lens refraction is computed with the same rounded-rect SDF + circleMap easing, baked into an SVG feDisplacementMap filter image and applied through backdrop-filter.",
  keywords: [
    "liquid glass",
    "AndroidLiquidGlass",
    "SVG filter",
    "feDisplacementMap",
    "glassmorphism",
    "SDF",
    "Next.js",
  ],
  authors: [{ name: "Z.ai" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Liquid Glass — HTML Port",
    description:
      "Liquid glass effect ported to HTML using SVG feDisplacementMap + canvas SDF displacement maps.",
    url: "https://chat.z.ai",
    siteName: "Z.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Liquid Glass — HTML Port",
    description:
      "Liquid glass effect ported to HTML using SVG feDisplacementMap + canvas SDF displacement maps.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
