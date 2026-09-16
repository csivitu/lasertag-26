"use client";

import { useState } from "react";
import Image from "next/image";
import { FiEdit2, FiCheck, FiX, FiLoader } from "react-icons/fi";
import { useUserProfile } from "@/hooks/useUserProfile";
import { apiBaseUrl } from "@/lib/auth-client";

/**
 * PLAYER row with an inline rename affordance. PATCHes
 * /users/me/details and refetches the profile so the pass updates.
 */
export function EditablePlayerName({ value }: { value: string }) {
  const { refetch } = useUserProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    setDraft(value);
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    const name = draft.trim();
    if (!name) {
      setError("Name cannot be empty.");
      return;
    }
    if (name === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/users/me/details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setError(errBody.error || "Could not save name. Please retry.");
        return;
      }
      setEditing(false);
      await refetch();
    } catch {
      setError("Could not reach the server. Check connection and retry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2.5 sm:gap-3.5 pl-1 min-w-0">
      <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0">
        <Image src="/profile/profile-solo/playericon.svg" alt="" fill className="object-contain" />
      </div>

      <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1">
        <span className="font-pixel text-[8px] sm:text-[10px] tracking-wider uppercase truncate text-[#00F0FF]">
          PLAYER
        </span>
        {editing ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <input
              autoFocus
              value={draft}
              maxLength={100}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") setEditing(false);
              }}
              disabled={saving}
              className="min-w-0 flex-1 bg-black/60 border border-[#00F0FF]/60 rounded px-2 py-1 font-pixel text-[11px] sm:text-[13px] tracking-wider uppercase text-white placeholder:text-white/30 focus:outline-none focus:border-[#00F0FF]"
              placeholder="Enter player name"
            />
            <button
              onClick={save}
              disabled={saving}
              aria-label="Save name"
              className="shrink-0 p-1.5 rounded bg-[#FEDC02] text-black hover:bg-[#ffe733] disabled:opacity-50 transition-colors"
            >
              {saving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              aria-label="Cancel"
              className="shrink-0 p-1.5 rounded border border-white/30 text-white/70 hover:text-white hover:border-white/60 disabled:opacity-50 transition-colors"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="font-pixel tracking-wider uppercase select-text truncate text-[11px] sm:text-[13px] min-w-0"
              style={{ color: "#FFFFFF", textShadow: "0 0 8px rgba(255,255,255,0.2)" }}
              title={value}
            >
              {value || "N/A"}
            </span>
            <button
              onClick={startEdit}
              aria-label="Edit player name"
              title="Edit player name"
              className="shrink-0 p-1 rounded text-white/40 hover:text-[#FEDC02] hover:bg-white/5 transition-colors"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {error && (
          <span className="font-pixel text-[8px] sm:text-[9px] tracking-wider text-red-400 break-words">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
