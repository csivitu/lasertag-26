"use client";

import QRCode from "react-qr-code";

/**
 * Real scannable QR for the booking's qrToken. Replaces the old decorative
 * placeholder SVG (which encoded nothing). When there is no token yet
 * (e.g. unconfirmed registration), shows a waiting note instead of a
 * misleading code.
 */
export function QrCode({ className = "", value }: { className?: string; value?: string | null }) {
  if (!value) {
    return (
      <div
        className={`${className} grid place-items-center bg-white text-black text-center text-[10px] font-mono p-2`}
      >
        QR available after confirmation
      </div>
    );
  }
  return <QRCode value={value} className={className} style={{ height: "auto", width: "100%" }} />;
}
