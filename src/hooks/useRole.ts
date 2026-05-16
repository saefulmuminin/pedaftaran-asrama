"use client";

import { useAuth } from "@/context/AuthContext";

export function useRole() {
  const { userProfile } = useAuth();
  return {
    role: userProfile?.role ?? null,
    isAdmin: userProfile?.role === "admin",
    isMahasiswa: userProfile?.role === "mahasiswa",
  };
}
