"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BaseFields } from "./BaseFields";
import { PixelButton } from "../hero/PixelButton";
import { useSession, apiBaseUrl } from "@/lib/auth-client";
import { useUserProfile } from "@/hooks/useUserProfile";

interface JoinTeamFormProps {
  onSuccess?: () => void;
}

export function JoinTeamForm({ onSuccess }: JoinTeamFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { profile, refetch } = useUserProfile();

  const [teamCode, setTeamCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");

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

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (val.length <= 8) {
      setTeamCode(val);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!teamCode.trim()) {
      setError("Please enter the squad combat code.");
      return;
    }

    if (!fullName.trim() || !registrationNumber.trim() || !emailId.trim() || !phoneNumber.trim()) {
      setError("Please complete all personal operative fields.");
      return;
    }

    if (!emailId.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");

    try {
      // Save operative details directly to server and join team (Zero localStorage)
      const res = await fetch(`${apiBaseUrl}/teams/${teamCode.trim().toUpperCase()}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: fullName.trim(),
          regNo: registrationNumber.trim(),
          phone: phoneNumber.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || "Failed to join squad. Please verify code.");
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
      const message = err instanceof Error ? err.message : "Squad join operation failed.";
      setError(message);
    }
  }

  return (
    <form className="mode-popup-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Team Code Input */}
      <div className="mode-popup-field">
        <label htmlFor="join-code" className="mode-popup-label">
          SQUAD COMBAT CODE
        </label>
        <div className="mode-popup-input-wrapper">
          <input
            id="join-code"
            type="text"
            className="mode-popup-input"
            value={teamCode}
            onChange={handleCodeChange}
            placeholder="e.g. 7K2M9X"
            autoComplete="off"
            style={{
              letterSpacing: "0.2em",
              fontFamily: "var(--ft-pixel), monospace",
              color: "#00F0FF",
              fontWeight: "bold",
            }}
          />
        </div>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: "9px",
            color: "rgba(255,255,255,0.45)",
            fontFamily: "var(--ft-pixel), monospace",
          }}
        >
          Enter the 6-8 digit alphanumeric code provided by your squad leader.
        </p>
      </div>

      {/* Operative Credentials */}
      <div
        style={{
          borderTop: "1px dashed rgba(0, 240, 255, 0.3)",
          paddingTop: "12px",
          marginTop: "4px",
        }}
      >
        <p
          style={{
            margin: "0 0 10px",
            fontFamily: "var(--ft-pixel), monospace",
            fontSize: "10px",
            color: "#00F0FF",
            letterSpacing: "0.05em",
          }}
        >
          OPERATIVE CREDENTIALS:
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

      {error && (
        <p className="mode-popup-form-error" role="alert">
          {error}
        </p>
      )}

      {status === "success" && (
        <p className="mode-popup-form-success" role="status">
          Squad joined successfully! Redirecting to operative profile...
        </p>
      )}

      <PixelButton
        type="submit"
        disabled={status === "submitting"}
        label={status === "submitting" ? "CONNECTING SQUAD..." : "JOIN SQUAD"}
      />
    </form>
  );
}
