"use client";

import { useState, useEffect } from "react";
import { signIn, signUp } from "@/lib/auth-client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: "signin" | "signup";
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "signin",
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setIsSignUp(initialMode === "signup");
  }, [initialMode]);

  if (!isOpen) return null;

  async function handleGoogleAuth() {
    setErrorMsg("");
    setStatus("loading");
    try {
      await signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
        errorCallbackURL: `${window.location.origin}/auth-error`,
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
    }

    if (!email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setErrorMsg("Please enter your operative name.");
        return;
      }
      if (password.length < 8) {
        setErrorMsg("Password must be at least 8 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
    }

    setStatus("loading");

    try {
      if (isSignUp) {
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
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setStatus("error");
      const message =
        err instanceof Error
          ? err.message
          : "Authentication encountered an error. Please retry.";
      setErrorMsg(message);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0e0e16] border-2 border-[#FEDC02] rounded-xl p-6 md:p-8 shadow-[0_0_30px_rgba(254,220,2,0.2)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white font-pixel text-xs p-1"
          aria-label="Close modal"
        >
          [ESC / X]
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <span className="font-pixel text-[10px] text-[#00F0FF] uppercase tracking-widest block mb-1">
            SECURITY CLEARANCE
          </span>
          <h3 className="font-heading text-xl md:text-2xl text-[#FEDC02] uppercase tracking-wider">
            {isSignUp ? "INITIALIZE OPERATIVE" : "OPERATIVE LOGIN"}
          </h3>
          <p className="font-pixel text-[11px] text-white/60 mt-1">
            {isSignUp
              ? "Register your credentials to secure arena access."
              : "Access the battle arena to manage team & booking."}
          </p>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="mb-4 p-2.5 bg-[#FF0055]/10 border border-[#FF0055] rounded text-[#FF0055] font-pixel text-[10px] text-center leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Google Auth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={status === "loading"}
          className="w-full mb-4 py-2.5 px-4 bg-white text-black hover:bg-white/90 font-pixel text-xs rounded border border-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          CONTINUE WITH GOOGLE
        </button>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 font-pixel text-[9px] text-white/40 uppercase">
            OR USE CREDENTIALS
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <div>
              <label className="block font-pixel text-[9px] text-white/70 mb-1 uppercase">
                OPERATIVE CALLSIGN (NAME)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Commander Shepherd"
                className="w-full bg-black/50 border border-white/20 focus:border-[#00F0FF] rounded px-3 py-2 text-white font-pixel text-xs outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block font-pixel text-[9px] text-white/70 mb-1 uppercase">
              EMAIL FREQUENCY
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operative@domain.com"
              className="w-full bg-black/50 border border-white/20 focus:border-[#00F0FF] rounded px-3 py-2 text-white font-pixel text-xs outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block font-pixel text-[9px] text-white/70 mb-1 uppercase">
              CYPHER KEY (PASSWORD)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black/50 border border-white/20 focus:border-[#00F0FF] rounded px-3 py-2 text-white font-pixel text-xs outline-none transition-colors"
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block font-pixel text-[9px] text-white/70 mb-1 uppercase">
                CONFIRM CYPHER KEY
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/50 border border-white/20 focus:border-[#00F0FF] rounded px-3 py-2 text-white font-pixel text-xs outline-none transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full mt-2 py-3 bg-[#FEDC02] text-black font-pixel text-xs font-bold rounded uppercase tracking-wider hover:bg-[#ffe633] transition-all cursor-pointer shadow-[0_3px_0_#9c8400] disabled:opacity-50"
          >
            {status === "loading"
              ? "AUTHENTICATING..."
              : isSignUp
              ? "REGISTER OPERATIVE →"
              : "AUTHORIZE & PROCEED →"}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-5">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
            }}
            className="font-pixel text-[10px] text-[#00F0FF] hover:underline cursor-pointer"
          >
            {isSignUp
              ? "Already have an operative identity? Sign in here"
              : "First time at the arena? Create operative identity"}
          </button>
        </div>
      </div>
    </div>
  );
}
