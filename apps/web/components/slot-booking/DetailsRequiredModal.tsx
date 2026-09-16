"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { PixelButton } from "@/components/hero/PixelButton";
import {
  INPUT_BORDER_SVG,
  MODAL_BORDER_SVG,
  borderBg,
} from "@/components/mode-popup/modePopupDecor";
import { useSession } from "@/lib/auth-client";
import { saveOnboardingDetails } from "@/lib/onboarding-details";

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.88)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 60,
  padding: "16px",
};

const cardStyle: CSSProperties = {
  position: "relative",
  background: borderBg(MODAL_BORDER_SVG),
  padding: "36px 32px 28px",
  width: "100%",
  maxWidth: "460px",
  maxHeight: "92vh",
  overflowY: "auto",
  boxSizing: "border-box",
};

const labelStyle: CSSProperties = {
  fontFamily: "var(--ft-pixel), monospace",
  fontSize: "11px",
  color: "#ffffff",
  letterSpacing: "0.08em",
  marginBottom: "6px",
  display: "block",
  lineHeight: 1,
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
  fontFamily: "var(--ft-body), sans-serif",
  fontWeight: 400,
  fontSize: "15px",
  padding: "10px 14px",
  outline: "none",
  border: "none",
  lineHeight: 1.4,
};

/**
 * Persistent gate on slot booking: blocks until the operative has a
 * registration number + phone on their DB row. No close button and no
 * overlay dismiss — it stays until the details are saved.
 */
export function DetailsRequiredModal({
  regNumber,
  phone,
  onSaved,
}: {
  regNumber?: string | null;
  phone?: string | null;
  onSaved: () => void;
}) {
  const { data: session } = useSession();
  const [fullName, setFullName] = useState(session?.user?.name ?? "");
  const [registrationNumber, setRegistrationNumber] = useState(regNumber ?? "");
  const [phoneNumber, setPhoneNumber] = useState(phone ?? "");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const prefilled = useRef(false);

  // Prefill once from the signed-in account. VIT emails carry the reg
  // number as the last name token (e.g. "Aarav 23BCE1234"), so a reg-no
  // shaped trailing token becomes the default — still editable.
  useEffect(() => {
    if (prefilled.current) return;
    prefilled.current = true;
    if (session?.user?.name && !fullName) {
      setFullName(session.user.name);
    }
    if (!registrationNumber && session?.user?.name) {
      const tokens = session.user.name.trim().split(/\s+/);
      const last = (tokens[tokens.length - 1] ?? "").toUpperCase();
      if (/^\d{2}[A-Z]{3}\d{4}$/.test(last)) {
        setRegistrationNumber(last);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.name]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim() || !registrationNumber.trim() || !phoneNumber.trim()) {
      setErrorMsg("Please fill in all fields to continue.");
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber.trim())) {
      setErrorMsg("Please enter a valid 10-digit phone number.");
      return;
    }

    setStatus("saving");
    const failure = await saveOnboardingDetails({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      registrationNumber: registrationNumber.trim(),
    });
    setStatus("idle");

    if (failure) {
      setErrorMsg(failure);
      return;
    }
    onSaved();
  }

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Details Required">
      <div style={cardStyle}>
        <h2
          className="font-pixel text-center text-[#FEDC02] uppercase"
          style={{ fontSize: "18px", letterSpacing: "0.08em", marginBottom: "8px" }}
        >
          operative details required
        </h2>
        <p className="font-pixel text-center text-[11px] text-white/70 leading-relaxed mb-5">
          ENTER YOUR REGISTRATION NUMBER AND PHONE NUMBER TO UNLOCK ARENA SLOT BOOKING.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={labelStyle} htmlFor="details-name">FULL NAME</label>
            <div style={inputWrapStyle}>
              <input
                id="details-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Commander John"
                style={inputStyle}
                autoComplete="name"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle} htmlFor="details-reg">REGISTRATION NUMBER</label>
            <div style={inputWrapStyle}>
              <input
                id="details-reg"
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                placeholder="23BCE1234"
                style={inputStyle}
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle} htmlFor="details-phone">PHONE NUMBER</label>
            <div style={inputWrapStyle}>
              <input
                id="details-phone"
                type="tel"
                inputMode="numeric"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                style={inputStyle}
                autoComplete="tel"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-[#ff3b30] text-xs font-mono tracking-tight mt-1 text-center" role="alert">
              {errorMsg}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
            <PixelButton
              type="submit"
              label={status === "saving" ? "SAVING..." : "SAVE & CONTINUE"}
              interaction="simple"
              className="w-[220px]"
              labelClassName="text-[13px]"
              disabled={status === "saving"}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
