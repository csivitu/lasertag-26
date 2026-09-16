"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode, Search, CheckCircle2, AlertCircle, Camera, User } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { apiFetch } from "@/lib/api-client";

export default function CheckinPage() {
  const [manualInput, setManualInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const handleCheckIn = async (identifier: string) => {
    if (!identifier.trim()) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    const res = await apiFetch<any>("/verification/check-in", {
      method: "POST",
      body: JSON.stringify({ identifier: identifier.trim() }),
    });

    if (res.success && res.data) {
      setResult({
        alreadyCheckedIn: res.message?.includes("already"),
        message: res.message,
        user: res.data,
      });
      setManualInput("");
    } else {
      setError(res.error || "User check-in failed.");
    }
    setSubmitting(false);
  };

  useEffect(() => {
    // Initialize HTML5 QR Scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 240, height: 240 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        handleCheckIn(decodedText);
      },
      (_errorMessage) => {
        // scan errors can be ignored
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LIVE GATE
          </span>
        </div>
        <h1 className="text-xl font-bold text-[#FAFAFA] tracking-tight mt-1">Participant Check-In Station</h1>
        <p className="text-xs text-[#71717A] mt-0.5">
          Scan ticket QR codes via camera or perform manual registration lookup
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* WebCam QR Reader */}
        <div className="bg-[#141417] border border-[#27272A] p-5 rounded-2xl space-y-4">
          <h2 className="text-xs font-semibold text-[#FAFAFA] tracking-tight flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            WebCam QR Reader
          </h2>

          <div
            id="qr-reader"
            className="overflow-hidden rounded-xl border border-[#27272A] bg-[#09090B] text-[#FAFAFA]"
          ></div>
        </div>

        {/* Manual Search & Feedback */}
        <div className="space-y-4">
          <div className="bg-[#141417] border border-[#27272A] p-5 rounded-2xl space-y-4">
            <h2 className="text-xs font-semibold text-[#FAFAFA] tracking-tight flex items-center gap-2">
              <Search className="w-4 h-4 text-[#A1A1AA]" />
              Manual Search Lookup
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCheckIn(manualInput);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="Enter User ID, Registration ID, or Phone..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-xs text-[#FAFAFA] font-mono placeholder:text-[#71717A] focus:outline-none focus:border-[#3F3F46]"
              />

              <button
                type="submit"
                disabled={submitting || !manualInput.trim()}
                className="w-full py-2.5 bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] font-semibold rounded-xl transition-all text-xs border border-[#3F3F46] disabled:opacity-50"
              >
                {submitting ? "Processing Check-In..." : "Confirm Check-In"}
              </button>
            </form>
          </div>

          {/* Feedback Card */}
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 space-y-1 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-400" /> Check-In Failure
              </div>
              <p className="font-mono">{error}</p>
            </div>
          )}

          {result && (
            <div
              className={`p-5 rounded-2xl border ${
                result.alreadyCheckedIn
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              } space-y-3`}
            >
              <div className="flex items-center gap-3">
                {result.alreadyCheckedIn ? (
                  <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                )}
                <div>
                  <h3 className="font-bold text-sm text-[#FAFAFA]">
                    {result.alreadyCheckedIn ? "Already Checked In" : "Check-In Success"}
                  </h3>
                  <p className="text-xs font-mono opacity-80">{result.message}</p>
                </div>
              </div>

              {result.user && (
                <div className="pt-3 border-t border-[#27272A] space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-[#FAFAFA]">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold">{result.user.name || "Participant"}</span>
                  </div>
                  <p className="font-mono text-[#A1A1AA]">Email: {result.user.email}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
