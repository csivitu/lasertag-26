"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Starfield } from "@/components/hero/Starfield";
import { HeroHeader } from "@/components/hero/HeroHeader";
import { AuthModal } from "./AuthModal";

interface AuthGateProps {
  children: React.ReactNode;
  title?: string;
  message?: string;
  buttonText?: string;
}

export function AuthGate({
  children,
  title = "RESTRICTED ACCESS",
  message = "PLEASE SIGN IN TO IDENTIFY OPERATIVE STATUS AND ACCESS THIS ARENA TERMINAL.",
  buttonText = "AUTHENTICATE NOW",
}: AuthGateProps) {
  const { data: session, isPending } = useSession();
  const [authOpen, setAuthOpen] = useState(false);

  if (isPending) {
    return (
      <div className="relative isolate min-h-screen flex items-center justify-center bg-[#08080d] text-white">
        <Starfield />
        <div className="relative z-10 font-pixel text-sm text-[#00F0FF] animate-pulse">
          AUTHENTICATING OPERATIVE...
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="relative isolate min-h-screen flex flex-col items-center justify-between bg-[#08080d] text-white pb-12 text-center">
        <Starfield />
        <HeroHeader />
        <div className="relative z-10 max-w-md p-8 border-2 border-[#FEDC02] bg-[#0c0c14]/90 rounded-xl shadow-[0_0_30px_rgba(254,220,2,0.2)] flex flex-col items-center gap-5 my-auto mx-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FEDC02]/15 border border-[#FEDC02] text-xl">
            🔒
          </div>
          <h2
            className="font-heading text-2xl text-[#FEDC02]"
            style={{ textShadow: "-2px 0 0 #E5349E" }}
          >
            {title}
          </h2>
          <p className="font-pixel text-xs text-white/80 leading-relaxed">
            {message}
          </p>
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="font-pixel text-xs py-3 px-6 bg-[#FEDC02] text-black font-bold border-2 border-white hover:bg-[#ffe733] rounded uppercase tracking-wider transition-transform hover:scale-105 cursor-pointer shadow-[0_3px_0_#9c8400]"
          >
            {buttonText}
          </button>
        </div>
        <AuthModal
          isOpen={authOpen}
          onClose={() => setAuthOpen(false)}
          initialMode="signin"
        />
      </div>
    );
  }

  return <>{children}</>;
}
