"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { BaseFields } from "./BaseFields";
import { ArcadeButton } from "./ArcadeButton";
import { INPUT_BORDER_SVG, borderBg } from "./modePopupDecor";

const labelStyle: CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: "clamp(6px, 1.2vw, 9px)",
  color: "#23EFF1",
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

      {/* Team Code (user enters it) */}
      <div className="flex flex-col">
        <label htmlFor="popup-join-code" style={labelStyle}>
          TEAM CODE
        </label>
        <div style={inputWrapStyle}>
          <input
            id="popup-join-code"
            type="text"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
            placeholder="GTFXWY"
            style={{ ...inputStyle, letterSpacing: "0.12em" }}
            autoComplete="off"
            maxLength={8}
          />
        </div>
      </div>

      <div className="mt-2 flex justify-center">
        <ArcadeButton type="submit" label="JOIN TEAM" />
      </div>
    </form>
  );
}
