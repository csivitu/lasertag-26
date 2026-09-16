"use client";

import { useEffect, useState } from "react";
import { Users, Search, QrCode, X, Calendar, Clock, Ticket, CheckCircle2, AlertCircle, ChevronRight, Shield } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch<any>("/teams");
    if (res.success && res.data) {
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.teams)
        ? res.data.teams
        : [];
      setTeams(list);

      // Keep selectedTeam synced if open
      if (selectedTeam) {
        const updated = list.find((t: any) => t.id === selectedTeam.id || t.teamCode === selectedTeam.teamCode);
        if (updated) setSelectedTeam(updated);
      }
    } else {
      setTeams([]);
      setError(res.error || "Failed to load registered teams.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(() => {
      fetchTeams();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleCheckin = async (teamId: string, currentStatus: boolean) => {
    setActionSuccess(null);
    const res = await apiFetch<any>(`/teams/${teamId}/checkin`, {
      method: "PATCH",
      body: JSON.stringify({ checkedIn: !currentStatus }),
    });

    if (res.success) {
      setActionSuccess(`Check-in status updated successfully.`);
      fetchTeams();
    } else {
      setError(res.error || "Failed to update venue check-in status.");
    }
  };

  const filteredTeams = teams.filter((team) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (team.name && team.name.toLowerCase().includes(q)) ||
      (team.teamCode && team.teamCode.toLowerCase().includes(q)) ||
      (team.id && team.id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#FAFAFA] tracking-tight">Team & Roster Workstation</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Inspect team structures, roster members, venue check-in status, and slot booking timelines
          </p>
        </div>
        <button
          onClick={fetchTeams}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#141417] border border-[#27272A] rounded-xl text-xs text-[#FAFAFA] hover:border-[#3F3F46] transition-all"
        >
          <Users className={`w-3.5 h-3.5 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
          <span>Reload Teams</span>
        </button>
      </div>

      {/* Real-time Search Input Bar */}
      <div className="bg-[#141417] border border-[#27272A] p-4 rounded-2xl flex items-center gap-3">
        <Search className="w-4 h-4 text-[#71717A] shrink-0" />
        <input
          type="text"
          placeholder="Search teams by name, code (e.g. ALPHA_01), or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2 text-xs text-[#FAFAFA] font-mono placeholder:text-[#71717A] focus:outline-none focus:border-[#3F3F46]"
        />
      </div>

      {error && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-mono">
          {error}
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono">
          {actionSuccess}
        </div>
      )}

      {/* Teams Count Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-[#FAFAFA] font-mono uppercase tracking-wider">
          Registered Event Teams
        </h2>
        <span className="text-xs font-mono text-[#71717A]">
          Showing {filteredTeams.length} of {teams.length} Teams
        </span>
      </div>

      {/* Teams Grid */}
      {loading && teams.length === 0 ? (
        <div className="p-8 bg-[#141417] border border-[#27272A] rounded-2xl text-center text-[#71717A] text-xs">
          Loading teams data...
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="p-8 bg-[#141417] border border-[#27272A] rounded-2xl text-center text-[#71717A] text-xs">
          No teams found matching search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team, idx) => {
            const isCheckedIn = team.checkedIn || team.status === "CHECKED_IN";
            const bookingCount = team.bookings ? team.bookings.length : 0;
            return (
              <div
                key={team.id || idx}
                onClick={() => setSelectedTeam(team)}
                className="bg-[#141417] border border-[#27272A] hover:border-[#3F3F46] p-4 rounded-2xl space-y-3 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-[#FAFAFA] group-hover:text-emerald-400 transition-colors">
                      {team.teamCode || team.name || `Team ${idx + 1}`}
                    </h3>
                    <p className="text-[11px] font-mono text-[#71717A]">Code: {team.teamCode}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCheckin(team.id, isCheckedIn);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold flex items-center gap-1 border transition-all ${
                      isCheckedIn
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-[#09090B] text-[#71717A] border-[#27272A]"
                    }`}
                  >
                    {isCheckedIn ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Checked In
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-[#71717A]" /> Pending
                      </>
                    )}
                  </button>
                </div>

                {team.members && team.members.length > 0 && (
                  <div className="pt-2 border-t border-[#27272A] space-y-1">
                    <p className="text-[10px] font-mono text-[#71717A] uppercase">
                      Roster ({team.members.length} Members):
                    </p>
                    <p className="text-xs text-[#A1A1AA] truncate font-mono">
                      {team.members.map((m: any) => m.name || m.email).join(", ")}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-[#27272A] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#09090B] border border-[#27272A] rounded-md font-mono text-[11px] text-emerald-400">
                    <Ticket className="w-3 h-3" />
                    <span>
                      {bookingCount > 0 ? `${bookingCount} Slot Booking${bookingCount > 1 ? "s" : ""}` : "No Slots Booked"}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#71717A] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Inspect Details <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Team Details Modal / Drawer */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141417] border border-[#27272A] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Top Header */}
            <div className="p-4 bg-[#09090B] border-b border-[#27272A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-sm font-bold text-[#FAFAFA]">
                    Team Details: {selectedTeam.teamCode || selectedTeam.name}
                  </h2>
                  <p className="text-[11px] text-[#71717A] font-mono">Full Roster & Slot Booking History</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="p-1.5 rounded-lg bg-[#141417] text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Scroll Area */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Check-In Status Banner */}
              <div className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#71717A] uppercase font-mono">Venue Check-In Status</p>
                  <p className="text-sm font-bold text-[#FAFAFA] mt-0.5">
                    {selectedTeam.checkedIn || selectedTeam.status === "CHECKED_IN"
                      ? "Checked In at Venue"
                      : "Pending Check-In"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleToggleCheckin(
                      selectedTeam.id,
                      selectedTeam.checkedIn || selectedTeam.status === "CHECKED_IN"
                    )
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                    selectedTeam.checkedIn || selectedTeam.status === "CHECKED_IN"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-[#27272A] text-[#FAFAFA] border-[#3F3F46]"
                  }`}
                >
                  {selectedTeam.checkedIn || selectedTeam.status === "CHECKED_IN"
                    ? "Mark Pending"
                    : "Mark Checked In"}
                </button>
              </div>

              {/* Captain / Leader Details */}
              {selectedTeam.leader && (
                <div className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl space-y-2">
                  <h3 className="text-xs font-bold text-[#FAFAFA] font-mono uppercase tracking-wider">
                    Team Captain / Leader
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[#71717A]">Name: </span>
                      <span className="text-[#FAFAFA] font-semibold">{selectedTeam.leader.name || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[#71717A]">Email: </span>
                      <span className="text-[#FAFAFA]">{selectedTeam.leader.email || "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Members Roster List */}
              <div className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#FAFAFA] font-mono uppercase tracking-wider">
                    Roster Members ({selectedTeam.members ? selectedTeam.members.length : 0})
                  </h3>
                </div>

                {selectedTeam.members && selectedTeam.members.length > 0 ? (
                  <div className="divide-y divide-[#27272A]">
                    {selectedTeam.members.map((m: any, i: number) => (
                      <div key={m.id || i} className="py-2 flex items-center justify-between text-xs font-mono">
                        <div>
                          <p className="font-semibold text-[#FAFAFA]">
                            {i + 1}. {m.name || "Player"}
                          </p>
                          <p className="text-[11px] text-[#71717A]">{m.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#71717A] italic">No members registered.</p>
                )}
              </div>

              {/* Slot Booking & Re-Booking History */}
              <div className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-[#FAFAFA] font-mono uppercase tracking-wider">
                    Slot Booking & Re-Booking History
                  </h3>
                </div>

                {selectedTeam.bookings && selectedTeam.bookings.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedTeam.bookings.map((bkg: any, i: number) => {
                      const startFormatted = bkg.startTime
                        ? new Date(bkg.startTime).toLocaleString("en-US", {
                            timeZone: "Asia/Kolkata",
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "N/A";
                      const endFormatted = bkg.endTime
                        ? new Date(bkg.endTime).toLocaleTimeString("en-US", {
                            timeZone: "Asia/Kolkata",
                            timeStyle: "short",
                          })
                        : "N/A";

                      return (
                        <div
                          key={bkg.id || i}
                          className="p-3 bg-[#141417] border border-[#27272A] rounded-xl space-y-1.5 font-mono text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-400 font-bold">
                              {i === 0 ? "Current / Latest Slot" : `Previous Booking #${i + 1}`}
                            </span>
                            <span className="px-2 py-0.5 bg-[#09090B] border border-[#27272A] rounded text-[10px] text-[#A1A1AA]">
                              {bkg.type ? bkg.type.toUpperCase() : "TEAM"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[#FAFAFA] font-semibold">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>
                              {startFormatted} - {endFormatted}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#71717A]">
                            Booking Ref: <span className="text-[#A1A1AA]">{bkg.id}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-[#141417] border border-[#27272A] rounded-xl text-center text-xs text-[#71717A] italic">
                    No slot bookings recorded for this team yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
