"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Camera,
  User,
  RotateCcw,
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { apiFetch } from "@/lib/api-client";

interface CheckInUser {
  id: string;
  name?: string | null;
  email: string;
  regNumber?: string | null;
  phNumber?: string | null;
  isCheckedIn?: boolean;
  checkedInAt?: string | null;
}

interface CheckInState {
  alreadyCheckedIn: boolean;
  message?: string;
  user?: CheckInUser;
}

export default function CheckinPage() {
  const [manualInput, setManualInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isPausedRef = useRef(false);

  const handleResumeScanning = () => {
    try {
      if (scannerRef.current && scannerRef.current.getState() === 3) {
        scannerRef.current.resume();
      }
    } catch (err) {
      console.warn("Could not resume html5-qrcode scanner:", err);
    }
    isPausedRef.current = false;
    setIsPaused(false);
    setError(null);
  };

  const handleCheckIn = async (identifier: string) => {
    if (!identifier.trim()) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    const res = await apiFetch<CheckInUser>("/verification/check-in", {
      method: "POST",
      body: JSON.stringify({ identifier: identifier.trim() }),
    });

    if (res.success && res.data) {
      setResult({
        alreadyCheckedIn: Boolean(res.message?.includes("already")),
        message: res.message,
        user: res.data,
      });
      setManualInput("");
    } else {
      setError(res.error || "User check-in failed.");
    }
    setSubmitting(false);
  };

  // Keyboard shortcut: Space key resumes scanning when paused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isPausedRef.current &&
        e.code === "Space" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        handleResumeScanning();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    // Initialize HTML5 QR Scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 240, height: 240 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Immediate guard against duplicate rapid-fire scans
        if (isPausedRef.current) return;
        isPausedRef.current = true;
        setIsPaused(true);

        try {
          if (scanner.getState() === 2) {
            scanner.pause(true);
          }
        } catch (err) {
          console.warn("Could not pause scanner on detection:", err);
        }

        void handleCheckIn(decodedText);
      },
      () => {
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
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#FAFAFA] tracking-tight flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              WebCam QR Reader
            </h2>
            {isPaused ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-mono font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> SCANNER PAUSED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> READY TO SCAN
              </span>
            )}
          </div>

          <div
            id="qr-reader"
            className="overflow-hidden rounded-xl border border-[#27272A] bg-[#09090B] text-[#FAFAFA]"
          ></div>

          {/* Action button when scanner paused */}
          {isPaused && (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleResumeScanning}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs font-mono cursor-pointer uppercase tracking-wider"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Scan Next Participant (Space)</span>
              </button>
              <p className="text-[11px] text-center text-[#71717A] font-mono">
                Scanner stopped to prevent duplicate scans. Press Space or tap above to scan next.
              </p>
            </div>
          )}
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
                void handleCheckIn(manualInput);
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
                className="w-full py-2.5 bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] font-semibold rounded-xl transition-all text-xs border border-[#3F3F46] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Processing Check-In..." : "Confirm Check-In"}
              </button>
            </form>
          </div>

          {/* Feedback Card */}
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-400" /> Check-In Failure
              </div>
              <p className="font-mono">{error}</p>
              {isPaused && (
                <button
                  type="button"
                  onClick={handleResumeScanning}
                  className="w-full mt-2 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-mono cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resume Scanning</span>
                </button>
              )}
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
                <div className="pt-3 border-t border-[#27272A] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-[#FAFAFA]">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold">{result.user.name || "Participant"}</span>
                    </div>
                    {result.user.regNumber && (
                      <span className="px-2 py-0.5 bg-[#09090B] border border-[#27272A] text-emerald-400 font-mono text-[11px] rounded-md font-bold">
                        {result.user.regNumber}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[#A1A1AA]">Email: {result.user.email}</p>
                  {result.user.phNumber && (
                    <p className="font-mono text-[#A1A1AA]">Phone: {result.user.phNumber}</p>
                  )}
                </div>
              )}

              {isPaused && (
                <div className="pt-2 border-t border-[#27272A]/60">
                  <button
                    type="button"
                    onClick={handleResumeScanning}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs font-mono cursor-pointer uppercase tracking-wider"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Scan Next Participant</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

