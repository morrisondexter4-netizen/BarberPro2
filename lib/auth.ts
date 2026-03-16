"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type UserRole = "admin" | "barber" | null;

export function useUserRole(): UserRole {
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const r = user.user_metadata?.role;
      setRole(r === "barber" ? "barber" : "admin");
    });
  }, []);

  return role;
}
