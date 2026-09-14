"use client";

import { useMemo, useState, useEffect } from "react";
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
  onSuccess?: () => void;
}

export function CreateTeamForm({ onSuccess }: CreateTeamFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [teamName, setTeamName] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user) {
      if (session.user.name && !fullName) {
        setFullName(session.user.name);
      }
      if (session.user.email && !emailId) {
        setEmailId(session.user.email);
      }
    }
  }, [session, fullName, emailId]);

  // Generated once when the component mounts; frozen for the session.
  const teamCode = useMemo(() => generateCode(), []);

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
      window.setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/slot-booking");
        }
      }, 700);
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
            placeholder="Code Red"
            className="mode-popup-input"
            style={inputStyle}
            autoComplete="off"
          />
        </div>
        {error && <p className="mode-popup-form-error" role="alert">{error}</p>}
        {status === "success" && (
          <p className="mode-popup-form-success" role="status">
            Team created! Share code <strong>{teamCode}</strong> with your teammates.
          </p>
        )}
      </div>

      {/* Team Code row: pink code badge + Create Team button */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", marginTop: "4px" }}>
        <div className="mode-popup-field" style={{ display: "flex", flexDirection: "column", flexShrink: 0, gap: 0 }}>
          <label className="mode-popup-label" style={labelStyle}>TEAM CODE</label>
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
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <PixelButton
            type="submit"
            label={status === "submitting" ? "CREATING..." : status === "success" ? "CREATED" : "CREATE TEAM"}
            interaction="simple"
            className="w-[240px]"
            labelClassName="text-[13px]"
            disabled={status === "submitting" || status === "success"}
          />
        </div>
      </div>
    </form>
  );
}
