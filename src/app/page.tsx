/**
 * FILE: page.tsx
 * PATH: apps/admin/src/app/page.tsx
 * MÔ TẢ: Root page — redirect về dashboard
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    router.replace(token ? "/dashboard" : "/dang-nhap");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
    </div>
  );
}