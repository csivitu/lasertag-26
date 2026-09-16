"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BaseFields } from "./BaseFields";
import { PixelButton } from "../hero/PixelButton";
import { useSession, apiBaseUrl } from "@/lib/auth-client";
import { useUserProfile } from "@/hooks/useUserProfile";

interface SoloFormProps {
  onClose?: () => void;
}

export function SoloForm({ onClose }: SoloFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { profile, refetch } = useUserProfile();

  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");
  const prefilled = useRef(false);

  useEffect(() => {
    if (prefilled.current) return;
    if (profile) {
      prefilled.current = true;
      if (profile.name) setFullName(profile.name);
      if (profile.regNo) setRegistrationNumber(profile.regNo);
      if (profile.email) setEmailId(profile.email);
      if (profile.phone) setPhoneNumber(profile.phone);
    } else if (session?.user) {
      prefilled.current = true;
      if (session.user.name) setFullName(session.user.name);
      if (session.user.email) setEmailId(session.user.email);
    }
  }, [session, profile]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !registrationNumber.trim() || !emailId.trim() || !phoneNumber.trim()) {
      setError("Please fill in all fields before submitting.");
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

      await refetch?.();

      setStatus("success");
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
        emailLocked={Boolean(session?.user?.email)}
      />
      {error && <p className="mode-popup-form-error" role="alert">{error}</p>}
      {status === "success" && (
        <div className="flex flex-col items-center gap-3 pt-1 text-center" role="status">
          <p className="font-pixel text-[13px] tracking-[0.1em] text-[#FEDC02]">
            SOLO LOCKED IN
          </p>
          <PixelButton
            label="PROCEED TO SLOT BOOKING →"
            onClick={() => router.push("/slots")}
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
            label={status === "submitting" ? "RECORDING..." : "CONFIRM PROFILE"}
            labelClassName="text-[12px] lg:text-[14px]"
            disabled={status === "submitting"}
          />
        </div>
      )}
    </form>
  );
}
