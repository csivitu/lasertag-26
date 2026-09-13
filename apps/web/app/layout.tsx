import type { Metadata, Viewport } from "next";
import "./globals.css";
import { anton, arcade, oxanium, pixelOperatorMono, pressStart } from "./fonts";

export const metadata: Metadata = {
    title: "LaserTag",
    description: "From Pixels to Pew Pew",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}