"use client";

import type { CSSProperties } from "react";
import { MODAL_BORDER_SVG, borderBg, type PopupMode } from "./modePopupDecor";
import { SoloForm } from "./SoloForm";
import { CreateTeamForm } from "./CreateTeamForm";
import { JoinTeamForm } from "./JoinTeamForm";

interface ModePopupMobileProps {
  mode: PopupMode;
  onClose: () => void;
  onSuccess?: () => void;
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
  padding: "36px 20px 24px",
  width: "100%",
  maxWidth: "420px",
  maxHeight: "calc(100dvh - 32px)",
  overflowY: "auto",
  boxSizing: "border-box",
  position: "relative",
};

const titleStyle: CSSProperties = {
  fontFamily: "var(--ft-pixel), monospace",
  fontSize: "clamp(11px, 4vw, 16px)",
  color: "#FEDC02",
  textAlign: "center",
  letterSpacing: "0.06em",
  marginBottom: "18px",
  lineHeight: 1.5,
};

export function ModePopupMobile({ mode, onClose, onSuccess }: ModePopupMobileProps) {
  const modeTitle =
    mode === "solo"
      ? "SOLO OPERATIVE"
      : mode === "create_team"
      ? "CREATE SQUAD TEAM"
      : "JOIN SQUAD TEAM";

  return (
    <div
      style={overlayStyle}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Registration details"
    >
      <div
        className="mode-popup-mobile-card relative"
        style={cardContainerStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-4 text-white/60 hover:text-white font-mono text-lg cursor-pointer transition-colors p-1"
        >
          ✕
        </button>

        <h2 style={titleStyle}>{modeTitle}</h2>
        {mode === "solo" && <SoloForm onSuccess={onSuccess} />}
        {mode === "create_team" && <CreateTeamForm onSuccess={onSuccess} />}
        {mode === "join_team" && <JoinTeamForm onSuccess={onSuccess} />}
      </div>
    </div>
  );
}
