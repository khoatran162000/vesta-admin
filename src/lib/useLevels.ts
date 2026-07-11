// FILE: src/lib/useLevels.ts — nguồn trình độ động (đọc từ API, fallback list cứng)
"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { COURSES as FALLBACK } from "@/lib/courses";

let _cache: string[] | null = null; // cache trong phiên, tránh fetch lại mỗi trang

export function useLevels(): string[] {
  const [levels, setLevels] = useState<string[]>(_cache ?? FALLBACK);
  useEffect(() => {
    if (_cache) return;
    (async () => {
      try {
        const json = await api.get("/levels");
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          const codes = json.data.map((l: any) => l.code).filter(Boolean);
          _cache = codes;
          setLevels(codes);
        }
      } catch { /* giữ FALLBACK */ }
    })();
  }, []);
  return levels;
}