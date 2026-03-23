"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, getSupabase } from "./supabase";

export type UserRole = "admin" | "barber" | null;

export function useUserRole(): UserRole {
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    getSupabase().auth.getUser().then(({ data: { user } }: { data: { user: User | null }; error: unknown }) => {
      if (!user) return;
      const r = user.user_metadata?.role;
      setRole(r === "barber" ? "barber" : "admin");
    });
  }, []);

  return role;
}
