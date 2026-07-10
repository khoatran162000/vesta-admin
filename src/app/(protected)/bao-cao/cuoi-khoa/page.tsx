// FILE: src/app/(protected)/bao-cao/cuoi-khoa/page.tsx — Danh sách báo cáo cuối khóa
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Loader2, Pencil, Trash2, Layers } from "lucide-react";
import { api } from "@/lib/api";
import { COURSES } from "@/lib/courses";
export default function FinalReportListPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState("");
  const [filterClassId, setFilterClassId] = useState("");
  useEffect(() => {
    (async () => {
      const cl = await api.get("/classes");
      if (cl.success) setClasses(cl.data || []);
    })();
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterClassId) params.set("classId", filterClassId);
    else if (filterCourse) params.set("course", filterCourse);
    const data = await api.get(`/final-reports?${params}`);
    if (data.success) setReports(data.data || []);
    setLoading(false);
  }, [filterClassId, filterCourse]);
  useEffect(() => { load(); }, [load]);
  async function handleDelete(id: string) {
    if (!confirm("Xoá báo cáo cuối khóa này?")) return;
    const data = await api.delete(`/final-reports/${id}`);
    if (data.success) load();
    else alert(data.message || "Lỗi xoá");
  }
  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("vi-VN");
  }
  const summaryHref = filterClassId
    ? `/bao-cao/cuoi-khoa/tong-hop?classId=${encodeURIComponent(filterClassId)}`
    : filterCourse
    ? `/bao-cao/cuoi-khoa/tong-hop?course=${encodeURIComponent(filterCourse)}`
    : "/bao-cao/cuoi-khoa/tong-hop";
  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">🎓 Báo Cáo Cuối Khóa</h2>
          <p className="mt-1 text-sm text-muted">{reports.length} báo cáo</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={summaryHref} className="btn-secondary">
            <Layers size={16} />Tổng hợp cả lớp
          </Link>
          <Link href="/bao-cao/cuoi-khoa/tao-moi" className="btn-primary">
            <Plus size={16} />Tạo báo cáo
          </Link>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <div>
          <label className="mb-1 block text-[0.7rem] font-bold uppercase tracking-wider text-muted">Lớp</label>
          <select value={filterClassId} onChange={(e) => { setFilterClassId(e.target.value); if (e.target.value) setFilterCourse(""); }}
            className="rounded-lg border border-silver/40 bg-white px-4 py-2 text-sm outline-none focus:border-gold">
            <option value="">— Tất cả lớp —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-bold uppercase tracking-wider text-muted">Hoặc theo trình độ</label>
          <select value={filterCourse} onChange={(e) => { setFilterCourse(e.target.value); if (e.target.value) setFilterClassId(""); }}
            className="rounded-lg border border-silver/40 bg-white px-4 py-2 text-sm outline-none focus:border-gold">
            <option value="">— Tất cả trình độ —</option>
            {COURSES.map((c) => <option key={c} value={c}>Trình độ {c}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-silver/30 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">Chưa có báo cáo cuối khóa nào.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">Học sinh</th>
              <th className="px-4 py-3 font-semibold text-royal">Lớp</th>
              <th className="px-4 py-3 font-semibold text-royal">Ngày tạo</th>
              <th className="px-4 py-3 font-semibold text-royal">Trạng thái</th>
              <th className="px-4 py-3 font-semibold text-royal">Người tạo</th>
              <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
            </tr></thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-4 py-3 font-medium text-[#1a1a2e]">
                    {r.student?.fullName}
                    <div className="text-xs font-mono text-muted">{r.student?.studentCode}</div>
                  </td>
                  <td className="px-4 py-3">
                    {r.class?.name
                      ? <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[0.65rem] font-semibold text-royal">{r.class.name}</span>
                      : r.course && <span className="rounded-full bg-royal/8 px-2 py-0.5 text-[0.65rem] font-semibold text-royal">{r.course}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{fmtDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    {r.status === "PUBLISHED" ? (
                      <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700">Đã xuất bản</span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">Nháp</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{r.creator?.fullName || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/bao-cao/cuoi-khoa/${r.id}`} title="Sửa"
                        className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Pencil size={15} /></Link>
                      <button onClick={() => handleDelete(r.id)} title="Xoá"
                        className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}