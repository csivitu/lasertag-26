"use client";

import type { CSSProperties } from "react";
import { MODAL_BORDER_SVG, borderBg, type PopupMode } from "./modePopupDecor";
import { SoloForm } from "./SoloForm";
import { CreateTeamForm } from "./CreateTeamForm";
import { JoinTeamForm } from "./JoinTeamForm";

interface ModePopupDesktopProps {
  mode: PopupMode;
  onClose: () => void;
  onSuccess?: () => void;
}

const cardStyle: CSSProperties = {
  position: "relative",
  background: borderBg(MODAL_BORDER_SVG),
  padding: "36px 44px 32px",
  width: "540px",
  maxWidth: "92vw",
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

export function ModePopupDesktop({ mode, onClose, onSuccess }: ModePopupDesktopProps) {
  const modeTitle =
    mode === "solo"
      ? "SOLO OPERATIVE REGISTRATION"
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
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
        className="relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-5 text-white/60 hover:text-white font-mono text-xl cursor-pointer transition-colors p-1"
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
