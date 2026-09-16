"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { BaseFields } from "./BaseFields";
import { PixelButton } from "../hero/PixelButton";
import { INPUT_BORDER_SVG, borderBg } from "./modePopupDecor";
import { useSession, apiBaseUrl } from "@/lib/auth-client";
import { saveOnboardingDetails } from "@/lib/onboarding-details";

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

interface JoinTeamFormProps {
  onClose?: () => void;
}

export function JoinTeamForm({ onClose }: JoinTeamFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");

  const prefilled = useRef(false);

  useEffect(() => {
    if (prefilled.current || !session?.user) return;
    prefilled.current = true;
    if (session.user.name) {
      setFullName(session.user.name);
    }
    if (session.user.email) {
      setEmailId(session.user.email);
    }
  }, [session]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!session?.user?.id) {
      setError("Please sign in before joining a team.");
      return;
    }

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

    if (phoneNumber.trim().length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
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

    try {
      const res = await fetch(`${apiBaseUrl}/teams/${cleanCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: session.user.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to join team in arena database");
      }

      const detailsError = await saveOnboardingDetails({
        fullName,
        phoneNumber,
        registrationNumber,
      });
      if (detailsError) throw new Error(detailsError);

      const teamPayload = {
        teamCode: cleanCode,
        isLeader: false,
      };

      // Clear any previous solo artifacts to cleanly switch to team mode
      localStorage.removeItem("lasertag_onboarding_solo");
      sessionStorage.removeItem("lasertag_onboarding_solo");

      localStorage.setItem("lasertag_selected_mode", "team");
      sessionStorage.setItem("lasertag_selected_mode", "team");
      localStorage.setItem("lasertag_active_team", JSON.stringify(teamPayload));
      sessionStorage.setItem("lasertag_active_team", JSON.stringify(teamPayload));

      setStatus("success");
    } catch (err: unknown) {
      setStatus("idle");
      const msg = err instanceof Error ? err.message : "Failed to join team";
      setError(msg);
    }
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
        emailLocked={Boolean(session?.user?.email)}
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
            onChange={(e) => setTeamCode(e.target.value)}
            placeholder="ABCDEF"
            maxLength={6}
            className="mode-popup-input"
            style={{ ...inputStyle, letterSpacing: "0.12em", textTransform: "uppercase" }}
            autoComplete="off"
          />
        </div>
      </div>

      {error && <p className="mode-popup-form-error" role="alert">{error}</p>}
      {status === "success" && (
        <div className="flex flex-col items-center gap-3 pt-1 text-center" role="status">
          <p className="font-pixel text-[13px] tracking-[0.1em] text-[#FEDC02]">
            JOINED {teamCode.trim().toUpperCase()}
          </p>
          <PixelButton
            label="PROCEED TO SLOT BOOKING →"
            onClick={() => router.push("/slot-booking")}
            labelClassName="text-[12px] lg:text-[14px]"
          />
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer font-pixel text-[11px] tracking-[0.1em] text-white/60 transition-colors hover:text-white"
          >
            ← PICK DIFFERENT
          </button>
        </div>
      )}

      {status !== "success" && (
        <div style={{ marginTop: "4px", display: "flex", justifyContent: "center" }}>
          <PixelButton
            type="submit"
            label={status === "submitting" ? "JOINING..." : "JOIN TEAM"}
            interaction="simple"
            labelClassName="text-[12px] lg:text-[14px]"
            disabled={status === "submitting"}
          />
        </div>
      )}
    </form>
  );
}
