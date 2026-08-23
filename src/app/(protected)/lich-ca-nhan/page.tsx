// FILE: src/app/(protected)/lich-ca-nhan/page.tsx — Lịch cá nhân (dán HTML, xem view tháng)
"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function LichCaNhanPage() {
  const [html, setHtml] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    (async () => {
      try { const res = await api.get("/site-content/schedule_personal_html"); setHtml(res?.data?.data?.html || null); }
      catch { setHtml(null); }
    })();
  }, []);

  if (html === undefined)
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-royal" size={26} /></div>;

  if (!html)
    return (
      <div className="mx-auto max-w-[720px] py-16 text-center text-gray-500">
        <h2 className="mb-2 font-display text-2xl font-bold text-royal">Lịch cá nhân</h2>
        <p>Chưa có nội dung. Vào <b>Nội dung trang chủ → Lịch cá nhân (dán HTML)</b> để dán trang lịch.</p>
      </div>
    );

  return (
    <div className="h-[calc(100vh-7rem)] w-full overflow-hidden rounded-lg border border-gray-200">
      <iframe title="lich-ca-nhan" srcDoc={html} sandbox="allow-scripts allow-popups" className="h-full w-full border-0" />
    </div>
  );
}
