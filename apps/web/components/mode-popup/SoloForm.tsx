"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BaseFields } from "./BaseFields";
import { PixelButton } from "../hero/PixelButton";
import { useSession, apiBaseUrl } from "@/lib/auth-client";
import { useUserProfile } from "@/hooks/useUserProfile";

interface SoloFormProps {
  onSuccess?: () => void;
}

export function SoloForm({ onSuccess }: SoloFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { profile, refetch } = useUserProfile();

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !registrationNumber.trim() || !emailId.trim() || !phoneNumber.trim()) {
      setError("Please fill in all fields before submitting.");
      return;
    }

    if (!emailId.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");

    try {
      // Save details directly to server/database (Zero localStorage persistence)
      const res = await fetch(`${apiBaseUrl}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: fullName.trim(),
          regNo: registrationNumber.trim(),
          phone: phoneNumber.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || "Failed to update profile.");
      }

      await refetch();

      setStatus("success");
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/slot-booking");
        }
      }, 600);
    } catch (err: unknown) {
      setStatus("idle");
      const message = err instanceof Error ? err.message : "Failed to proceed to slot booking.";
      setError(message);
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
      {error && <p className="mode-popup-form-error" role="alert">{error}</p>}
      {status === "success" && (
        <p className="mode-popup-form-success" role="status">
          Profile recorded! Proceeding to slot booking arena...
        </p>
      )}
      <PixelButton
        type="submit"
        disabled={status === "submitting"}
        label={status === "submitting" ? "CONNECTING..." : "CONFIRM & PROCEED"}
      />
    </form>
  );
}
