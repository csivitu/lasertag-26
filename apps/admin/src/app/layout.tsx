import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LaserTag '26 Admin Console",
  description: "Admin workstation for slot scheduling, QR venue check-in, and payments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0B0F17] text-slate-100 min-h-screen antialiased">{children}</body>
    </html>
  );
}
