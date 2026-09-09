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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
      <div className="mt-2 flex justify-center">
        <ArcadeButton type="submit" label="SUBMIT" />
      </div>
    </form>
  );
}
