"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSession } from "@/lib/auth-client";

interface QrCodeProps {
  className?: string;
  payload?: {
    token?: string;
    name?: string;
    regNo?: string;
    team?: string;
    slot?: string;
    side?: string;
  };
}

export function QrCode({ className = "", payload }: QrCodeProps) {
  const { profile } = useUserProfile();
  const { data: session } = useSession();
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let isCancelled = false;

    async function generate() {
      const token =
        payload?.token ||
        profile?.activeRegistration?.qrToken ||
        profile?.id ||
        session?.user?.id ||
        "QR-OPERATIVE";

      const name =
        payload?.name ||
        profile?.name ||
        session?.user?.name ||
        "Operative";

      const regNo =
        payload?.regNo ||
        profile?.regNo ||
        "N/A";

      const team =
        payload?.team ||
        profile?.team?.teamCode ||
        (profile?.activeRegistration?.teamCode ? profile.activeRegistration.teamCode : "Solo");

      const slot =
        payload?.slot ||
        (profile?.activeRegistration?.slot
          ? `${profile.activeRegistration.slot.slotDate} (${profile.activeRegistration.slot.slotTime})`
          : "Arena Slot Confirmed");

      const side =
        payload?.side ||
        profile?.activeRegistration?.side?.toUpperCase() ||
        "RED";

      const qrPayload = JSON.stringify({
        token,
        name,
        regNo,
        team,
        slot,
        side,
      });

      try {
        const url = await QRCode.toDataURL(qrPayload, {
          width: 300,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        if (!isCancelled) {
          setDataUrl(url);
        }
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    }

    generate();

    return () => {
      isCancelled = true;
    };
  }, [payload, profile, session]);

  if (!dataUrl) {
    return (
      <div className={`${className} bg-white flex items-center justify-center`}>
        <span className="text-[9px] text-black font-mono">GENERATING...</span>
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={dataUrl}
      alt="Arena Battle Pass QR"
      className={`${className} object-contain rounded`}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
