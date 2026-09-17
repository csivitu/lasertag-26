import type { Metadata, Viewport } from "next";
import "./globals.css";
import { anton, arcade, oxanium, pixelOperatorMono, pressStart } from "./fonts";
import { VitEnforcement } from "@/components/auth/VitEnforcement";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://lasertag.csivit.com"),
  title: {
    default: "LaserTag 2026 | CSI VIT",
    template: "%s | LaserTag 2026",
  },
  description:
    "From Pixels to Pew Pew – LaserTag 2026, the flagship retro-arcade laser tag event organized by CSI-VIT.",
  applicationName: "LaserTag 2026",
  keywords: [
    "LaserTag 2026",
    "LaserTag",
    "CSI VIT",
    "CSI-VIT",
    "Riviera",
    "graVITas",
    "VIT Vellore",
    "From Pixels to Pew Pew",
    "Arcade",
    "Laser Tag",
  ],
  authors: [{ name: "CSI-VIT", url: "https://csivit.com" }],
  creator: "CSI-VIT",
  publisher: "CSI-VIT",
  openGraph: {
    title: "LaserTag 2026 | CSI VIT",
    description:
      "From Pixels to Pew Pew – LaserTag 2026, the flagship retro-arcade laser tag event organized by CSI-VIT.",
    url: "https://lasertag.csivit.com",
    siteName: "LaserTag 2026",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LaserTag 2026 | CSI VIT",
    description:
      "From Pixels to Pew Pew – LaserTag 2026, the flagship retro-arcade laser tag event organized by CSI-VIT.",
    creator: "@csivitu",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "U5vRD_lTmCPfRNhsGSPTmIqCnts8k6EIXp8AdSGHnB4",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${arcade.variable} ${pressStart.variable} ${oxanium.variable} ${anton.variable} ${pixelOperatorMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <VitEnforcement />
      </body>
    </html>
  );
}
