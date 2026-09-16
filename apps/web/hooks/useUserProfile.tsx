"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSession, apiBaseUrl } from "@/lib/auth-client";

export interface UserTeamMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isLeader: boolean;
}

export interface UserTeamData {
  teamCode: string;
  isLeader: boolean;
  leaderId: string;
  memberCount: number;
  maxMembers: number;
  members: UserTeamMember[];
}

export interface ActiveRegistrationData {
  id: string;
  type: "individual" | "team";
  status: "reserved" | "confirmed" | "cancelled";
  slotId: string;
  teamCode: string | null;
  qrToken: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  slot: {
    id: string;
    startTime: string;
    endTime: string;
    capacity: number;
    slotDate: string;
    slotTime: string;
  };
}

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  regNumber: string | null;
  paid: boolean;
  isCheckedIn: boolean;
  qrToken: string | null;
  team: UserTeamData | null;
  activeRegistration: ActiveRegistrationData | null;
}

export interface UserProfileContextValue {
  profile: UserProfileData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

function setItemIfChanged(storage: Storage, key: string, value: string) {
  try {
    if (storage.getItem(key) !== value) {
      storage.setItem(key, value);
    }
  } catch {
    // ignore
  }
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: sessionLoading } = useSession();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.id;
  const isFetchingRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // Prevent duplicate in-flight requests
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setError(null);

      const res = await fetch(`${apiBaseUrl}/users/me/profile`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Profile fetch failed: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.data) {
        setProfile(json.data);

        // Safely synchronize storage only when changed
        // DEPRECATED: team feature disabled — skip team storage sync (solo-only flow).
        if (typeof window !== "undefined") {
          // if (json.data.team) {
          //   setItemIfChanged(localStorage, "lasertag_selected_mode", "team");
          //   setItemIfChanged(sessionStorage, "lasertag_selected_mode", "team");

          //   const activeTeamStr = JSON.stringify({
          //     teamCode: json.data.team.teamCode,
          //     isLeader: json.data.team.isLeader,
          //   });
          //   setItemIfChanged(localStorage, "lasertag_active_team", activeTeamStr);
          //   setItemIfChanged(sessionStorage, "lasertag_active_team", activeTeamStr);
          // } else if (json.data.activeRegistration?.type === "individual") {
          if (json.data.activeRegistration) {
            setItemIfChanged(localStorage, "lasertag_selected_mode", "solo");
            setItemIfChanged(sessionStorage, "lasertag_selected_mode", "solo");
          }

          if (json.data.activeRegistration) {
            const regPayload = JSON.stringify({
              slotId: json.data.activeRegistration.slotId,
              day: json.data.activeRegistration.slot.slotDate,
              time: json.data.activeRegistration.slot.slotTime,
            });
            setItemIfChanged(localStorage, "lasertag_confirmed_slot", regPayload);
            setItemIfChanged(sessionStorage, "lasertag_confirmed_slot", regPayload);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching profile";
      setError(msg);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!sessionLoading) {
      fetchProfile();
    }
  }, [sessionLoading, userId, fetchProfile]);

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        isLoading: sessionLoading || (Boolean(userId) && isLoading && !profile),
        error,
        refetch: fetchProfile,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextValue {
  const context = useContext(UserProfileContext);
  if (context) {
    return context;
  }

  // Fallback for standalone usage outside of UserProfileProvider
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data: session, isPending: sessionLoading } = useSession();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.id;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const res = await fetch(`${apiBaseUrl}/users/me/profile`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Profile fetch failed: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.data) {
        setProfile(json.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching profile");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!sessionLoading) {
      fetchProfile();
    }
  }, [sessionLoading, userId, fetchProfile]);

  return {
    profile,
    isLoading: sessionLoading || (Boolean(userId) && isLoading && !profile),
    error,
    refetch: fetchProfile,
  };
}
