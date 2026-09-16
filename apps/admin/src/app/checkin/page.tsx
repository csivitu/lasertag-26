"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Camera,
  User,
  Users,
  Clock,
  RefreshCw,
  Shield,
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { apiFetch } from "@/lib/api-client";

interface WaitingTeam {
  teamCode: string;
  teamName: string;
  slot: string;
  side: string;
  arrivedCount: number;
  totalMembers: number;
  arrivalStatus: string;
  members: Array<{ id: string; name: string; regNo: string; checkedInAt: string }>;
}

interface WaitingSolo {
  id: string;
  name: string;
  regNo: string;
  slot: string;
  side: string;
  checkedInAt: string;
}

interface CheckInPayload {
  user?: { id: string; name: string; email: string };
  name?: string;
  regNo?: string;
  isTeam?: boolean;
  teamName?: string;
  arrivedCount?: number;
  totalTeamCount?: number;
  arrivalMessage?: string;
  slot?: string;
  side?: string;
}

interface CheckInResult {
  alreadyCheckedIn: boolean;
  message?: string;
  data: CheckInPayload;
}

interface WaitlistQueueData {
  teams: WaitingTeam[];
  solos: WaitingSolo[];
}

export default function CheckinPage() {
  const [manualInput, setManualInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Live Waiting Queue state
  const [waitingTeams, setWaitingTeams] = useState<WaitingTeam[]>([]);
  const [waitingSolos, setWaitingSolos] = useState<WaitingSolo[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "teams" | "solos">("all");

  const fetchWaitlist = useCallback(async () => {
    try {
      setQueueLoading(true);
      const res = await apiFetch<WaitlistQueueData>("/verification/waiting-queue");
      if (res.success && res.data) {
        setWaitingTeams(res.data.teams || []);
        setWaitingSolos(res.data.solos || []);
      }
    } catch {
      // ignore
    } finally {
      setQueueLoading(false);
    }
  }, []);

  const handleCheckIn = async (identifier: string) => {
    if (!identifier.trim()) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    const res = await apiFetch<CheckInPayload>("/verification/check-in", {
      method: "POST",
      body: JSON.stringify({ identifier: identifier.trim() }),
    });

    if (res.success && res.data) {
      setResult({
        alreadyCheckedIn: Boolean(res.message?.includes("already")),
        message: res.message,
        data: res.data,
      });
      setManualInput("");
      // Refresh live queue
      fetchWaitlist();
    } else {
      setError(res.error || "User check-in failed.");
    }
    setSubmitting(false);
  };

  useEffect(() => {
    fetchWaitlist();
    const interval = setInterval(fetchWaitlist, 10000); // 10s auto-refresh

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
      () => {
        // scan errors can be ignored
      }
    );

    scannerRef.current = scanner;

    return () => {
      clearInterval(interval);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [fetchWaitlist]);

  const totalWaiting =
    waitingTeams.reduce((acc, t) => acc + t.arrivedCount, 0) + waitingSolos.length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LIVE GATE
            </span>
            <span className="text-xs font-mono text-[#71717A]">LASERTAG 2026</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#FAFAFA] mt-1">
            Participant Check-In & Scanner
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            Verify entry tickets, scan player QR tokens, and monitor live waiting queue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-[#141417] border border-[#27272A] rounded-xl text-xs font-mono">
            <span className="text-[#71717A]">WAITING: </span>
            <span className="text-[#FAFAFA] font-bold">{totalWaiting} OPERATIVES</span>
          </div>
          <button
            onClick={fetchWaitlist}
            disabled={queueLoading}
            className="p-2.5 rounded-xl border border-[#27272A] bg-[#141417] text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            title="Refresh Live Queue"
          >
            <RefreshCw className={`w-4 h-4 ${queueLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Scanner & Manual Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: QR Scanner */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#141417] border border-[#27272A] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#FAFAFA]">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Camera QR Scanner</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                READY
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#27272A] bg-[#09090B] p-2 flex justify-center">
              <div id="qr-reader" className="w-full max-w-sm rounded-lg overflow-hidden" />
            </div>

            <p className="text-center text-[11px] font-mono text-[#71717A]">
              Aim camera at participant’s QR pass token or registration barcode
            </p>
          </div>
        </div>

        {/* Right Column: Manual Entry & Scan Result */}
        <div className="lg:col-span-5 space-y-6">
          {/* Manual Input Form */}
          <div className="bg-[#141417] border border-[#27272A] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#FAFAFA]">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Manual Check-In</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCheckIn(manualInput);
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[#71717A] uppercase">
                  QR Token, Reg No, or UUID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 24BCE10294 or Token"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#09090B] border border-[#27272A] rounded-xl text-xs font-mono text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

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
              } space-y-4`}
            >
              <div className="flex items-center gap-3">
                {result.alreadyCheckedIn ? (
                  <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                )}
                <div>
                  <h3 className="font-bold text-sm text-[#FAFAFA]">
                    {result.alreadyCheckedIn
                      ? "Already Verified & Waiting"
                      : "Verified & Added to Waiting List"}
                  </h3>
                  <p className="text-xs font-mono opacity-80">{result.message}</p>
                </div>
              </div>

              {result.data && (
                <div className="pt-3 border-t border-[#27272A] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#FAFAFA]">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold">{result.data.name || "Participant"}</span>
                      <span className="font-mono text-[11px] text-[#71717A]">
                        ({result.data.regNo || "N/A"})
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        result.data.side?.toLowerCase() === "blue"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      SIDE: {result.data.side || "RED"}
                    </span>
                  </div>

                  {/* Team vs Solo Status */}
                  {result.data.isTeam ? (
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-cyan-400" />
                          TEAM: {result.data.teamName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-200 font-mono font-bold text-[11px]">
                          {result.data.arrivedCount} of {result.data.totalTeamCount} ARRIVED
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-cyan-200/80">
                        Arrival status: {result.data.arrivalMessage || `${result.data.arrivedCount} has arrived`}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-amber-400" />
                        OPERATIVE MODE: SOLO
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-200 font-mono font-bold text-[11px]">
                        SOLO QUEUED
                      </span>
                    </div>
                  )}

                  <div className="text-[11px] font-mono text-[#A1A1AA]">
                    Slot Window: {result.data.slot}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Verified & Waiting List Board */}
      <div className="bg-[#141417] border border-[#27272A] rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-4">
          <div>
            <h2 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Verified & Waiting List (Live Arena Queue)
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Live status of checked-in squads and solo operatives waiting in the arena lobby
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterTab === "all"
                  ? "bg-[#27272A] text-[#FAFAFA] border border-[#3F3F46]"
                  : "text-[#71717A] hover:text-[#FAFAFA]"
              }`}
            >
              All ({totalWaiting})
            </button>
            <button
              onClick={() => setFilterTab("teams")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterTab === "teams"
                  ? "bg-[#27272A] text-cyan-300 border border-cyan-500/30"
                  : "text-[#71717A] hover:text-[#FAFAFA]"
              }`}
            >
              Teams ({waitingTeams.length})
            </button>
            <button
              onClick={() => setFilterTab("solos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterTab === "solos"
                  ? "bg-[#27272A] text-amber-300 border border-amber-500/30"
                  : "text-[#71717A] hover:text-[#FAFAFA]"
              }`}
            >
              Solos ({waitingSolos.length})
            </button>
          </div>
        </div>

        {/* Content of Waitlist */}
        <div className="space-y-4">
          {/* Teams List */}
          {(filterTab === "all" || filterTab === "teams") && waitingTeams.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase text-[#71717A] tracking-wider font-semibold">
                Squads in Lobby ({waitingTeams.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {waitingTeams.map((team) => (
                  <div
                    key={team.teamCode}
                    className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] hover:border-cyan-500/30 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-sm text-[#FAFAFA]">{team.teamName}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-bold">
                        {team.arrivedCount} has arrived ({team.arrivedCount}/{team.totalMembers})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-[#71717A]">
                      <span>Slot: {team.slot}</span>
                      <span>•</span>
                      <span
                        className={
                          team.side.toLowerCase() === "blue" ? "text-blue-400" : "text-rose-400"
                        }
                      >
                        Side {team.side}
                      </span>
                    </div>

                    {/* Arrived Members List */}
                    <div className="pt-2 border-t border-[#27272A]/80 space-y-1">
                      <div className="text-[10px] uppercase font-mono text-[#71717A]">
                        Arrived Operatives:
                      </div>
                      <div className="space-y-1">
                        {team.members.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between text-xs font-mono text-[#FAFAFA] bg-[#141417] px-2.5 py-1.5 rounded-lg border border-[#27272A]"
                          >
                            <span className="font-semibold">{m.name}</span>
                            <span className="text-[#71717A] text-[11px]">{m.regNo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solos List */}
          {(filterTab === "all" || filterTab === "solos") && waitingSolos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase text-[#71717A] tracking-wider font-semibold">
                Solo Operatives in Lobby ({waitingSolos.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {waitingSolos.map((solo) => (
                  <div
                    key={solo.id}
                    className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] hover:border-amber-500/30 transition-all flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-sm text-[#FAFAFA]">{solo.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          SOLO
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono text-[#71717A]">
                        <span>Reg: {solo.regNo}</span>
                        <span>•</span>
                        <span>Slot: {solo.slot}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                        solo.side.toLowerCase() === "blue"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {solo.side}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {waitingTeams.length === 0 && waitingSolos.length === 0 && !queueLoading && (
            <div className="text-center py-10 text-[#71717A] space-y-2">
              <Clock className="w-8 h-8 mx-auto text-[#3F3F46]" />
              <p className="text-sm font-medium">No verified operatives in the waiting queue.</p>
              <p className="text-xs">Scan a ticket QR above to check participants into the arena.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
