"use client";

import type { CSSProperties } from "react";
import { MODAL_BORDER_SVG, borderBg, type PopupMode } from "./modePopupDecor";
import { SoloForm } from "./SoloForm";
import { CreateTeamForm } from "./CreateTeamForm";
import { JoinTeamForm } from "./JoinTeamForm";

interface ModePopupDesktopProps {
  mode: PopupMode;
  onClose: () => void;
}

/**
 * Card dimensions — traced from the Figma desktop mockup.
 *
 * The design shows the card occupying roughly 59% of a ~1024px-wide viewport
 * (≈603px), with a height that fits the content + generous vertical padding.
 * The box is notably wider than it is tall (landscape rectangle), so we fix
 * the width at 600px and let height be driven by content + padding.
 *
 * The SVG border (boxborder.svg, 864×761 viewBox) scales via
 * preserveAspectRatio="none" so it always fills the card exactly.
 */
const cardStyle: CSSProperties = {
  position: "relative",
  background: borderBg(MODAL_BORDER_SVG),
  /* Middleground padding to match reference */
  padding: "36px 44px 32px",
  width: "540px",
  maxWidth: "92vw",
  /* No fixed height — grows with content */
  maxHeight: "92vh",
  overflowY: "auto",
  boxSizing: "border-box",
};

const titleStyle: CSSProperties = {
  fontFamily: "var(--ft-pixel), monospace",
  fontSize: "22px",
  color: "#FEDC02",
  textAlign: "center",
  letterSpacing: "0.08em",
  marginBottom: "28px",
  lineHeight: 1.3,
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.82)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

export function ModePopupDesktop({ mode, onClose }: ModePopupDesktopProps) {
  return (
    <div
      style={overlayStyle}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Registration details"
    >
      <div
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={titleStyle}>ENTER DETAILS</h2>
        {mode === "solo" && <SoloForm />}
        {mode === "create_team" && <CreateTeamForm />}
        {mode === "join_team" && <JoinTeamForm />}
      </div>
    </div>
  );
}
