// FILE: src/app/(protected)/lop-hoc-moi/[id]/page.tsx — Chi tiết lớp + ghi danh học viên (GĐ1)
"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, UserPlus, Trash2, X, Search } from "lucide-react";
import { api } from "@/lib/api";

const ENROLL_STATUS: Record<string, { label: string; cls: string }> = {
  STUDYING: { label: "Đang học", cls: "bg-green-50 text-green-700" },
  COMPLETED: { label: "Hoàn thành", cls: "bg-blue-50 text-blue-700" },
  TESTED: { label: "Đã thi", cls: "bg-purple-50 text-purple-700" },
  RESERVED: { label: "Bảo lưu", cls: "bg-amber-50 text-amber-700" },
  LEFT: { label: "Đã nghỉ", cls: "bg-gray-100 text-gray-600" }, // giữ để HS cũ không hiện trống
};

// Các trạng thái cho chọn ở dropdown (LEFT đã bỏ khỏi lựa chọn mới theo yêu cầu)
const STATUS_OPTIONS = [
  { value: "STUDYING", label: "Đang học" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "TESTED", label: "Đã thi" },
  { value: "RESERVED", label: "Bảo lưu" },
];

export default function ClassDetailPage() {
  const { id } = useParams();
  const classId = id as string;
  const [cls, setCls] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get(`/classes/${classId}`);
    if (res.success) setCls(res.data);
    setLoading(false);
  }, [classId]);
  useEffect(() => { load(); }, [load]);

  async function openAdd() {
    setPicked(new Set()); setQ(""); setAddOpen(true);
    if (allStudents.length === 0) {
      const data = await api.get("/users?role=STUDENT&limit=1000");
      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : (data.data?.users || data.data?.items || []);
        setAllStudents(list);
      }
    }
  }
  const enrolledIds = new Set((cls?.enrollments || []).map((e: any) => e.student.id));
  const filtered = allStudents.filter((s) => {
    if (enrolledIds.has(s.id)) return false; // ẩn HS đã trong lớp
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return (s.fullName || "").toLowerCase().includes(t) || (s.studentCode || "").toLowerCase().includes(t);
  });
  function togglePick(sid: string) {
    setPicked((prev) => { const n = new Set(prev); n.has(sid) ? n.delete(sid) : n.add(sid); return n; });
  }
  // Chọn/bỏ tất cả HS ĐANG HIỂN THỊ (theo kết quả tìm kiếm hiện tại)
  const allFilteredPicked = filtered.length > 0 && filtered.every((s) => picked.has(s.id));
  function toggleAllFiltered() {
    setPicked((prev) => {
      const n = new Set(prev);
      if (allFilteredPicked) filtered.forEach((s) => n.delete(s.id));
      else filtered.forEach((s) => n.add(s.id));
      return n;
    });
  }
  async function enroll() {
    if (picked.size === 0) return alert("Chưa chọn học viên nào");
    const res = await api.post(`/classes/${classId}/enroll`, { studentIds: Array.from(picked) });
    if (res.success) { setAddOpen(false); load(); } else alert(res.message || "Lỗi ghi danh");
  }
  async function unenroll(studentId: string) {
    if (!confirm("Gỡ học viên này khỏi lớp?")) return;
    const res = await api.delete(`/classes/${classId}/students/${studentId}`);
    if (res.success) load(); else alert(res.message || "Lỗi gỡ");
  }
  async function setStatus(studentId: string, status: string) {
    const res = await api.put(`/classes/${classId}/students/${studentId}`, { status });
    if (res.success) load(); else alert(res.message || "Lỗi cập nhật");
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gold" /></div>;
  if (!cls) return null;
  const enrollments = cls.enrollments || [];

  return (
    <div className="mx-auto max-w-[1000px]">
      <Link href="/lop-hoc-moi" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal">
        <ArrowLeft size={15} />Quay lại danh sách lớp
      </Link>

      <div className="card mb-6">
        <h2 className="font-display text-2xl font-bold text-royal">{cls.name}</h2>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          {cls.classCode && <span>Mã: <b className="text-royal">{cls.classCode}</b></span>}
          {cls.course && <span>Trình độ: <b className="text-royal">{cls.course}</b></span>}
          {cls.teacher && <span>GV: <b className="text-royal">{cls.teacher}</b></span>}
          {cls.schedule && <span>Lịch: {cls.schedule}</span>}
          <span>Sĩ số: <b className="text-royal">{enrollments.length}</b></span>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-royal">Danh sách học viên ({enrollments.length})</h3>
        <button onClick={openAdd} className="btn-primary"><UserPlus size={16} />Ghi danh học viên</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-silver/30 bg-white">
        {enrollments.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">Chưa có học viên. Bấm "Ghi danh học viên" để thêm.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">Học viên</th>
              <th className="px-4 py-3 font-semibold text-royal">Mã HV</th>
              <th className="px-4 py-3 font-semibold text-royal">Trạng thái học</th>
              <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
            </tr></thead>
            <tbody>
              {enrollments.map((e: any) => (
                <tr key={e.id} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-4 py-3 font-medium text-[#1a1a2e]">{e.student.fullName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-royal">{e.student.studentCode || "—"}</td>
                  <td className="px-4 py-3">
                    <select value={e.status} onChange={(ev) => setStatus(e.student.id, ev.target.value)}
                      className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-bold outline-none ${ENROLL_STATUS[e.status]?.cls || "bg-gray-100 text-gray-600"}`}>
                      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      {/* Nếu HS đang mang trạng thái cũ (LEFT) không có trong options → hiện thêm để không mất */}
                      {!STATUS_OPTIONS.some((o) => o.value === e.status) && (
                        <option value={e.status}>{ENROLL_STATUS[e.status]?.label || e.status}</option>
                      )}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => unenroll(e.student.id)} title="Gỡ khỏi lớp"
                      className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal ghi danh */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAddOpen(false)}>
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-royal">Ghi danh học viên vào lớp</h3>
              <button onClick={() => setAddOpen(false)} className="text-muted hover:text-royal"><X size={18} /></button>
            </div>
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên / mã HV..."
                className="input-field pl-9" />
            </div>
            {filtered.length > 0 && (
              <label className="mb-2 flex cursor-pointer items-center gap-3 rounded-lg bg-cream px-3 py-2 hover:bg-cream-dark">
                <input type="checkbox" checked={allFilteredPicked}
                  ref={(el) => { if (el) el.indeterminate = picked.size > 0 && !allFilteredPicked && filtered.some((s) => picked.has(s.id)); }}
                  onChange={toggleAllFiltered} className="h-4 w-4" />
                <span className="text-sm font-semibold text-royal">
                  Chọn tất cả {q.trim() ? "(kết quả tìm kiếm)" : ""} — {filtered.length} học viên
                </span>
              </label>
            )}
            <div className="mb-3 flex-1 overflow-y-auto rounded-lg border border-silver/30">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted">Không có học viên phù hợp (đã trong lớp thì bị ẩn).</div>
              ) : filtered.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-3 border-b border-silver/10 px-3 py-2 hover:bg-cream/50">
                  <input type="checkbox" checked={picked.has(s.id)} onChange={() => togglePick(s.id)} className="h-4 w-4" />
                  <div>
                    <div className="text-sm font-medium text-[#1a1a2e]">{s.fullName}</div>
                    <div className="text-xs text-muted">{s.studentCode || "—"} {s.course ? `· ${s.course}` : ""}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">
                Đã chọn: <b className="text-royal">{picked.size}</b>
                {picked.size > 0 && <button onClick={() => setPicked(new Set())} className="ml-2 text-xs text-muted underline hover:text-royal">bỏ chọn</button>}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setAddOpen(false)} className="btn-secondary">Huỷ</button>
                <button onClick={enroll} className="btn-primary"><UserPlus size={14} />Thêm vào lớp</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}