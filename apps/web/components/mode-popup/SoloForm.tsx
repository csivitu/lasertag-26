"use client";

import { useState } from "react";
import { BaseFields } from "./BaseFields";
import { ArcadeButton } from "./ArcadeButton";

export function SoloForm() {
  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire up API call for solo registration
    console.log({ fullName, registrationNumber, emailId, phoneNumber });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
      <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
        <ArcadeButton type="submit" label="SUBMIT" />
      </div>
    </form>
  );
}
