"use client";

import { useEffect, useRef, useState } from "react";
import { Search, UserSearch, ChevronDown, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

type SoloUser = {
  regNo: string;
  type: string;
  teamCode: string | null;
  slotId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    paid: boolean;
    isCheckedIn: boolean;
    checkedInAt: string | null;
  };
};

const MIN_CHARS = 2;

export default function SoloUsersPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SoloUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) {
      abortRef.current?.abort();
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setError(null);
      const res = await apiFetch<{ registrations?: SoloUser[] } | SoloUser[]>(
        `/admin/registrations?type=individual&q=${encodeURIComponent(q)}&limit=30`,
        { signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      if (res.success && res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.registrations)
            ? res.data.registrations
            : [];
        setResults(list);
      } else if (!controller.signal.aborted) {
        // Aborted fetch surfaces as error — ignore it
        if (res.error === "Failed to communicate with API server." && controller.signal.aborted) return;
        setResults([]);
        setError(res.error || "Failed to search solo users.");
      }
      setLoading(false);
    }, 300);

    return () => {
      clearTimeout(t);
      abortRef.current?.abort();
    };
  }, [query]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-[#FAFAFA] tracking-tight">Solo Users Lookup</h1>
        <p className="text-xs text-[#71717A] mt-0.5">
          Type to search solo players by name, phone, reg no, or email
        </p>
      </div>

      <div className="bg-[#141417] border border-[#27272A] p-4 rounded-2xl flex items-center gap-3">
        <Search className="w-4 h-4 text-[#71717A] shrink-0" />
        <input
          type="text"
          autoFocus
          placeholder="Search name, phone, reg no (REG-...), email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2 text-xs text-[#FAFAFA] font-mono placeholder:text-[#71717A] focus:outline-none focus:border-[#3F3F46]"
        />
        {loading && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />}
      </div>

      {error && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-mono">
          {error}
        </div>
      )}

      {query.trim().length < MIN_CHARS ? (
        <div className="p-8 bg-[#141417] border border-[#27272A] rounded-2xl text-center text-[#71717A] text-xs flex flex-col items-center gap-2">
          <UserSearch className="w-5 h-5" />
          Type at least {MIN_CHARS} characters to search the database.
        </div>
      ) : !loading && results.length === 0 && !error ? (
        <div className="p-8 bg-[#141417] border border-[#27272A] rounded-2xl text-center text-[#71717A] text-xs">
          No solo users found for &ldquo;{query.trim()}&rdquo;.
        </div>
      ) : (
        <div className="bg-[#141417] border border-[#27272A] rounded-2xl overflow-hidden divide-y divide-[#27272A]">
          {results.map((r) => {
            const isOpen = expanded === r.regNo;
            return (
              <div key={r.regNo}>
                <button
                  onClick={() => setExpanded(isOpen ? null : r.regNo)}
                  className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#1C1C21] transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#FAFAFA] truncate">
                      {r.user.name}
                    </p>
                    <p className="text-[11px] font-mono text-[#71717A] truncate">
                      {r.regNo} &middot; {r.user.email} &middot; {r.user.phone || "no phone"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                        r.user.paid
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-[#09090B] text-[#71717A] border-[#27272A]"
                      }`}
                    >
                      {r.user.paid ? "Paid" : "Unpaid"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#71717A] transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-2 text-xs font-mono">
                    {[
                      ["Reg No", r.regNo],
                      ["Name", r.user.name],
                      ["Email", r.user.email],
                      ["Phone", r.user.phone || "N/A"],
                      ["User ID", r.user.id],
                      ["Slot ID", r.slotId],
                      ["Checked In", r.user.isCheckedIn ? "Yes" : "No"],
                      [
                        "Checked In At",
                        r.user.checkedInAt
                          ? new Date(r.user.checkedInAt).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                            })
                          : "N/A",
                      ],
                    ].map(([k, v]) => (
                      <div key={k} className="p-2.5 bg-[#09090B] border border-[#27272A] rounded-xl">
                        <p className="text-[10px] uppercase text-[#71717A]">{k}</p>
                        <p className="text-[#FAFAFA] mt-0.5 break-all">{v}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
