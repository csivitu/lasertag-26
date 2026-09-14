"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BaseFields } from "./BaseFields";
import { PixelButton } from "../hero/PixelButton";
import { useSession } from "@/lib/auth-client";

export function SoloForm() {
  const router = useRouter();
  const { data: session } = useSession();

  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
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
      // Store registration data in localStorage and sessionStorage for the subsequent slot booking step
      const soloPayload = {
        fullName: fullName.trim(),
        registrationNumber: registrationNumber.trim(),
        email: emailId.trim(),
        phoneNumber: phoneNumber.trim(),
        type: "individual",
      };
      
      localStorage.setItem("lasertag_selected_mode", "solo");
      sessionStorage.setItem("lasertag_selected_mode", "solo");
      localStorage.setItem("lasertag_onboarding_solo", JSON.stringify(soloPayload));
      sessionStorage.setItem("lasertag_onboarding_solo", JSON.stringify(soloPayload));

      setStatus("success");
      setTimeout(() => {
        router.push("/slot-booking");
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
      <div style={{ marginTop: "4px" }}>
        <PixelButton
          type="submit"
          label={status === "submitting" ? "RECORDING..." : "CONFIRM PROFILE"}
          disabled={status === "submitting"}
        />
      </div>
    </form>
  );
}
