"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { BaseFields } from "./BaseFields";
import { ArcadeButton } from "./ArcadeButton";
import { INPUT_BORDER_SVG, PINK_INPUT_BORDER_SVG, borderBg } from "./modePopupDecor";

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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <label htmlFor="popup-team-name" style={labelStyle}>
          TEAM NAME
        </label>
        <div style={inputWrapStyle}>
          <input
            id="popup-team-name"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Blah Blah"
            style={inputStyle}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Team Code row: code badge (PINK border, read-only) + Create Team button */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", marginTop: "4px" }}>
        <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, gap: 0 }}>
          <label style={labelStyle}>TEAM CODE</label>
          {/* Team code box uses PINK border and dark magenta fill to match Figma! */}
          <div
            style={{
              position: "relative",
              /* Use border-image for 9-slice scaling so corners don't get squished */
              borderStyle: "solid",
              borderWidth: "8px",
              borderImage: `${borderBg(PINK_INPUT_BORDER_SVG).split(" ")[0]} 12 stretch`,
              width: "160px",
              padding: "0",
              /* Adjust margin to counteract the border width so it aligns nicely */
              margin: "-8px 0",
            }}
          >
            <div
              style={{
                ...inputStyle,
                color: "#ffffff", // White text for team code
                textAlign: "center",
                letterSpacing: "0.12em",
                userSelect: "all",
                /* Adjust padding since we have 8px borders now */
                padding: "2px 6px",
              }}
            >
              {teamCode}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <ArcadeButton type="submit" label="CREATE TEAM" />
        </div>
      </div>
    </form>
  );
}
