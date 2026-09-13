"use client";

import { useState } from "react";
import { BaseFields } from "./BaseFields";
import { PixelButton } from "../hero/PixelButton";

export function SoloForm() {
  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    window.setTimeout(() => setStatus("success"), 700);
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
          Registration submitted successfully. We&apos;ll see you at the arena!
        </p>
      )}
      <div className="mode-popup-submit" style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
        <PixelButton
          type="submit"
          label={status === "submitting" ? "Submitting..." : status === "success" ? "Submitted" : "Submit"}
          interaction="simple"
          className="w-[240px]"
          labelClassName="text-[13px]"
          disabled={status === "submitting" || status === "success"}
        />
      </div>
    </form>
  );
}
