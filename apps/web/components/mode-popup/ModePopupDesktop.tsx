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

const cardContainerStyle: CSSProperties = {
  position: "relative",
  background: borderBg(MODAL_BORDER_SVG),
  padding: "48px 40px 40px",
  width: "clamp(340px, 36vw, 520px)",
  maxHeight: "90vh",
  overflowY: "auto",
};

const titleStyle: CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: "clamp(13px, 2vw, 20px)",
  color: "#FEDC02",
  textAlign: "center",
  letterSpacing: "0.08em",
  marginBottom: "24px",
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

export function ModePopupDesktop({ mode, onClose }: ModePopupDesktopProps) {
  return (
    // Backdrop — click outside to close
    <div
      style={overlayStyle}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Registration details"
    >
      {/* Card — stop click propagation so clicking inside doesn't close */}
      <div
        style={cardContainerStyle}
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
