// FILE: src/app/(protected)/bao-cao/cuoi-khoa/tong-hop/page.tsx — Tổng hợp cả lớp (theo lớp hoặc trình độ)
"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { COURSES as LEVELS } from "@/lib/courses";

const SKILLS = [
  { key: "listening", label: "Nghe" },
  { key: "reading", label: "Đọc" },
  { key: "writing", label: "Viết" },
  { key: "speaking", label: "Nói" },
  { key: "overall", label: "Overall" },
];

export default function FinalReportSummaryPage() {
  const sp = useSearchParams();
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState(sp.get("classId") || "");
  const [course, setCourse] = useState(sp.get("course") || "");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const cl = await api.get("/classes");
      if (cl.success) setClasses(cl.data || []);
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (classId) params.set("classId", classId);
    else if (course) params.set("course", course);
    const data = await api.get(`/final-reports?${params}`);
    if (data.success) {
      setReports((data.data || []).filter((r: any) => r.status === "PUBLISHED"));
    }
    setLoading(false);
  }, [classId, course]);
  useEffect(() => { load(); }, [load]);

  const className = classId ? (classes.find((c) => c.id === classId)?.name || "") : "";
  const scopeLabel = classId ? `Lớp ${className}` : (course ? `Trình độ ${course}` : "(tất cả)");

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/bao-cao/cuoi-khoa" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal">
          <ArrowLeft size={15} />Quay lại
        </Link>
        <button onClick={() => window.print()} className="btn-primary"><Printer size={15} />In bảng tổng hợp</button>
      </div>

      <h2 className="mb-1 font-display text-2xl font-bold text-royal">Tổng hợp điểm dự đoán cuối khóa</h2>
      <p className="mb-4 text-sm text-muted">Lọc theo lớp cụ thể, hoặc theo trình độ (cho báo cáo chưa gắn lớp).</p>

      {/* Bộ lọc: chọn Lớp (ưu tiên) hoặc Trình độ */}
      <div className="mb-6 flex flex-wrap gap-3 print:hidden">
        <div>
          <label className="mb-1 block text-[0.7rem] font-bold uppercase tracking-wider text-muted">Lớp</label>
          <select value={classId} onChange={(e) => { setClassId(e.target.value); if (e.target.value) setCourse(""); }}
            className="rounded-lg border border-silver/40 bg-white px-4 py-2 text-sm outline-none focus:border-gold">
            <option value="">— Chọn lớp —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-bold uppercase tracking-wider text-muted">Hoặc theo trình độ</label>
          <select value={course} onChange={(e) => { setCourse(e.target.value); if (e.target.value) setClassId(""); }}
            className="rounded-lg border border-silver/40 bg-white px-4 py-2 text-sm outline-none focus:border-gold">
            <option value="">— Tất cả trình độ —</option>
            {LEVELS.map((c) => <option key={c} value={c}>Trình độ {c}</option>)}
          </select>
        </div>
      </div>

      <h3 className="mb-1 font-display text-lg font-bold text-royal">Phạm vi: {scopeLabel}</h3>
      <p className="mb-4 text-sm text-muted">{reports.length} học viên đã có báo cáo xuất bản</p>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gold" /></div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-silver/30 bg-white py-16 text-center text-sm text-muted">
          Chưa có báo cáo cuối khóa nào được xuất bản trong phạm vi này.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-silver/30 bg-white">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">#</th>
              <th className="px-4 py-3 font-semibold text-royal">Học sinh</th>
              <th className="px-4 py-3 font-semibold text-royal">Lớp / Trình độ</th>
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
                      {r.class?.name
                        ? <span className="rounded-full bg-royal/8 px-2 py-0.5 text-[0.65rem] font-semibold text-royal">{r.class.name}</span>
                        : (r.course && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-semibold text-gray-600">{r.course}</span>)}
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