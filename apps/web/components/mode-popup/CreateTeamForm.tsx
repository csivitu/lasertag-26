"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BaseFields } from "./BaseFields";
import { PixelButton } from "../hero/PixelButton";
import { useSession, apiBaseUrl } from "@/lib/auth-client";
import { useUserProfile } from "@/hooks/useUserProfile";

function generateTeamCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface CreateTeamFormProps {
  onSuccess?: () => void;
}

export function CreateTeamForm({ onSuccess }: CreateTeamFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { profile, refetch } = useUserProfile();

  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setTeamCode(generateTeamCode());
  }, []);

  useEffect(() => {
    if (profile) {
      if (profile.name && !fullName) setFullName(profile.name);
      if (profile.regNo && !registrationNumber) setRegistrationNumber(profile.regNo);
      if (profile.email && !emailId) setEmailId(profile.email);
      if (profile.phone && !phoneNumber) setPhoneNumber(profile.phone);
    } else if (session?.user) {
      if (session.user.name && !fullName) {
        setFullName(session.user.name);
      }
      if (session.user.email && !emailId) {
        setEmailId(session.user.email);
      }
    }
  }, [session, profile, fullName, registrationNumber, emailId, phoneNumber]);

  function handleRegenerateCode() {
    setTeamCode(generateTeamCode());
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!teamName.trim()) {
      setError("Please enter a squad / team name.");
      return;
    }

    if (!fullName.trim() || !registrationNumber.trim() || !emailId.trim() || !phoneNumber.trim()) {
      setError("Please complete all leader personal fields.");
      return;
    }

    if (!emailId.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");

    try {
      // Create team and update profile directly on server (Zero localStorage)
      const res = await fetch(`${apiBaseUrl}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: teamName.trim(),
          team_code: teamCode.trim(),
          fullName: fullName.trim(),
          regNo: registrationNumber.trim(),
          phone: phoneNumber.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || "Failed to establish squad.");
      }

      await refetch();

      setStatus("success");
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/profile");
        }
      }, 700);
    } catch (err: unknown) {
      setStatus("idle");
      const message = err instanceof Error ? err.message : "Failed to create squad.";
      setError(message);
    }
  }

  return (
    <form className="mode-popup-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Team Name Input */}
      <div className="mode-popup-field">
        <label htmlFor="team-name" className="mode-popup-label">
          SQUAD DESIGNATION (TEAM NAME)
        </label>
        <div className="mode-popup-input-wrapper">
          <input
            id="team-name"
            type="text"
            className="mode-popup-input"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. CYBER VIPERS"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Generated Team Code Display */}
      <div className="mode-popup-field">
        <label className="mode-popup-label">ASSIGNED SQUAD CODE</label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            className="mode-popup-input-wrapper"
            style={{ flex: 1, position: "relative" }}
          >
            <input
              type="text"
              readOnly
              value={teamCode}
              className="mode-popup-input"
              style={{
                letterSpacing: "0.2em",
                fontFamily: "var(--ft-pixel), monospace",
                color: "#FEDC02",
                fontWeight: "bold",
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleRegenerateCode}
            title="Generate new code"
            style={{
              background: "rgba(254, 220, 2, 0.1)",
              border: "1px solid rgba(254, 220, 2, 0.4)",
              color: "#FEDC02",
              fontFamily: "var(--ft-pixel), monospace",
              fontSize: "9px",
              padding: "8px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            ROLL NEW
          </button>
        </div>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: "9px",
            color: "rgba(255,255,255,0.45)",
            fontFamily: "var(--ft-pixel), monospace",
          }}
        >
          Share this combat code with up to 4 operatives to join your squad.
        </p>
      </div>

      {/* Leader details */}
      <div
        style={{
          borderTop: "1px dashed rgba(254, 220, 2, 0.3)",
          paddingTop: "12px",
          marginTop: "4px",
        }}
      >
        <p
          style={{
            margin: "0 0 10px",
            fontFamily: "var(--ft-pixel), monospace",
            fontSize: "10px",
            color: "#FEDC02",
            letterSpacing: "0.05em",
          }}
        >
          SQUAD LEADER CREDENTIALS:
        </p>
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
      </div>

      {error && <p className="mode-popup-form-error" role="alert">{error}</p>}
      {status === "success" && (
        <p className="mode-popup-form-success" role="status">
          Squad forged! Redirecting to operative profile...
        </p>
      )}

      <PixelButton
        type="submit"
        disabled={status === "submitting"}
        label={status === "submitting" ? "FORGING SQUAD..." : "FORGE SQUAD"}
      />
    </form>
  );
}
