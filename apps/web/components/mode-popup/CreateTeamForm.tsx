"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { BaseFields } from "./BaseFields";
import { PixelButton } from "../hero/PixelButton";
import { INPUT_BORDER_SVG, PINK_INPUT_BORDER_SVG, borderBg } from "./modePopupDecor";
import { useSession, apiBaseUrl } from "@/lib/auth-client";

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

interface CreateTeamFormProps {
  onClose?: () => void;
}

export function CreateTeamForm({ onClose }: CreateTeamFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [teamName, setTeamName] = useState("");
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

  // Generated once when the component mounts; frozen for the session.
  const teamCode = useMemo(() => generateCode(), []);
  const [copied, setCopied] = useState(false);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(teamCode);
    } catch {
      // Clipboard API unavailable (permissions/insecure context) — fallback.
      const ta = document.createElement("textarea");
      ta.value = teamCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!session?.user?.id) {
      setError("Please sign in before creating a squad.");
      return;
    }

    if (
      !fullName.trim() ||
      !registrationNumber.trim() ||
      !emailId.trim() ||
      !phoneNumber.trim() ||
      !teamName.trim()
    ) {
      setError("Please fill in all fields before creating your team.");
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

    setStatus("submitting");

    try {
      const res = await fetch(`${apiBaseUrl}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          leader_id: session.user.id,
          team_code: teamCode,
          name: teamName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to create team in arena database");
      }

      const teamPayload = {
        teamCode,
        teamName: teamName.trim(),
        isLeader: true,
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
      const msg = err instanceof Error ? err.message : "Failed to create team";
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

      {/* Team Name */}
      <div className="mode-popup-field" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <label className="mode-popup-label" htmlFor="popup-team-name" style={labelStyle}>
          TEAM NAME<sup style={{ color: "#ff7abf", fontSize: "0.85em", lineHeight: 0 }}>*</sup>
        </label>
        <div className="mode-popup-input-wrap" style={inputWrapStyle}>
          <input
            id="popup-team-name"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Code Red"
            className="mode-popup-input"
            style={inputStyle}
            autoComplete="off"
          />
        </div>
      {error && <p className="mode-popup-form-error" role="alert">{error}</p>}
      {status === "success" && (
        <div className="flex flex-col items-center gap-3 pt-1 text-center" role="status">
          <p className="font-pixel text-[13px] tracking-[0.1em] text-[#FEDC02]">
            TEAM CREATED
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
      </div>

      {/* Team Code row: pink code badge + Create Team button */}
      <div
        className="max-sm:flex-col max-sm:items-stretch max-sm:gap-3"
        style={{ display: "flex", alignItems: "flex-end", gap: "14px", marginTop: "4px" }}
      >
        <div className="mode-popup-field" style={{ display: "flex", flexDirection: "column", flexShrink: 0, gap: 0 }}>
          <label className="mode-popup-label" style={labelStyle}>TEAM CODE</label>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div
            className="mode-popup-code"
            style={{
              position: "relative",
              background: borderBg(PINK_INPUT_BORDER_SVG),
              width: "140px",
              height: "40px",
              display: "flex",
              alignItems: "center",
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
                padding: "0 12px",
              }}
            >
              {teamCode}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            title={copied ? "Copied!" : "Copy team code"}
            aria-label="Copy team code"
            className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center transition-all hover:scale-110 active:scale-95"
            style={{ color: copied ? "#4ade80" : "#e5349e" }}
          >
            {copied ? (
              <svg viewBox="0 0 24 24" aria-hidden shapeRendering="crispEdges" className="h-6 w-6" fill="currentColor">
                <rect x="3" y="12" width="3" height="3" />
                <rect x="6" y="15" width="3" height="3" />
                <rect x="9" y="12" width="3" height="3" />
                <rect x="12" y="9" width="3" height="3" />
                <rect x="15" y="6" width="3" height="3" />
                <rect x="18" y="3" width="3" height="3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden shapeRendering="crispEdges" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="3" width="12" height="12" />
                <rect x="3" y="9" width="12" height="12" fill="#08080d" />
              </svg>
            )}
          </button>
          </div>
        </div>

        {status !== "success" && (
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <PixelButton
              type="submit"
              label={status === "submitting" ? "CREATING..." : "CREATE TEAM"}
              interaction="simple"
              className="w-[240px]"
            labelClassName="text-[12px] lg:text-[14px]"
            disabled={status === "submitting"}
            />
          </div>
        )}
      </div>
    </form>
  );
}
