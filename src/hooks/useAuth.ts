/**
 * FILE: useAuth.ts
 * PATH: apps/admin/src/hooks/useAuth.ts
 * MÔ TẢ: Hook quản lý auth state — fetch user, login, logout
 */

"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) { setLoading(false); return; }

        const data = await api.get("/auth/me");
        if (data.success) setUser(data.data);
      } catch {
        // token invalid
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/dang-nhap";
  }

  return { user, loading, logout };
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị viên",
  TEACHER: "Giáo viên",
  CONTENT_CREATOR: "Marketing",
  STUDENT: "Học viên",
};