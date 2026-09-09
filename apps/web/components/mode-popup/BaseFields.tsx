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

/**
 * Label style — Press Start 2P, uppercase, white, tight tracking.
 */
const labelStyle: CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: "12px",
  color: "#ffffff",
  letterSpacing: "0.08em",
  marginBottom: "8px",
  display: "block",
  lineHeight: 1,
};

/**
 * Input wrapper — carries the SVG border as its background.
 */
const inputWrapStyle: CSSProperties = {
  position: "relative",
  background: borderBg(INPUT_BORDER_SVG),
};

/**
 * Input field — Oxanium Regular 400, white text on transparent bg.
 */
const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  background: "transparent",
  color: "#ffffff",
  fontFamily: "'Oxanium', sans-serif",
  fontWeight: 400,
  fontSize: "16px",
  padding: "10px 14px",
  outline: "none",
  border: "none",
  lineHeight: 1.4,
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
    <div className="mode-popup-field" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <label className="mode-popup-label" htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <div className="mode-popup-input-wrap" style={inputWrapStyle}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mode-popup-input"
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
