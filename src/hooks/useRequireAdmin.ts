// FILE: src/hooks/useRequireAdmin.ts
// Chặn non-admin vào các trang tạo/sửa nội dung (backend đã chặn API, đây là lớp giao diện).
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

export function useRequireAdmin(redirectTo: string) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user && user.role !== "ADMIN") router.replace(redirectTo);
  }, [loading, user, redirectTo, router]);
}