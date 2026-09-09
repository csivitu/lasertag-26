"use client";

/**
 * ArcadeButton — a custom pink pill CTA matching the retro-arcade design.
 *
 * Intended as a temporary stand-in until Manan's shared Button component is
 * pushed and available for import.  At that point, swap this component's
 * usage with the shared one and delete this file.
 *
 * Visual spec (from Figma screenshots):
 *   - Solid hot-pink (#F949CC) fill
 *   - Pill shape (fully rounded ends, border-radius: 9999px)
 *   - Dark magenta/purple border for depth (~2px #7211C0)
 *   - White text, Press Start 2P font, uppercase
 *   - Slight drop-shadow glow in pink
 *   - Press state: scales down slightly (active:scale-[0.96])
 */

import type { CSSProperties } from "react";

interface ArcadeButtonProps {
  label: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}

const btnStyle: CSSProperties = {
  fontFamily: "var(--ft-pixel), monospace",
  fontSize: "clamp(9px, 1.4vw, 13px)",
  letterSpacing: "0.12em",
  color: "#ffffff",
  background: "#F949CC",
  border: "2px solid #7211C0",
  borderRadius: "9999px",
  padding: "10px 28px",
  cursor: "pointer",
  boxShadow: "0 0 12px 2px rgba(249,73,204,0.55), 0 2px 0 #7211C0",
  transition: "transform 0.08s ease, box-shadow 0.08s ease, filter 0.08s ease",
  display: "inline-block",
  whiteSpace: "nowrap",
};

export function ArcadeButton({ label, type = "button", onClick, disabled }: ArcadeButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="active:scale-[0.96] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
      style={btnStyle}
    >
      {label}
    </button>
  );
}
