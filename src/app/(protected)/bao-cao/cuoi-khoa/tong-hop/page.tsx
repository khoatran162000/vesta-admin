// FILE: src/app/(protected)/bao-cao/cuoi-khoa/tong-hop/page.tsx — Tổng hợp cả lớp
"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const SKILLS = [
  { key: "listening", label: "Nghe" },
  { key: "reading", label: "Đọc" },
  { key: "writing", label: "Viết" },
  { key: "speaking", label: "Nói" },
  { key: "overall", label: "Overall" },
];

export default function FinalReportSummaryPage() {
  const sp = useSearchParams();
  const course = sp.get("course") || "";
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (course) params.set("course", course);
    const data = await api.get(`/final-reports?${params}`);
    if (data.success) {
      // chỉ lấy bản đã xuất bản cho bảng tổng hợp gửi lớp
      setReports((data.data || []).filter((r: any) => r.status === "PUBLISHED"));
    }
    setLoading(false);
  }, [course]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gold" /></div>;

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/bao-cao/cuoi-khoa" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal">
          <ArrowLeft size={15} />Quay lại
        </Link>
        <button onClick={() => window.print()} className="btn-primary"><Printer size={15} />In bảng tổng hợp</button>
      </div>

      <h2 className="mb-1 font-display text-2xl font-bold text-royal">
        Tổng hợp điểm dự đoán cuối khóa {course ? `— Lớp ${course}` : "(tất cả lớp)"}
      </h2>
      <p className="mb-6 text-sm text-muted">{reports.length} học viên đã có báo cáo xuất bản</p>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-silver/30 bg-white py-16 text-center text-sm text-muted">
          Chưa có báo cáo cuối khóa nào được xuất bản{course ? ` cho lớp ${course}` : ""}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-silver/30 bg-white">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">#</th>
              <th className="px-4 py-3 font-semibold text-royal">Học sinh</th>
              <th className="px-4 py-3 font-semibold text-royal">Lớp</th>
              {SKILLS.map((s) => <th key={s.key} className="px-3 py-3 text-center font-semibold text-royal">{s.label}</th>)}
              <th className="px-4 py-3 text-center font-semibold text-royal print:hidden">Chi tiết</th>
            </tr></thead>
            <tbody>
              {reports.map((r, i) => {
                const pred = r.prediction || {};
                return (
                  <tr key={r.id} className="border-b border-silver/10 hover:bg-cream/50">
                    <td className="px-4 py-3 text-muted">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-[#1a1a2e]">
                      {r.student?.fullName}
                      <div className="text-xs font-mono text-muted">{r.student?.studentCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      {r.course && <span className="rounded-full bg-royal/8 px-2 py-0.5 text-[0.65rem] font-semibold text-royal">{r.course}</span>}
                    </td>
                    {SKILLS.map((s) => (
                      <td key={s.key} className="px-3 py-3 text-center font-bold text-[#162A5A]">
                        {pred[s.key]?.band || "—"}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center print:hidden">
                      <Link href={`/bao-cao/cuoi-khoa/${r.id}`} className="text-sm text-gold-dim hover:underline">Mở</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}