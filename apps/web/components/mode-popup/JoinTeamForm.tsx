"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { BaseFields } from "./BaseFields";
import { ArcadeButton } from "./ArcadeButton";
import { INPUT_BORDER_SVG, borderBg } from "./modePopupDecor";

const labelStyle: CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: "12px",
  color: "#ffffff",
  letterSpacing: "0.1em",
  marginBottom: "8px",
  display: "block",
  lineHeight: 1,
};

const inputWrapStyle: CSSProperties = {
  position: "relative",
  background: borderBg(INPUT_BORDER_SVG),
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  background: "transparent",
  color: "#ffffff",
  fontFamily: "'Oxanium', sans-serif",
  fontWeight: 400,
  fontSize: "16px",
  padding: "10px 14px",
  outline: "none",
  border: "none",
  lineHeight: 1.4,
};

export function JoinTeamForm() {
  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [teamCode, setTeamCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire up API call for join-team registration
    console.log({ fullName, registrationNumber, emailId, phoneNumber, teamCode });
  }

  return (
    <form className="mode-popup-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <BaseFields
        fullName={fullName}
        registrationNumber={registrationNumber}
        emailId={emailId}
        phoneNumber={phoneNumber}
        onFullNameChange={setFullName}
        onRegistrationNumberChange={setRegistrationNumber}
        onEmailIdChange={setEmailId}
        onPhoneNumberChange={setPhoneNumber}
      />

      {/* Team Code (full width) */}
      <div className="mode-popup-field" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <label className="mode-popup-label" htmlFor="popup-join-code" style={labelStyle}>
          TEAM CODE
        </label>
        <div className="mode-popup-input-wrap" style={inputWrapStyle}>
          <input
            id="popup-join-code"
            type="text"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
            placeholder="GTFXWY"
            className="mode-popup-input"
            style={{
              ...inputStyle,
              textTransform: "uppercase",
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Join Team Button (centered below) */}
      <div className="mode-popup-submit" style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
        <ArcadeButton type="submit" label="JOIN TEAM" />
      </div>
    </form>
  );
}
