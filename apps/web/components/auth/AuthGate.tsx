"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { useSession } from "@/lib/auth-client";
import { Starfield } from "@/components/hero/Starfield";
import { HeroHeader } from "@/components/hero/HeroHeader";
import { PixelButton } from "@/components/hero/PixelButton";
import {
  MODAL_BORDER_SVG,
  borderBg,
} from "@/components/mode-popup/modePopupDecor";
import { AuthModal } from "./AuthModal";

interface AuthGateProps {
  children: React.ReactNode;
  title?: string;
  message?: string;
  buttonText?: string;
}

const cardStyle: CSSProperties = {
  position: "relative",
  background: borderBg(MODAL_BORDER_SVG),
  padding: "40px 36px 32px",
  width: "100%",
  maxWidth: "28rem",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "20px",
};

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
        <div style={cardStyle} className="relative z-10 my-auto mx-4">
          <h2
            className="font-pixel text-[#FEDC02] text-center text-[clamp(14px,2.4vw,19px)] leading-relaxed tracking-[0.08em]"
          >
            {title}
          </h2>
          <p className="font-body text-center text-[15px] leading-relaxed text-white/80">
            {message}
          </p>
          <PixelButton
            label={buttonText}
            interaction="simple"
            className="w-[280px]"
            labelClassName="text-[13px]"
            onClick={() => setAuthOpen(true)}
          />
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
