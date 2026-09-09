"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { BaseFields } from "./BaseFields";
import { ArcadeButton } from "./ArcadeButton";
import { INPUT_BORDER_SVG, PINK_INPUT_BORDER_SVG, borderBg } from "./modePopupDecor";

const labelStyle: CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: "clamp(6px, 1.2vw, 9px)",
  color: "#ffffff",
  letterSpacing: "0.1em",
  marginBottom: "4px",
  display: "block",
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
  fontSize: "clamp(11px, 1.5vw, 14px)",
  padding: "10px 14px",
  outline: "none",
  border: "none",
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
      <div className="flex flex-col">
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

      {/* Team Code row: code badge (cyan border, read-only) + Create Team button */}
      <div className="mt-2 flex items-end gap-3">
        <div className="flex flex-col flex-shrink-0">
          <label style={labelStyle}>TEAM CODE</label>
          {/* Team code box uses cyan border to match the other inputs */}
          <div
            style={{
              position: "relative",
              background: borderBg(INPUT_BORDER_SVG),
              minWidth: "100px",
            }}
          >
            <div
              style={{
                ...inputStyle,
                color: "#ffffff",
                letterSpacing: "0.12em",
                userSelect: "all",
              }}
            >
              {teamCode}
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <ArcadeButton type="submit" label="CREATE TEAM" />
        </div>
      </div>
    </form>
  );
}
