// FILE: src/app/(protected)/lop-hoc-moi/[id]/page.tsx — Chi tiết lớp + ghi danh (tìm server-side) + điểm danh + nhật ký buổi (xuất PNG) + lộ trình lớp + chuyển lớp
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, UserPlus, Trash2, X, Search, ClipboardCheck, Users, Check, Clock, XCircle, BookText, Plus, Save, Download, ImagePlus, Eye, Repeat, Route } from "lucide-react";
import { api, getImageUrl } from "@/lib/api";
import ClassRoadmapPanel from "@/components/diary/ClassRoadmapPanel";
const ENROLL_STATUS: Record<string, { label: string; cls: string }> = {
  STUDYING: { label: "Đang học", cls: "bg-green-50 text-green-700" },
  COMPLETED: { label: "Hoàn thành", cls: "bg-blue-50 text-blue-700" },
  TESTED: { label: "Đã thi", cls: "bg-purple-50 text-purple-700" },
  RESERVED: { label: "Bảo lưu", cls: "bg-amber-50 text-amber-700" },
  LEFT: { label: "Đã nghỉ", cls: "bg-gray-100 text-gray-600" },
};
const STATUS_OPTIONS = [
  { value: "STUDYING", label: "Đang học" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "TESTED", label: "Đã thi" },
  { value: "RESERVED", label: "Bảo lưu" },
];
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export default function ClassDetailPage() {
  const { id } = useParams();
  const classId = id as string;
  const [cls, setCls] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<"students" | "attendance" | "diary" | "roadmap">("students");
  const [transferStudent, setTransferStudent] = useState<any>(null); // HS đang chuyển lớp
  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get(`/classes/${classId}`);
    if (res.success) setCls(res.data);
    setLoading(false);
  }, [classId]);
  useEffect(() => { load(); }, [load]);
  function openAdd() {
    setPicked(new Set()); setQ(""); setAddOpen(true);
  }
  // Tìm HS server-side (debounce). Tìm được HS ngoài top 100, dù trung tâm có bao nhiêu HS.
  useEffect(() => {
    if (!addOpen) return;
    const t = setTimeout(async () => {
      setSearching(true);
      const qs = new URLSearchParams({ role: "STUDENT", limit: "100" });
      if (q.trim()) qs.set("search", q.trim());
      const data = await api.get(`/users?${qs}`);
      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : (data.data?.users || data.data?.items || []);
        setAllStudents(list);
      }
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [q, addOpen]);
  const enrolledIds = new Set((cls?.enrollments || []).map((e: any) => e.student.id));
  // Server đã lọc theo search; ở client chỉ ẩn HS đã trong lớp
  const filtered = allStudents.filter((s) => !enrolledIds.has(s.id));
  function togglePick(sid: string) {
    setPicked((prev) => { const n = new Set(prev); n.has(sid) ? n.delete(sid) : n.add(sid); return n; });
  }
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
      <div className="mb-5 flex gap-1 rounded-xl border border-silver/30 bg-white p-1">
        <button onClick={() => setTab("students")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${tab === "students" ? "bg-royal text-white" : "text-muted hover:bg-cream-dark"}`}>
          <Users size={16} />Danh sách học viên
        </button>
        <button onClick={() => setTab("attendance")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${tab === "attendance" ? "bg-royal text-white" : "text-muted hover:bg-cream-dark"}`}>
          <ClipboardCheck size={16} />Điểm danh buổi học
        </button>
        <button onClick={() => setTab("diary")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${tab === "diary" ? "bg-royal text-white" : "text-muted hover:bg-cream-dark"}`}>
          <BookText size={16} />Nhật ký buổi
        </button>
        <button onClick={() => setTab("roadmap")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${tab === "roadmap" ? "bg-royal text-white" : "text-muted hover:bg-cream-dark"}`}>
          <Route size={16} />Lộ trình lớp
        </button>
      </div>
      {tab === "attendance" ? (
        <AttendancePanel classId={classId} />
      ) : tab === "diary" ? (
        <SessionDiaryPanel classId={classId} cls={cls} />
      ) : tab === "roadmap" ? (
        <ClassRoadmapPanel classId={classId} cls={cls} />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-royal">Danh sách học viên ({enrollments.length})</h3>
            <button onClick={openAdd} className="btn-primary"><UserPlus size={16} />Ghi danh học viên</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-silver/30 bg-white">
            {enrollments.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted">Chưa có học viên. Bấm &quot;Ghi danh học viên&quot; để thêm.</div>
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
                          {!STATUS_OPTIONS.some((o) => o.value === e.status) && (
                            <option value={e.status}>{ENROLL_STATUS[e.status]?.label || e.status}</option>
                          )}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setTransferStudent(e.student)} title="Chuyển sang lớp khác"
                            className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Repeat size={15} /></button>
                          <button onClick={() => unenroll(e.student.id)} title="Gỡ khỏi lớp"
                            className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAddOpen(false)}>
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-royal">Ghi danh học viên vào lớp</h3>
              <button onClick={() => setAddOpen(false)} className="text-muted hover:text-royal"><X size={18} /></button>
            </div>
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên / mã HV / SĐT..."
                className="input-field pl-9" />
              {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gold" />}
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
                <div className="py-10 text-center text-sm text-muted">
                  {q.trim() ? "Không tìm thấy học viên phù hợp." : "Gõ tên / mã HV để tìm học viên."}
                </div>
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
      {/* Modal chuyển sang lớp khác */}
      {transferStudent && (
        <TransferClassModal
          student={transferStudent}
          currentClassId={classId}
          onClose={() => setTransferStudent(null)}
          onDone={() => { setTransferStudent(null); load(); }}
        />
      )}
    </div>
  );
}
// ═══════════════ ĐIỂM DANH BUỔI HỌC ═══════════════
interface AttRow {
  studentId: string; fullName: string; studentCode: string | null;
  enrollStatus: string;
  attendance: { status: string; score: number | null; note: string | null; markedAt: string } | null;
}
const ATT_BTN = [
  { value: "PRESENT", label: "Có mặt", icon: Check, on: "bg-green-600 text-white border-green-600", off: "border-silver/40 text-muted hover:border-green-400" },
  { value: "LATE", label: "Muộn", icon: Clock, on: "bg-amber-500 text-white border-amber-500", off: "border-silver/40 text-muted hover:border-amber-400" },
  { value: "ABSENT", label: "Vắng", icon: XCircle, on: "bg-red-500 text-white border-red-500", off: "border-silver/40 text-muted hover:border-red-400" },
];
function AttendancePanel({ classId }: { classId: string }) {
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState<AttRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get(`/attendance?classId=${classId}&date=${date}`);
    if (res.success) setRows(res.data || []);
    setLoading(false);
  }, [classId, date]);
  const loadSessions = useCallback(async () => {
    const res = await api.get(`/attendance/sessions?classId=${classId}`);
    if (res.success) setSessions(res.data || []);
  }, [classId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadSessions(); }, [loadSessions]);
  function flash(msg: string) {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(""), 2000);
  }
  async function mark(studentId: string, status: string) {
    setBusy(studentId);
    const res = await api.post(`/attendance/mark`, { classId, studentId, date, status });
    setBusy(null);
    if (!res.success) { alert(res.message || "Lỗi lưu điểm danh"); return; }
    setRows((prev) => prev.map((r) => r.studentId === studentId
      ? { ...r, attendance: { status, score: r.attendance?.score ?? null, note: r.attendance?.note ?? null, markedAt: res.data.markedAt } }
      : r));
    flash("Đã ghi nhận");
    loadSessions();
  }
  async function saveField(studentId: string, field: "score" | "note", value: string) {
    const res = await api.post(`/attendance/mark`, { classId, studentId, date, [field]: value });
    if (!res.success) { alert(res.message || "Lỗi lưu"); return; }
    setRows((prev) => prev.map((r) => r.studentId === studentId
      ? { ...r, attendance: { status: res.data.status, score: res.data.score, note: res.data.note, markedAt: res.data.markedAt } }
      : r));
    flash("Đã lưu");
  }
  async function markAll(status: string) {
    const label = status === "PRESENT" ? "có mặt" : status === "LATE" ? "đi muộn" : "vắng";
    if (!confirm(`Đánh dấu TẤT CẢ học viên là "${label}" cho buổi ${date}?`)) return;
    setLoading(true);
    const res = await api.post(`/attendance/mark-all`, { classId, date, status });
    if (!res.success) { setLoading(false); alert(res.message || "Lỗi điểm danh cả lớp"); return; }
    await load();
    loadSessions();
    flash(`Đã điểm danh ${res.data.count} học viên`);
  }
  function localVal(r: AttRow, field: "score" | "note"): string {
    const v = r.attendance?.[field];
    return v === null || v === undefined ? "" : String(v);
  }
  const counted = rows.filter((r) => r.attendance);
  const nPresent = counted.filter((r) => r.attendance!.status === "PRESENT").length;
  const nLate = counted.filter((r) => r.attendance!.status === "LATE").length;
  const nAbsent = counted.filter((r) => r.attendance!.status === "ABSENT").length;
  return (
    <div>
      <div className="card mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted">Buổi học ngày</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field !w-auto" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {savedMsg && <span className="mr-2 text-xs font-semibold text-green-600">{savedMsg}</span>}
          <button onClick={() => markAll("PRESENT")} className="btn-primary text-xs"><Check size={14} />Tất cả có mặt</button>
          <button onClick={() => markAll("ABSENT")} className="btn-secondary text-xs"><XCircle size={14} />Tất cả vắng</button>
        </div>
      </div>
      {counted.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-lg bg-green-50 px-3 py-1.5 font-semibold text-green-700">Có mặt: {nPresent}</span>
          <span className="rounded-lg bg-amber-50 px-3 py-1.5 font-semibold text-amber-700">Muộn: {nLate}</span>
          <span className="rounded-lg bg-red-50 px-3 py-1.5 font-semibold text-red-600">Vắng: {nAbsent}</span>
          <span className="rounded-lg bg-cream px-3 py-1.5 text-muted">Chưa điểm danh: {rows.length - counted.length}</span>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-silver/30 bg-white">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">Lớp chưa có học viên — ghi danh học viên trước khi điểm danh.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">Học viên</th>
              <th className="px-4 py-3 font-semibold text-royal">Điểm danh</th>
              <th className="px-4 py-3 font-semibold text-royal">Điểm buổi</th>
              <th className="px-4 py-3 font-semibold text-royal">Ghi chú</th>
              <th className="px-4 py-3 font-semibold text-royal">Ghi nhận lúc</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => {
                const st = r.attendance?.status;
                return (
                  <tr key={r.studentId} className={`border-b border-silver/10 ${!r.attendance ? "bg-amber-50/40" : ""}`}>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-[#1a1a2e]">{r.fullName}</div>
                      <div className="font-mono text-[0.65rem] text-muted">{r.studentCode || "—"}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {ATT_BTN.map((b) => {
                          const active = st === b.value;
                          const Icon = b.icon;
                          return (
                            <button key={b.value} onClick={() => mark(r.studentId, b.value)} disabled={busy === r.studentId}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${active ? b.on : b.off}`}>
                              <Icon size={12} />{b.label}
                            </button>
                          );
                        })}
                        {busy === r.studentId && <Loader2 size={13} className="animate-spin text-gold" />}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <input type="number" min="0" max="10" step="0.5" defaultValue={localVal(r, "score")}
                        onBlur={(e) => { if (e.target.value !== localVal(r, "score")) saveField(r.studentId, "score", e.target.value); }}
                        placeholder="—" className="w-20 rounded-lg border border-silver/40 px-2 py-1 text-sm outline-none focus:border-gold" />
                    </td>
                    <td className="px-4 py-2.5">
                      <input type="text" defaultValue={localVal(r, "note")}
                        onBlur={(e) => { if (e.target.value !== localVal(r, "note")) saveField(r.studentId, "note", e.target.value); }}
                        placeholder="Ghi chú..." className="w-full min-w-[140px] rounded-lg border border-silver/40 px-2 py-1 text-sm outline-none focus:border-gold" />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">
                      {r.attendance ? new Date(r.attendance.markedAt).toLocaleString("vi-VN") : <span className="text-amber-600">chưa điểm danh</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {sessions.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-2 text-sm font-bold text-royal">Các buổi đã điểm danh ({sessions.length})</h4>
          <div className="flex flex-wrap gap-2">
            {sessions.map((s) => (
              <button key={s.date} onClick={() => setDate(s.date)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${s.date === date ? "border-royal bg-royal text-white" : "border-silver/40 text-muted hover:border-gold/50 hover:text-royal"}`}>
                {new Date(`${s.date}T00:00:00`).toLocaleDateString("vi-VN")}
                <span className={`ml-1.5 ${s.date === date ? "text-white/80" : "text-green-600"}`}>{s.present + s.late}/{s.present + s.late + s.absent}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// ═══════════════ NHẬT KÝ BUỔI HỌC ═══════════════
interface DiaryStudent { name: string; score: string; comment: string }
function fmtDateVN(ymd: string): string {
  const p = ymd.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : ymd;
}
function toLines(txt: string): string[] {
  return (txt || "").split("\n").map((l) => l.trim()).filter(Boolean);
}
function SessionDiaryPanel({ classId, cls }: { classId: string; cls: any }) {
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [exists, setExists] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [diaries, setDiaries] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [sessionNumber, setSessionNumber] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [assistantName, setAssistantName] = useState("");
  const [content, setContent] = useState("");
  const [homework, setHomework] = useState("");
  const [students, setStudents] = useState<DiaryStudent[]>([]);
  const [imageUrl, setImageUrl] = useState<string>("");
  const cardRef = useRef<HTMLDivElement | null>(null);
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get(`/session-diary?classId=${classId}&date=${date}`);
    if (res.success) {
      const d = res.data;
      setExists(!!res.exists);
      setSessionNumber(d.sessionNumber != null ? String(d.sessionNumber) : "");
      setTeacherName(d.teacherName || d.defaultTeacher || "");
      setAssistantName(d.assistantName || "");
      setContent(d.content || "");
      setHomework(d.homework || "");
      setImageUrl(d.imageUrl || "");
      setStudents(Array.isArray(d.students) ? d.students.map((s: any) => ({ name: s.name || "", score: s.score != null ? String(s.score) : "", comment: s.comment || "" })) : []);
    }
    setLoading(false);
  }, [classId, date]);
  const loadDiaries = useCallback(async () => {
    const res = await api.get(`/session-diary/list?classId=${classId}`);
    if (res.success) setDiaries(res.data || []);
  }, [classId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadDiaries(); }, [loadDiaries]);
  function flash(msg: string) { setSavedMsg(msg); setTimeout(() => setSavedMsg(""), 2500); }
  function setStu(i: number, field: keyof DiaryStudent, value: string) {
    setStudents((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }
  function addStu() { setStudents((prev) => [...prev, { name: "", score: "", comment: "" }]); }
  function removeStu(i: number) { setStudents((prev) => prev.filter((_, idx) => idx !== i)); }
  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await api.post("/posts/upload-image", fd);
      if (res.success) setImageUrl(res.data.url);
      else alert(res.message || "Lỗi upload ảnh");
    } catch { alert("Lỗi upload ảnh"); }
    setUploadingImg(false);
    e.target.value = "";
  }
  async function save() {
    setSaving(true);
    const res = await api.post(`/session-diary`, {
      classId, date,
      sessionNumber, teacherName, assistantName, content, homework,
      imageUrl: imageUrl || null,
      students: students.filter((s) => s.name.trim() !== ""),
    });
    setSaving(false);
    if (!res.success) { alert(res.message || "Lỗi lưu nhật ký"); return; }
    setExists(true);
    flash("Đã lưu nhật ký buổi học");
    loadDiaries();
  }
  async function exportPNG() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `VESTA_NhatKy_${cls.name || "lop"}_${date}.png`.replace(/\s+/g, "");
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      alert("Lỗi xuất ảnh. Thử lại hoặc kiểm tra ảnh minh hoạ có hợp lệ không.");
      console.error(err);
    }
    setExporting(false);
  }
  const contentLines = toLines(content);
  const homeworkLines = toLines(homework);
  const filledStudents = students.filter((s) => s.name.trim() !== "");
  return (
    <div>
      <div className="card mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">Buổi học ngày</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field !w-auto" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">Buổi số</label>
            <input type="number" min="1" value={sessionNumber} onChange={(e) => setSessionNumber(e.target.value)}
              placeholder="1" className="input-field !w-24" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {savedMsg && <span className="text-xs font-semibold text-green-600">{savedMsg}</span>}
          {exists && <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Đã có nhật ký</span>}
          <button onClick={() => setShowPreview((v) => !v)} className="btn-secondary"><Eye size={15} />{showPreview ? "Ẩn xem trước" : "Xem trước thẻ"}</button>
          <button onClick={save} disabled={saving} className="btn-primary"><Save size={15} />{saving ? "Đang lưu..." : "Lưu nhật ký"}</button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
      ) : (
        <>
          <div className="card mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted">Giáo viên</label>
              <input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="Tên GV" className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted">Trợ giảng</label>
              <input value={assistantName} onChange={(e) => setAssistantName(e.target.value)} placeholder="Tên trợ giảng" className="input-field" />
            </div>
          </div>
          <div className="card mb-4">
            <label className="mb-1.5 block text-xs font-bold text-muted">① Nội dung học</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3}
              placeholder="Mỗi dòng = 1 gạch đầu dòng&#10;VD:&#10;Từ vựng chủ đề Cities & Transportation&#10;Kỹ năng nghe: Map labelling" className="input-field" />
            <p className="mt-1 text-[0.7rem] text-muted">Mỗi dòng = 1 gạch đầu dòng.</p>
          </div>
          <div className="card mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold text-muted">② Tình hình lớp — Học viên · Điểm · Nhận xét</label>
              <span className="text-[0.7rem] text-muted">{students.length} học viên · tự lấy từ điểm danh, sửa được</span>
            </div>
            <div className="space-y-2">
              {students.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 shrink-0 pt-2 text-center text-sm font-bold text-royal">{i + 1}</span>
                  <input value={s.name} onChange={(e) => setStu(i, "name", e.target.value)} placeholder="Tên học viên"
                    className="flex-[1.3] rounded-lg border border-silver/40 px-2 py-1.5 text-sm outline-none focus:border-gold" />
                  <input value={s.score} onChange={(e) => setStu(i, "score", e.target.value)} placeholder="Điểm"
                    className="w-16 shrink-0 rounded-lg border border-silver/40 px-2 py-1.5 text-sm outline-none focus:border-gold" />
                  <textarea value={s.comment} onChange={(e) => setStu(i, "comment", e.target.value)} rows={1} placeholder="Nhận xét..."
                    className="flex-[2] resize-y rounded-lg border border-silver/40 px-2 py-1.5 text-sm outline-none focus:border-gold" />
                  <button onClick={() => removeStu(i)} title="Xoá"
                    className="mt-0.5 shrink-0 rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <button onClick={addStu} className="mt-3 flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-light"><Plus size={13} />Thêm học viên</button>
          </div>
          <div className="card mb-4">
            <label className="mb-1.5 block text-xs font-bold text-muted">③ Bài tập về nhà & dặn dò</label>
            <textarea value={homework} onChange={(e) => setHomework(e.target.value)} rows={3}
              placeholder="Mỗi dòng = 1 gạch đầu dòng&#10;VD:&#10;Hoàn thành Unit 2 - phần Reading (trang 24-25)&#10;Học thuộc 20 từ vựng chủ đề Transportation" className="input-field" />
            <p className="mt-1 text-[0.7rem] text-muted">Mỗi dòng = 1 gạch đầu dòng.</p>
          </div>
          <div className="card mb-4">
            <label className="mb-2 block text-xs font-bold text-muted">Ảnh minh hoạ (tuỳ chọn) & Xuất ảnh</label>
            <div className="flex flex-wrap items-center gap-3">
              {imageUrl ? (
                <div className="relative">
                  <img src={getImageUrl(imageUrl)} alt="minh hoạ" className="h-24 rounded-lg border border-silver/30 object-cover" />
                  <button onClick={() => setImageUrl("")} className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:scale-110"><X size={12} /></button>
                </div>
              ) : (
                <button onClick={() => imgInputRef.current?.click()} disabled={uploadingImg}
                  className="flex items-center gap-2 rounded-lg border-2 border-dashed border-silver/40 bg-cream px-5 py-4 text-sm text-muted hover:border-gold/40 hover:bg-gold/5">
                  {uploadingImg ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                  {uploadingImg ? "Đang tải..." : "Thêm ảnh minh hoạ"}
                </button>
              )}
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={uploadImage} />
              <div className="ml-auto flex gap-2">
                <button onClick={() => setShowPreview(true)} className="btn-secondary"><Eye size={15} />Xem trước</button>
                <button onClick={exportPNG} disabled={exporting}
                  className="btn-primary">{exporting ? <><Loader2 size={15} className="animate-spin" />Đang xuất...</> : <><Download size={15} />Xuất ảnh PNG</>}</button>
              </div>
            </div>
            <p className="mt-2 text-[0.7rem] text-muted">Bấm &quot;Xuất ảnh PNG&quot; để tải thẻ nhật ký đẹp gửi phụ huynh. Nên bấm &quot;Lưu nhật ký&quot; trước để không mất dữ liệu.</p>
          </div>
          {showPreview && (
            <div className="mb-4 overflow-x-auto">
              <DiaryCard
                cardRef={cardRef}
                className={cls.name}
                course={cls.course}
                sessionNumber={sessionNumber}
                dateVN={fmtDateVN(date)}
                teacherName={teacherName}
                assistantName={assistantName}
                contentLines={contentLines}
                homeworkLines={homeworkLines}
                students={filledStudents}
                imageUrl={imageUrl ? getImageUrl(imageUrl) : ""}
              />
            </div>
          )}
        </>
      )}
      {diaries.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-2 text-sm font-bold text-royal">Các buổi đã ghi nhật ký ({diaries.length})</h4>
          <div className="flex flex-wrap gap-2">
            {diaries.map((d) => {
              const key = new Date(d.sessionDate).toISOString().slice(0, 10);
              return (
                <button key={d.id} onClick={() => setDate(key)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${key === date ? "border-royal bg-royal text-white" : "border-silver/40 text-muted hover:border-gold/50 hover:text-royal"}`}>
                  {new Date(d.sessionDate).toLocaleDateString("vi-VN")}
                  {d.sessionNumber != null && <span className={`ml-1.5 ${key === date ? "text-white/80" : "text-gold-dark"}`}>· B{d.sessionNumber}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
// ───────── Thẻ nhật ký (layout theo artifact, inline style để html2canvas chụp chuẩn) ─────────
function DiaryCard(props: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  className: string; course: string | null;
  sessionNumber: string; dateVN: string;
  teacherName: string; assistantName: string;
  contentLines: string[]; homeworkLines: string[];
  students: DiaryStudent[];
  imageUrl: string;
}) {
  const { cardRef, className, sessionNumber, dateVN, teacherName, assistantName, contentLines, homeworkLines, students, imageUrl } = props;
  const GOLD = "#C9A84C", GOLD_DARK = "#A6882E", CRIMSON = "#B22234", CRIMSON_DARK = "#8B1A29", BLUE = "#1B2A5B", INK = "#1A1A2E";
  const meta = (k: string, v: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "4px 0", borderBottom: "1px dashed rgba(166,136,46,.32)" }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase", color: BLUE }}>{k}</span>
      <span style={{ fontWeight: 600, color: CRIMSON, textAlign: "right" }}>{v || "—"}</span>
    </div>
  );
  const sectionHead = (num: string, title: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 13 }}>
      <div style={{ width: 34, height: 34, flex: "none", borderRadius: "50%", background: `linear-gradient(135deg,${CRIMSON},${CRIMSON_DARK})`, color: "#fff", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{num}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: BLUE, flex: 1, fontFamily: "Georgia, serif" }}>{title}</div>
    </div>
  );
  return (
    <div ref={cardRef} style={{ width: 820, background: "#fff", fontFamily: "'Be Vietnam Pro', Arial, sans-serif", color: INK }}>
      <div style={{ background: "linear-gradient(135deg,#FAF6EE 0%,#F4ECDA 50%,#ECE0C4 100%)", padding: "24px 32px 20px", display: "flex", alignItems: "center", gap: 22, borderBottom: `2px solid ${GOLD}` }}>
        <img src="/logo-vesta-01.jpg" alt="VESTA" crossOrigin="anonymous" style={{ width: 96, height: 96, flex: "none", objectFit: "contain" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3.5, color: GOLD_DARK }}>VESTA UNI · SINCE 2012</div>
          <div style={{ fontSize: 29, fontWeight: 800, color: "#111122", letterSpacing: 1, margin: "4px 0 5px", fontFamily: "Georgia, serif" }}>NHẬT KÝ HỌC TẬP</div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2.6, textTransform: "uppercase", color: GOLD_DARK }}>FAST TRACK TO HIGH SCORES</div>
        </div>
        <div style={{ flex: "none", minWidth: 190, background: "rgba(255,255,255,.9)", border: `1px solid ${GOLD}`, borderRadius: 12, padding: "10px 14px", fontSize: 12.5 }}>
          {meta("Lớp", className || "—")}
          {meta("Buổi", sessionNumber || "—")}
          {meta("Ngày", dateVN)}
          {meta("GV", teacherName || "—")}
          {meta("TG", assistantName || "—")}
        </div>
      </div>
      <div style={{ padding: "26px 32px 20px" }}>
        <div style={{ marginBottom: 26 }}>
          {sectionHead("1", "Nội Dung Học")}
          {contentLines.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 22 }}>
              {contentLines.map((l, i) => <li key={i} style={{ marginBottom: 6, lineHeight: 1.5 }}>{l}</li>)}
            </ul>
          ) : <p style={{ color: "#999", fontStyle: "italic" }}>(chưa nhập)</p>}
        </div>
        <div style={{ marginBottom: 26 }}>
          {sectionHead("2", "Tình Hình Lớp")}
          {students.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: BLUE, color: "#fff" }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", width: 40 }}>STT</th>
                  <th style={{ padding: "8px 10px", textAlign: "left" }}>Học viên</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", width: 60 }}>Điểm</th>
                  <th style={{ padding: "8px 10px", textAlign: "left" }}>Nhận xét của giáo viên</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #EEE" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: CRIMSON }}>{i + 1}</td>
                    <td style={{ padding: "8px 10px", fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>
                      {s.score ? <span style={{ display: "inline-block", background: "rgba(201,168,76,.18)", color: GOLD_DARK, fontWeight: 700, borderRadius: 6, padding: "2px 8px" }}>{s.score}</span> : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", lineHeight: 1.45 }}>{s.comment || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ color: "#999", fontStyle: "italic" }}>(chưa có học viên)</p>}
        </div>
        {imageUrl && (
          <div style={{ marginBottom: 26, textAlign: "center" }}>
            <img src={imageUrl} alt="minh hoạ" crossOrigin="anonymous" style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 10, border: `1px solid ${GOLD}` }} />
          </div>
        )}
        <div style={{ marginBottom: 8 }}>
          {sectionHead("3", "Bài Tập Về Nhà & Dặn Dò")}
          {homeworkLines.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 22, background: "#FFFBF0", borderLeft: `3px solid ${GOLD}`, padding: "12px 12px 12px 34px", borderRadius: "0 8px 8px 0" }}>
              {homeworkLines.map((l, i) => <li key={i} style={{ marginBottom: 6, lineHeight: 1.5 }}>{l}</li>)}
            </ul>
          ) : <p style={{ color: "#999", fontStyle: "italic" }}>(chưa nhập)</p>}
        </div>
      </div>
      <div style={{ background: "#FAF6EE", borderTop: `2px solid ${GOLD}`, padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 800, color: BLUE }}>VESTA UNI</div>
          <div style={{ fontStyle: "italic", color: GOLD_DARK, fontSize: 11 }}>Học Nhanh Thi Chắc · Phá Tắc Band</div>
        </div>
        <div style={{ textAlign: "right", color: BLUE, lineHeight: 1.6 }}>
          <div>www.vestaedu.online · 083 877 9988</div>
          <div>60 Hoàng Quốc Việt, Hà Nội</div>
        </div>
      </div>
    </div>
  );
}
// ───────── Modal chuyển HS sang lớp khác (giữ lớp hiện tại) ─────────
function TransferClassModal({ student, currentClassId, onClose, onDone }: { student: any; currentClassId: string; onClose: () => void; onDone: () => void }) {
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [targetId, setTargetId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    (async () => {
      const [mine, all] = await Promise.all([
        api.get(`/classes/of-student/${student.id}`),
        api.get(`/classes`),
      ]);
      if (mine.success) setMyClasses(mine.data || []);
      if (all.success) setAllClasses(all.data || []);
      setLoading(false);
    })();
  }, [student.id]);
  const myIds = new Set(myClasses.map((c: any) => c.id));
  const available = allClasses.filter((c: any) => !myIds.has(c.id));
  async function submit() {
    if (!targetId) return;
    setSaving(true);
    const res = await api.post(`/classes/${targetId}/enroll`, { studentIds: [student.id] });
    setSaving(false);
    if (res.success) onDone();
    else alert(res.message || "Lỗi chuyển lớp");
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-royal">Chuyển sang lớp khác</h3>
            <p className="text-xs text-muted">{student.fullName} {student.studentCode ? `(${student.studentCode})` : ""}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-royal"><X size={20} /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-gold" /></div>
        ) : (
          <>
            <div className="mb-3 rounded-lg bg-cream px-3 py-2 text-xs text-muted">
              Học viên sẽ được <b className="text-royal">thêm vào lớp mới</b> và <b className="text-royal">vẫn giữ ở lớp hiện tại</b>. Điểm danh/điểm cũ không thay đổi.
            </div>
            {myClasses.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Đang thuộc lớp</p>
                <div className="flex flex-wrap gap-1.5">
                  {myClasses.map((c: any) => (
                    <span key={c.id} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.id === currentClassId ? "bg-royal/10 text-royal" : "bg-gray-100 text-gray-600"}`}>
                      {c.name}{c.course ? ` (${c.course})` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Chọn lớp muốn chuyển sang</p>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="input-field w-full">
              <option value="">— Chọn lớp —</option>
              {available.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.course ? ` (${c.course})` : ""}</option>)}
            </select>
            {available.length === 0 && <p className="mt-2 text-xs text-amber-600">Học viên đã thuộc tất cả các lớp hiện có.</p>}
          </>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Huỷ</button>
          <button onClick={submit} disabled={!targetId || saving} className="btn-primary disabled:opacity-40">
            {saving ? "Đang chuyển..." : "Chuyển sang lớp này"}
          </button>
        </div>
      </div>
    </div>
  );
}