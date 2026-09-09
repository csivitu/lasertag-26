"use client";

import type { CSSProperties } from "react";
import { INPUT_BORDER_SVG, borderBg } from "./modePopupDecor";

export interface BaseFieldsProps {
  fullName: string;
  registrationNumber: string;
  emailId: string;
  phoneNumber: string;
  onFullNameChange: (v: string) => void;
  onRegistrationNumberChange: (v: string) => void;
  onEmailIdChange: (v: string) => void;
  onPhoneNumberChange: (v: string) => void;
}

const labelStyle: CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: "clamp(6px, 1.2vw, 9px)",
  color: "#ffffff",
  letterSpacing: "0.1em",
  marginBottom: "4px",
  display: "block",
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
  fontFamily: "'Oxanium', sans-serif",
  fontWeight: 400,
  fontSize: "clamp(11px, 1.5vw, 14px)",
  padding: "10px 14px",
  outline: "none",
  border: "none",
};

interface FieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

function Field({ label, id, value, onChange, placeholder = "", type = "text" }: FieldProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <div style={inputWrapStyle}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

/** Four shared fields present in every form variant. */
export function BaseFields({
  fullName,
  registrationNumber,
  emailId,
  phoneNumber,
  onFullNameChange,
  onRegistrationNumberChange,
  onEmailIdChange,
  onPhoneNumberChange,
}: BaseFieldsProps) {
  return (
    <>
      <Field
        label="FULL NAME"
        id="popup-full-name"
        value={fullName}
        onChange={onFullNameChange}
        placeholder="Name"
      />
      <Field
        label="REGISTRATION NUMBER"
        id="popup-reg-number"
        value={registrationNumber}
        onChange={onRegistrationNumberChange}
        placeholder="24XYZ006"
      />
      <Field
        label="EMAIL ID"
        id="popup-email"
        value={emailId}
        onChange={onEmailIdChange}
        placeholder="abc@gmail.com"
        type="email"
      />
      <Field
        label="PHONE NUMBER"
        id="popup-phone"
        value={phoneNumber}
        onChange={onPhoneNumberChange}
        placeholder="9374537484"
        type="tel"
      />
    </>
  );
}
