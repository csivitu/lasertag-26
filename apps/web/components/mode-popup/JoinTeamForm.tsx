"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { BaseFields } from "./BaseFields";
import { PixelButton } from "../hero/PixelButton";
import { INPUT_BORDER_SVG, borderBg } from "./modePopupDecor";

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

export function JoinTeamForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (
      !fullName.trim() ||
      !registrationNumber.trim() ||
      !emailId.trim() ||
      !phoneNumber.trim() ||
      !teamCode.trim()
    ) {
      setError("Please fill in all fields and enter a team code.");
      return;
    }

    if (!emailId.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    const cleanCode = teamCode.trim().toUpperCase();

    if (!/^[A-Z]{6}$/.test(cleanCode)) {
      setError("Team codes contain exactly 6 letters.");
      return;
    }

    setStatus("submitting");

    const teamPayload = {
      teamCode: cleanCode,
      isLeader: false,
    };

    localStorage.setItem("lasertag_selected_mode", "team");
    sessionStorage.setItem("lasertag_selected_mode", "team");
    localStorage.setItem("lasertag_active_team", JSON.stringify(teamPayload));
    sessionStorage.setItem("lasertag_active_team", JSON.stringify(teamPayload));

    setStatus("success");
    window.setTimeout(() => {
      // Check team's pass / profile
      router.push("/profile");
    }, 700);
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
        {error && <p className="mode-popup-form-error" role="alert">{error}</p>}
        {status === "success" && (
          <p className="mode-popup-form-success" role="status">
            Request submitted! You&apos;ve joined the team flow.
          </p>
        )}
      </div>

      {/* Join Team Button (centered below) */}
      <div className="mode-popup-submit" style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
        <PixelButton
          type="submit"
          label={status === "submitting" ? "Joining..." : status === "success" ? "Joined" : "Join Team"}
          interaction="simple"
          className="w-[240px]"
          labelClassName="text-[13px] cursor-pointer"
          disabled={status === "submitting" || status === "success"}
        />
      </div>
    </form>
  );
}
