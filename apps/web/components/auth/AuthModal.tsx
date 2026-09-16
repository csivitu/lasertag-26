"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { markHasAccount } from "@/lib/auth-mode";
import { PixelButton } from "@/components/hero/PixelButton";
import { NavArrow } from "@/components/hero/NavArrow";
import {
  INPUT_BORDER_SVG,
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

const titleStyle: CSSProperties = {
  fontFamily: "var(--ft-pixel), monospace",
  fontSize: "20px",
  color: "#FEDC02",
  textAlign: "center",
  letterSpacing: "0.08em",
  marginBottom: "16px",
  lineHeight: 1.3,
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

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "signup",
}: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTab(initialMode);
      setErrorMsg("");
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  async function handleGoogleAuth() {
    setErrorMsg("");
    setStatus("loading");
    try {
      markHasAccount();
      await signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill in email and password.");
      return;
    }

    if (!email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (tab === "signup") {
      if (!name.trim()) {
        setErrorMsg("Please enter your name.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
    }

    setStatus("loading");

    try {
      if (tab === "signup") {
        const res = await signUp.email({
          email: email.trim(),
          password,
          name: name.trim(),
        });

        if (res.error) {
          setStatus("error");
          setErrorMsg(
            res.error.message ||
              "Signup failed. Please verify your details."
          );
          return;
        }
      } else {
        const res = await signIn.email({
          email: email.trim(),
          password,
        });

        if (res.error) {
          setStatus("error");
          setErrorMsg(
            res.error.message ||
              "Invalid email or password. Please try again."
          );
          return;
        }
      }

      setStatus("idle");
      markHasAccount();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setStatus("error");
      const message =
        err instanceof Error
          ? err.message
          : "Could not connect to API server. Please ensure the backend is running.";
      setErrorMsg(message);
    }
  }

  return (
    <div
      style={overlayStyle}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Account Authentication"
    >
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header Tabs */}
        <div className="flex justify-center gap-4 mb-4 border-b border-[#333] pb-3">
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setErrorMsg("");
            }}
            className={`group relative inline-flex items-center font-pixel text-[11px] tracking-[0.1em] uppercase px-3 py-1.5 transition-colors ${
              tab === "signup"
                ? "text-[#FEDC02]"
                : "text-zinc-400 hover:text-accent"
            }`}
          >
            <span
              aria-hidden
              className="nav-arrow-marker pointer-events-none absolute right-full top-1/2 mr-[0.5em] -mt-[0.625em] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            >
              <NavArrow />
            </span>
            CREATE ACCOUNT
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signin");
              setErrorMsg("");
            }}
            className={`group relative inline-flex items-center font-pixel text-[11px] tracking-[0.1em] uppercase px-3 py-1.5 transition-colors ${
              tab === "signin"
                ? "text-[#FEDC02]"
                : "text-zinc-400 hover:text-accent"
            }`}
          >
            <span
              aria-hidden
              className="nav-arrow-marker pointer-events-none absolute right-full top-1/2 mr-[0.5em] -mt-[0.625em] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            >
              <NavArrow />
            </span>
            SIGN IN
          </button>
        </div>

        {/* Google OAuth Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded border border-white/25 bg-white/10 hover:bg-white/15 transition-colors text-white font-body font-bold text-base tracking-[0.08em] cursor-pointer"
          >
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
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
            <span>CONTINUE WITH GOOGLE</span>
          </button>

          <div className="flex items-center my-3">
            <div className="flex-1 border-t border-white/15" />
            <span className="px-2 text-zinc font-mono text-sm tracking-widest">
              OR
            </span>
            <div className="flex-1 border-t border-white/15" />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          {tab === "signup" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <label style={labelStyle} htmlFor="auth-name">
                PLAYER NAME
              </label>
              <div style={inputWrapStyle}>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Commander John"
                  style={inputStyle}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <label style={labelStyle} htmlFor="auth-email">
              EMAIL ID
            </label>
            <div style={inputWrapStyle}>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@example.com"
                style={inputStyle}
                autoComplete="email"
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <label style={labelStyle} htmlFor="auth-password">
              PASSWORD
            </label>
            <div style={inputWrapStyle}>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                autoComplete={tab === "signup" ? "new-password" : "current-password"}
              />
            </div>
          </div>

          {tab === "signup" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <label style={labelStyle} htmlFor="auth-confirm-password">
                CONFIRM PASSWORD
              </label>
              <div style={inputWrapStyle}>
                <input
                  id="auth-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <p
              className="text-[#ff3b30] text-xs font-mono tracking-tight mt-1 text-center"
              role="alert"
            >
              {errorMsg}
            </p>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "10px",
            }}
          >
            <PixelButton
              type="submit"
              label={
                status === "loading"
                  ? "PROCESSING..."
                  : tab === "signup"
                  ? "SIGN UP"
                  : "SIGN IN"
              }
              interaction="simple"
              className="w-[220px]"
              labelClassName="text-[13px]"
              disabled={status === "loading"}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
