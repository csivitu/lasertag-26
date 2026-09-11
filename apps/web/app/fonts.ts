import localFont from "next/font/local";

export const arcade = localFont({
  src: "./fonts/arcadeclassic.ttf",
  variable: "--ft-logo",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["monospace"],
});

export const pressStart = localFont({
  src: "./fonts/press-start-2p.ttf",
  variable: "--ft-pixel",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["monospace"],
});

export const oxanium = localFont({
  src: "./fonts/oxanium.ttf",
  variable: "--ft-body",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const anton = localFont({
  src: "./fonts/anton.ttf",
  variable: "--ft-heading",
  display: "swap",
  fallback: ["Impact", "sans-serif"],
});
