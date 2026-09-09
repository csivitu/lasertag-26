"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { BaseFields } from "./BaseFields";
import { PixelButton } from "../hero/PixelButton";
import { INPUT_BORDER_SVG, PINK_INPUT_BORDER_SVG, borderBg } from "./modePopupDecor";

const labelStyle: CSSProperties = {
  fontFamily: "var(--ft-pixel), monospace",
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
  fontFamily: "var(--ft-body), sans-serif",
  fontWeight: 400,
  fontSize: "16px",
  padding: "10px 14px",
  outline: "none",
  border: "none",
  lineHeight: 1.4,
};

/** Generates a random 6 char uppercase team code, seeded once on mount. */
function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export function CreateTeamForm() {
  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [teamName, setTeamName] = useState("");

  // Generated once when the component mounts; frozen for the session.
  // TODO: swap with API-returned code once backend is ready.
  const teamCode = useMemo(() => generateCode(), []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire up API call for create-team registration
    console.log({ fullName, registrationNumber, emailId, phoneNumber, teamName, teamCode });
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

      {/* Team Name */}
      <div className="mode-popup-field" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <label className="mode-popup-label" htmlFor="popup-team-name" style={labelStyle}>
          TEAM NAME
        </label>
        <div className="mode-popup-input-wrap" style={inputWrapStyle}>
          <input
            id="popup-team-name"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Blah Blah"
            className="mode-popup-input"
            style={inputStyle}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Team Code row: compact pink code badge + Create Team button */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", marginTop: "4px" }}>
        <div className="mode-popup-field" style={{ display: "flex", flexDirection: "column", flexShrink: 0, gap: 0 }}>
          <label className="mode-popup-label" style={labelStyle}>TEAM CODE</label>
          {/* Keep the SVG as the element background so its fill stays inside the stepped border. */}
          <div
            className="mode-popup-code"
            style={{
              position: "relative",
              background: borderBg(PINK_INPUT_BORDER_SVG),
              width: "124px",
            }}
          >
            <div
              className="mode-popup-input"
              style={{
                ...inputStyle,
                color: "#ffffff",
                textAlign: "center",
                letterSpacing: "0.12em",
                userSelect: "all",
                padding: "3px 8px",
              }}
            >
              {teamCode}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <PixelButton
            type="submit"
            label="Create Team"
            className="w-[240px]"
            labelClassName="text-[13px]"
          />
        </div>
      </div>
    </form>
  );
}
