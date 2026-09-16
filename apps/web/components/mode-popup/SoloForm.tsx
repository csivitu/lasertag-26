"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BaseFields } from "./BaseFields";
import { PixelButton } from "../hero/PixelButton";
import { useSession } from "@/lib/auth-client";

interface SoloFormProps {
  onClose?: () => void;
}

export function SoloForm({ onClose }: SoloFormProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
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
      // Store registration data in localStorage and sessionStorage for the subsequent slot booking step
      const soloPayload = {
        fullName: fullName.trim(),
        registrationNumber: registrationNumber.trim(),
        email: emailId.trim(),
        phoneNumber: phoneNumber.trim(),
        type: "individual",
      };

      // Clear any prior team state so user isn't mistakenly treated as a team reservation
      localStorage.removeItem("lasertag_active_team");
      sessionStorage.removeItem("lasertag_active_team");

      localStorage.setItem("lasertag_selected_mode", "solo");
      sessionStorage.setItem("lasertag_selected_mode", "solo");
      localStorage.setItem("lasertag_onboarding_solo", JSON.stringify(soloPayload));
      sessionStorage.setItem("lasertag_onboarding_solo", JSON.stringify(soloPayload));

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
            label={status === "submitting" ? "RECORDING..." : "CONFIRM PROFILE"}
            labelClassName="text-[12px] lg:text-[14px]"
            disabled={status === "submitting"}
          />
        </div>
      )}
    </form>
  );
}
