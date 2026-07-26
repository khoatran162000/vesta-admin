// FILE: src/app/(protected)/lop-hoc-moi/[id]/page.tsx — Chi tiết lớp + ghi danh học viên + điểm danh + nhật ký buổi
"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, UserPlus, Trash2, X, Search, ClipboardCheck, Users, Check, Clock, XCircle, BookText, Plus, Save } from "lucide-react";
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
// Ngày hôm nay theo giờ máy → YYYY-MM-DD
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
  const [tab, setTab] = useState<"students" | "attendance" | "diary">("students");
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
      {/* Tab: Danh sách HV / Điểm danh / Nhật ký buổi */}
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
      </div>
      {tab === "attendance" ? (
        <AttendancePanel classId={classId} />
      ) : tab === "diary" ? (
        <SessionDiaryPanel classId={classId} cls={cls} />
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
        </>
      )}
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
  // Bấm tick → lưu ngay, backend ghi lại đúng thời điểm bấm
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
  // Điểm / ghi chú → lưu khi rời ô (đỡ gọi API mỗi lần gõ)
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
      {/* Thanh chọn ngày + điểm danh nhanh */}
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
      {/* Tổng kết buổi */}
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
      {/* Các buổi đã điểm danh */}
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
function SessionDiaryPanel({ classId, cls }: { classId: string; cls: any }) {
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [diaries, setDiaries] = useState<any[]>([]);
  // Trường của buổi
  const [sessionNumber, setSessionNumber] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [assistantName, setAssistantName] = useState("");
  const [content, setContent] = useState("");
  const [homework, setHomework] = useState("");
  const [students, setStudents] = useState<DiaryStudent[]>([]);

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

  async function save() {
    setSaving(true);
    const res = await api.post(`/session-diary`, {
      classId, date,
      sessionNumber, teacherName, assistantName, content, homework,
      students: students.filter((s) => s.name.trim() !== ""),
    });
    setSaving(false);
    if (!res.success) { alert(res.message || "Lỗi lưu nhật ký"); return; }
    setExists(true);
    flash("Đã lưu nhật ký buổi học");
    loadDiaries();
  }

  return (
    <div>
      {/* Thanh chọn ngày */}
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
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-xs font-semibold text-green-600">{savedMsg}</span>}
          {exists && <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Đã có nhật ký</span>}
          <button onClick={save} disabled={saving} className="btn-primary"><Save size={15} />{saving ? "Đang lưu..." : "Lưu nhật ký"}</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
      ) : (
        <>
          {/* GV + Trợ giảng */}
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

          {/* Nội dung học */}
          <div className="card mb-4">
            <label className="mb-1.5 block text-xs font-bold text-muted">① Nội dung học</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3}
              placeholder="Mỗi dòng = 1 gạch đầu dòng&#10;VD:&#10;Từ vựng chủ đề Cities & Transportation&#10;Kỹ năng nghe: Map labelling" className="input-field" />
            <p className="mt-1 text-[0.7rem] text-muted">Mỗi dòng = 1 gạch đầu dòng.</p>
          </div>

          {/* Tình hình lớp — HS/điểm/nhận xét (tự đổ từ điểm danh, sửa được) */}
          <div className="card mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold text-muted">② Tình hình lớp — Học viên · Điểm · Nhận xét</label>
              <span className="text-[0.7rem] text-muted">{students.length} học viên · tự lấy từ điểm danh, sửa được</span>
            </div>
            <div className="space-y-2">
              {students.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 shrink-0 pt-2 text-center text-sm font-bold text-crimson text-royal">{i + 1}</span>
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

          {/* Bài tập về nhà */}
          <div className="card mb-4">
            <label className="mb-1.5 block text-xs font-bold text-muted">③ Bài tập về nhà & dặn dò</label>
            <textarea value={homework} onChange={(e) => setHomework(e.target.value)} rows={3}
              placeholder="Mỗi dòng = 1 gạch đầu dòng&#10;VD:&#10;Hoàn thành Unit 2 - phần Reading (trang 24-25)&#10;Học thuộc 20 từ vựng chủ đề Transportation" className="input-field" />
            <p className="mt-1 text-[0.7rem] text-muted">Mỗi dòng = 1 gạch đầu dòng.</p>
          </div>
        </>
      )}

      {/* Các buổi đã ghi nhật ký */}
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