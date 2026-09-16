"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Starfield } from "@/components/hero/Starfield";
import { HeroHeader } from "@/components/hero/HeroHeader";

function ErrorContent() {
  const searchParams = useSearchParams();
  const rawCode = searchParams.get("error") || searchParams.get("code") || "unknown";
  const rawDesc = searchParams.get("error_description") || searchParams.get("message") || "";

  let title = "AUTHENTICATION SIGNAL LOST";
  let explanation =
    "We could not establish your operative session. Please verify your connection and try logging in again.";

  if (rawCode === "internal_server_error") {
    title = "AUTHENTICATION SYSTEM RECONNECTING";
    explanation =
      "The identity server encountered a momentary sync issue while accessing player records. The database schema has been verified—please try signing in once more.";
  } else if (rawCode === "access_denied" || rawCode.includes("denied")) {
    title = "AUTHORIZATION CANCELLED";
    explanation =
      "Google login authorization was cancelled or permission was not granted. Please approve account access to proceed.";
  } else if (rawCode === "configuration_error") {
    title = "SERVICE CONFIGURATION MISMATCH";
    explanation =
      "The authentication endpoint encountered a configuration check. Please refresh or retry.";
  } else if (rawDesc) {
    explanation = rawDesc;
  }

  return (
    <div className="relative z-10 max-w-md w-full mx-4 p-8 border-2 border-[#FF0055] bg-[#0c0c14]/95 rounded-2xl shadow-[0_0_50px_rgba(255,0,85,0.3)] flex flex-col items-center text-center gap-5 my-auto">
      <div className="w-14 h-14 rounded-full bg-[#FF0055]/15 border-2 border-[#FF0055] flex items-center justify-center text-2xl animate-pulse">
        ⚠️
      </div>

      <div className="space-y-2">
        <span className="font-pixel text-[10px] text-[#FF0055] uppercase tracking-widest border border-[#FF0055]/40 px-2.5 py-1 rounded bg-[#FF0055]/5">
          STATUS CODE: {rawCode.toUpperCase()}
        </span>
        <h2
          className="font-heading text-2xl text-white uppercase tracking-wider pt-2"
          style={{ textShadow: "-2px 0 0 #FF0055" }}
        >
          {title}
        </h2>
        <p className="font-pixel text-xs text-white/80 leading-relaxed max-w-sm">
          {explanation}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full pt-3">
        <Link
          href="/register"
          className="flex-1 font-pixel text-xs py-3 px-4 bg-[#FEDC02] text-black font-bold border-2 border-white rounded uppercase tracking-wider hover:bg-[#ffe633] transition-all text-center shadow-[0_3px_0_#9c8400]"
        >
          RETRY SIGN IN →
        </Link>
        <Link
          href="/"
          className="flex-1 font-pixel text-xs py-3 px-4 bg-transparent text-white/80 border border-white/30 rounded uppercase tracking-wider hover:text-white hover:border-white transition-all text-center"
        >
          HOME
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="relative isolate min-h-screen flex flex-col items-center justify-between bg-[#08080d] text-white pb-12">
      <Starfield />
      <HeroHeader />
      <Suspense
        fallback={
          <div className="relative z-10 font-pixel text-sm text-[#00F0FF] animate-pulse my-auto">
            DIAGNOSING AUTHENTICATION STATUS...
          </div>
        }
      >
        <ErrorContent />
      </Suspense>
    </div>
  );
}
