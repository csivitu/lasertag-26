"use client";

import React from "react";
import { UserProfileProvider } from "@/hooks/useUserProfile";

export function Providers({ children }: { children: React.ReactNode }) {
  return <UserProfileProvider>{children}</UserProfileProvider>;
}

