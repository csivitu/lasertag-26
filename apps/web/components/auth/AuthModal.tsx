"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { signIn } from "@/lib/auth-client";
import { markHasAccount } from "@/lib/auth-mode";
import { VIT_DOMAINS, clearExternalSignin, markExternalSignin } from "@/lib/vit";
import {
  MODAL_BORDER_SVG,
  borderBg,
} from "@/components/mode-popup/modePopupDecor";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: "signin" | "signup";
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.88)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 60,
  padding: "16px",
  overflow: "hidden",
};

const cardStyle: CSSProperties = {
  position: "relative",
  background: borderBg(MODAL_BORDER_SVG),
  padding: "40px 36px 40px",
  width: "100%",
  maxWidth: "420px",
  // Compact popup — content only, card itself never scrolls
  maxHeight: "none",
  minHeight: "0",
  overflow: "hidden",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "center",
};

const titleStyle: CSSProperties = {
  fontFamily: "var(--ft-pixel), monospace",
  fontSize: "20px",
  color: "#FEDC02",
  textAlign: "center",
  letterSpacing: "0.08em",
  marginBottom: "8px",
  lineHeight: 1.3,
};

const closeBtnStyle: CSSProperties = {
  position: "absolute",
  top: "20px",
  right: "22px",
  width: "28px",
  height: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  outline: "none",
  color: "rgba(255,255,255,0.55)",
  cursor: "pointer",
  padding: 0,
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Lock background scroll while popup is open + close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    setErrorMsg("");
    setStatus("idle");

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (
        ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)
      ) {
        e.preventDefault();
      }
    }
    // Non-passive listeners so preventDefault actually blocks wheel/touch scroll
    function onWheel(e: WheelEvent) {
      e.preventDefault();
    }
    function onTouch(e: TouchEvent) {
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouch, { passive: false });
    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouch);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleGoogleAuth(external = false) {
    setErrorMsg("");
    setStatus("loading");
    try {
      markHasAccount();
      if (external) {
        markExternalSignin();
      } else {
        clearExternalSignin();
      }
      await signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
        // VIT path: Google filters the account chooser to the hosted domain
        // right at OAuth. External path omits it. VitEnforcement verifies
        // the email domain after sign-in either way.
        ...(external ? {} : { additionalParams: { hd: VIT_DOMAINS[0] } }),
      });
    } catch (err: unknown) {
      setStatus("error");
      const message =
        err instanceof Error
          ? err.message
          : "Google Sign-In failed. Please try again.";
      setErrorMsg(message);
    }
  }

  return (
    <div
      style={{ ...overlayStyle, overscrollBehavior: "contain", touchAction: "none" }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Sign In"
    >
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in popup"
          style={closeBtnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#FEDC02";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.55)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <h2 style={{ ...titleStyle, marginTop: "8px", marginBottom: "24px" }}>SIGN IN</h2>

        <button
          type="button"
          onClick={() => handleGoogleAuth()}
          disabled={status === "loading"}
          className="w-full flex items-center justify-center gap-2.5 sm:gap-3 py-3 sm:py-3.5 px-4 rounded border border-white/25 bg-white/10 hover:bg-white/15 transition-colors text-white font-body font-bold text-[13px] sm:text-base tracking-[0.08em] cursor-pointer disabled:opacity-60"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{status === "loading" ? "CONNECTING..." : "CONTINUE WITH GOOGLE"}</span>
        </button>

        {errorMsg && (
          <p
            className="text-[#ff3b30] text-xs font-mono tracking-tight mt-3 text-center"
            role="alert"
          >
            {errorMsg}
          </p>
        )}

        <p className="text-white text-[13px] font-body font-bold tracking-[0.08em] mt-2 text-center">
          (Register with your VIT email only)
        </p>
        <button
          type="button"
          onClick={() => handleGoogleAuth(true)}
          disabled={status === "loading"}
          className="mt-8 text-center font-body text-xs tracking-[0.08em] text-white/50 hover:text-[#FEDC02] transition-colors cursor-pointer disabled:opacity-60"
        >
          External Participant?
        </button>
      </div>
    </div>
  );
}
