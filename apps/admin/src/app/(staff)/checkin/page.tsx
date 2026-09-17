"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Camera,
  User,
  RotateCcw,
  CameraOff,
} from "lucide-react";
import {
  Html5Qrcode,
  Html5QrcodeScanner,
  Html5QrcodeScannerState,
  Html5QrcodeScanType,
} from "html5-qrcode";
import { apiFetch } from "@/lib/api-client";

interface CheckInUser {
  id: string;
  name?: string | null;
  email: string;
  regNumber?: string | null;
  phNumber?: string | null;
  paid?: boolean | null;
  isCheckedIn?: boolean;
  checkedInAt?: string | null;
}

interface CheckInState {
  alreadyCheckedIn: boolean;
  message?: string;
  user?: CheckInUser;
  at: string;
}

type CameraState = "idle" | "starting" | "live" | "denied";

/** Same payload re-decoded within this window is a duplicate frame, not a new player. */
const DUPLICATE_WINDOW_MS = 5000;

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // vibrate unsupported — verdict colors carry the signal instead.
  }
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function CheckinPage() {
  const [manualInput, setManualInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [camError, setCamError] = useState<string | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isPausedRef = useRef(false);
  const inflightRef = useRef(false);
  const lastPayloadRef = useRef<{ text: string; at: number } | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const handleResumeScanning = () => {
    // Explicit staffer intent = new player: clear the duplicate-payload guard
    // so a still-visible QR can be scanned immediately.
    lastPayloadRef.current = null;
    try {
      if (
        scannerRef.current &&
        scannerRef.current.getState() === Html5QrcodeScannerState.PAUSED
      ) {
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
    // In-flight guard: a second decode landing mid-request must not fire a
    // duplicate check-in POST.
    if (inflightRef.current) return;
    inflightRef.current = true;

    setSubmitting(true);
    setError(null);
    setResult(null);

    const res = await apiFetch<CheckInUser>("/verification/check-in", {
      method: "POST",
      body: JSON.stringify({ identifier: identifier.trim() }),
    });

    inflightRef.current = false;
    if (res.success && res.data) {
      const already = Boolean(res.message?.includes("already"));
      setResult({
        alreadyCheckedIn: already,
        message: res.message,
        user: res.data,
        at: new Date().toISOString(),
      });
      buzz(already ? [30, 60, 30] : 60);
      setManualInput("");
    } else {
      setError(res.error || "User check-in failed.");
      buzz([80, 60, 80]);
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

  // Bring the verdict into view on small screens — no manual scrolling per player.
  useEffect(() => {
    if ((result || error) && !submitting) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [result, error, submitting]);

  // Scanner is created on an explicit tap (user gesture), which is what
  // mobile browsers require before granting camera access.
  const startCamera = async () => {
    if (scannerRef.current || cameraState === "starting" || cameraState === "live") return;
    setCameraState("starting");
    setCamError(null);
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setCameraState("denied");
        setCamError("No camera found on this device. Use manual lookup below.");
        return;
      }
    } catch {
      setCameraState("denied");
      setCamError(
        "Camera access was blocked. Allow camera permission for this site in the browser settings, then try again."
      );
      return;
    }

    const side = Math.min(window.innerWidth - 32, 340);
    const box = Math.max(200, side);
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: box, height: box },
        videoConstraints: { facingMode: "environment" },
        showTorchButtonIfSupported: true,
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Structural duplicate guard: the same payload re-decoded within the
        // window is the same player still in frame — not a new scan.
        const now = Date.now();
        const last = lastPayloadRef.current;
        if (last && last.text === decodedText && now - last.at < DUPLICATE_WINDOW_MS) {
          return;
        }
        lastPayloadRef.current = { text: decodedText, at: now };
        if (inflightRef.current) return;

        // Pause unconditionally: gating this on an exact scanner state is
        // what let rapid successive frames through as duplicate scans.
        isPausedRef.current = true;
        setIsPaused(true);
        try {
          scanner.pause(true);
        } catch (err) {
          console.warn("Could not pause scanner on detection:", err);
        }

        void handleCheckIn(decodedText);
      },
      () => {
        // per-frame scan errors can be ignored
      }
    );

    scannerRef.current = scanner;
    setCameraState("live");
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);


  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#FAFAFA] tracking-tight">Participant Check-In Station</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pb-28 md:pb-0">
        {/* WebCam QR Reader */}
        <div className="order-1 md:col-start-1 md:row-start-1 bg-[#141417] border border-[#27272A] p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#FAFAFA] tracking-tight flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              WebCam QR Reader
            </h2>
            {cameraState === "live" &&
              (isPaused ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-mono font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> SCANNER PAUSED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> READY TO SCAN
                </span>
              ))}
          </div>

          {cameraState === "idle" && (
            <button
              type="button"
              onClick={() => void startCamera()}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer uppercase tracking-wider"
            >
              <Camera className="w-5 h-5" />
              <span>Enable Camera</span>
            </button>
          )}

          {cameraState === "starting" && (
            <div className="rounded-xl border border-[#27272A] bg-[#09090B] px-4 py-8 text-center text-xs font-mono text-[#A1A1AA]">
              Requesting camera…
            </div>
          )}

          {cameraState === "denied" && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-6 text-center space-y-3">
              <CameraOff className="w-6 h-6 text-rose-400 mx-auto" />
              <p className="text-xs text-rose-300 font-mono">{camError}</p>
              <button
                type="button"
                onClick={() => void startCamera()}
                className="w-full py-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold rounded-xl transition-all text-xs cursor-pointer uppercase tracking-wider"
              >
                Try Again
              </button>
            </div>
          )}

          <div
            id="qr-reader"
            className={`overflow-hidden rounded-xl border border-[#27272A] bg-[#09090B] text-[#FAFAFA] ${cameraState === "idle" || cameraState === "denied" ? "hidden" : ""}`}
          ></div>

          {cameraState === "live" && submitting && (
            <div className="rounded-xl border border-[#3F3F46] bg-[#09090B] px-4 py-2.5 text-center text-xs font-mono font-bold text-[#FAFAFA] uppercase tracking-wider animate-pulse">
              Verifying…
            </div>
          )}
        </div>

        {/* Manual Search — below the verdict banner on mobile */}
        <div className="order-3 md:col-start-2 md:row-start-1">
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
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Enter User ID, Registration ID, or Phone..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-3.5 text-sm text-[#FAFAFA] font-mono placeholder:text-[#71717A] focus:outline-none focus:border-[#3F3F46]"
              />

              <button
                type="submit"
                disabled={submitting || !manualInput.trim()}
                className="w-full py-3.5 bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] font-bold rounded-xl transition-all text-sm border border-[#3F3F46] disabled:opacity-50 cursor-pointer uppercase tracking-wider"
              >
                {submitting ? "Processing Check-In..." : "Confirm Check-In"}
              </button>
            </form>
          </div>
        </div>

        {/* Verdict banner — above the lookup box on mobile, beside it on desktop */}
        {(error || result) && (
          <div className="space-y-4 order-2 md:col-start-2 md:row-start-2">
          {/* Feedback Card */}
          {error && (
            <div
              ref={resultRef}
              className="p-5 bg-rose-600/25 border-2 border-rose-500/60 rounded-2xl text-rose-100 space-y-2"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-rose-400 shrink-0" />
                <div>
                  <h3 className="font-black text-2xl tracking-tight">NOT FOUND</h3>
                  <p className="font-mono text-xs opacity-90">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div
              ref={resultRef}
              className={`p-5 rounded-2xl border-2 space-y-3 ${
                result.alreadyCheckedIn
                  ? "bg-amber-500/25 border-amber-400/60 text-amber-100"
                  : "bg-emerald-600/25 border-emerald-400/60 text-emerald-100"
              }`}
            >
              <div className="flex items-center gap-3">
                {result.alreadyCheckedIn ? (
                  <AlertCircle className="w-8 h-8 text-amber-300 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-emerald-300 shrink-0" />
                )}
                <div>
                  <h3 className="font-black text-2xl tracking-tight">
                    {result.alreadyCheckedIn ? "ALREADY IN" : "CHECKED IN"}
                  </h3>
                  <p className="text-xs font-mono opacity-90">
                    {[result.message, formatTime(result.at)].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>

              {result.user && (
                <div className="pt-3 border-t border-white/15 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-[#FAFAFA]">
                      <User className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="font-bold text-sm">{result.user.name || "Participant"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {result.user.paid === true ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-mono text-[11px] rounded-md font-bold">
                          PAID
                        </span>
                      ) : result.user.paid === false ? (
                        <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-400/40 text-amber-200 font-mono text-[11px] rounded-md font-bold">
                          UNPAID
                        </span>
                      ) : null}
                      {result.user.regNumber && (
                        <span className="px-2 py-0.5 bg-[#09090B] border border-[#27272A] text-emerald-300 font-mono text-[11px] rounded-md font-bold">
                          {result.user.regNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-mono text-[#A1A1AA]">Email: {result.user.email}</p>
                  {result.user.phNumber && (
                    <p className="font-mono text-[#A1A1AA]">Phone: {result.user.phNumber}</p>
                  )}
                </div>
              )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Sticky thumb-zone action: single retrigger for the next player. */}
      {cameraState === "live" && isPaused && !submitting && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[#27272A] bg-[#09090B]/95 backdrop-blur px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleResumeScanning}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-300 text-slate-950 font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 text-base cursor-pointer uppercase tracking-wider"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{error ? "Retry Scan" : "Scan Next Player"}</span>
          </button>
          <p className="mt-1.5 text-center text-[11px] font-mono text-[#71717A] hidden md:block">
            or press Space
          </p>
        </div>
      )}
    </div>
  );
}

