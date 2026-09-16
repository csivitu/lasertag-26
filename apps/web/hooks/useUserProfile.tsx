"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession, apiBaseUrl } from "@/lib/auth-client";

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  regNo?: string;
  phone?: string;
  role: string;
  paid: boolean;
  isCheckedIn: boolean;
  activeRegistration?: ActiveRegistrationData | null;
  team?: TeamSummaryData | null;
}

export interface ActiveRegistrationData {
  id: string;
  type: "solo" | "team";
  status: string;
  side?: "red" | "blue" | null;
  teamCode?: string | null;
  regNo?: string;
  qrToken?: string | null;
  confirmedAt?: string | null;
  slot?: {
    id: string;
    slotDate: string;
    slotTime: string;
    capacity: number;
    bookingCount: number;
    side?: "red" | "blue" | null;
  } | null;
}

export interface TeamMemberData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isLeader?: boolean;
}

export interface TeamSummaryData {
  id: string;
  name: string;
  teamCode: string;
  memberCount: number;
  isLeader: boolean;
  members: TeamMemberData[];
}

interface UserProfileContextValue {
  profile: UserProfileData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clean up any stale localStorage leftover from past sessions
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("lasertag_selected_mode");
        localStorage.removeItem("lasertag_active_team");
        localStorage.removeItem("lasertag_onboarding_solo");
        localStorage.removeItem("lasertag_confirmed_slot");
      } catch {
        // ignore
      }
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!session?.user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`${apiBaseUrl}/users/me/profile`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Profile fetch failed: ${res.statusText}`);
      }

      const json = await res.json();
      if (json?.data) {
        const userData = json.data;
        const mappedProfile: UserProfileData = {
          id: userData.id,
          name: userData.name || session.user.name,
          email: userData.email || session.user.email,
          regNo: userData.regNo || undefined,
          phone: userData.phone || undefined,
          role: userData.role || "user",
          paid: userData.paid ?? false,
          isCheckedIn: userData.isCheckedIn ?? false,
          activeRegistration: userData.activeRegistration || null,
          team: userData.team || null,
        };
        setProfile(mappedProfile);
      } else {
        setProfile(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading operative profile";
      setError(msg);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        isLoading,
        error,
        refetch: fetchProfile,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

const DEFAULT_PROFILE_CONTEXT: UserProfileContextValue = {
  profile: null,
  isLoading: false,
  error: null,
  refetch: async () => {},
};

export function useUserProfile(): UserProfileContextValue {
  const context = useContext(UserProfileContext);
  if (!context) {
    return DEFAULT_PROFILE_CONTEXT;
  }
  return context;
}
