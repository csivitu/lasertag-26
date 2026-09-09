"use client";

import type { CSSProperties } from "react";
import { MODAL_BORDER_SVG, borderBg, type PopupMode } from "./modePopupDecor";
import { SoloForm } from "./SoloForm";
import { CreateTeamForm } from "./CreateTeamForm";
import { JoinTeamForm } from "./JoinTeamForm";

interface ModePopupMobileProps {
  mode: PopupMode;
  onClose: () => void;
}

/** On mobile the modal takes most of the screen width, scrolls internally. */
const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.9)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
  padding: "16px",
};

const cardContainerStyle: CSSProperties = {
  background: borderBg(MODAL_BORDER_SVG),
  padding: "36px 24px 24px",
  width: "100%",
  maxWidth: "420px",
  maxHeight: "88vh",
  overflowY: "auto",
};

const titleStyle: CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: "clamp(11px, 4vw, 16px)",
  color: "#FEDC02",
  textAlign: "center",
  letterSpacing: "0.06em",
  marginBottom: "18px",
  lineHeight: 1.5,
};

export function ModePopupMobile({ mode, onClose }: ModePopupMobileProps) {
  return (
    <div
      style={overlayStyle}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Registration details"
    >
      <div
        style={cardContainerStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={titleStyle}>ENTER{"\n"}DETAILS</h2>
        {mode === "solo" && <SoloForm />}
        {mode === "create_team" && <CreateTeamForm />}
        {mode === "join_team" && <JoinTeamForm />}
      </div>
    </div>
  );
}
