// FILE: src/components/diary/ClassRoadmapPanel.tsx
// Tab "Lộ trình lớp": lộ trình bên trái (tick bài hiện tại) + bảng điểm danh 5 cột bên phải.
// Lưu DB qua /session-diary (dùng chung API với nhật ký cũ). Xuất PNG.
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Save, Loader2, Plus, Trash2, Download, Eye } from "lucide-react";
import { api } from "@/lib/api";
import ClassRoadmap from "./ClassRoadmap";
import { PROGRAM_LIST, PROGRAMS, flatten } from "@/lib/classCurriculum";

function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function fmtDateVN(ymd: string) { const [y,m,d] = ymd.split("-"); return `${d}/${m}/${y}`; }

// 1 dòng học sinh — 5 cột
interface Row {
  name: string;
  attend: "present" | "late" | "absent" | "";
  warmup: string;   // Từ đầu giờ
  classScore: string; // Điểm trên lớp
  homework: string; // Bài về nhà
  comment: string;  // Nhận xét
}
const ATTEND_OPTS: { v: Row["attend"]; label: string; color: string }[] = [
  { v: "present", label: "Đúng giờ", color: "text-green-700 bg-green-50" },
  { v: "late", label: "Muộn", color: "text-amber-700 bg-amber-50" },
  { v: "absent", label: "Vắng", color: "text-red-700 bg-red-50" },
];

const GOLD = "#C9A84C";
const NAVY = "#1B2A5B";

export default function ClassRoadmapPanel({ classId, cls }: { classId: string; cls: any }) {
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState("");
  const [programKey, setProgramKey] = useState("p4");
  const [currentLesson, setCurrentLesson] = useState(0);
  const [teacherName, setTeacherName] = useState("");
  const [assistantName, setAssistantName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const cardRef = useRef<HTMLDivElement | null>(null);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 2500); }

  // Đoán chương trình mặc định từ course của lớp (4+/5+/6+/7+/789)
  function guessProgram(course?: string): string {
    const c = String(course || "").toLowerCase();
    if (c.includes("789") || c.includes("intensive") || c.includes("đề")) return "p789";
    if (c.includes("7")) return "p7";
    if (c.includes("6")) return "p6";
    if (c.includes("5")) return "p5";
    return "p4";
  }

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get(`/session-diary?classId=${classId}&date=${date}`);
    if (res.success) {
      const d = res.data;
      setTeacherName(d.teacherName || d.defaultTeacher || "");
      setAssistantName(d.assistantName || "");
      setProgramKey(d.programKey || guessProgram(d.course || cls?.course));
      setCurrentLesson(d.currentLesson || 0);
      // students Json: dùng lại name; map các cột mới (nếu bản ghi cũ thiếu thì để rỗng)
      const list = Array.isArray(d.students) ? d.students : [];
      setRows(list.map((s: any) => ({
        name: s.name || "",
        attend: s.attend || "",
        warmup: s.warmup || "",
        classScore: s.classScore != null ? String(s.classScore) : (s.score != null ? String(s.score) : ""),
        homework: s.homework || "",
        comment: s.comment || "",
      })));
    }
    setLoading(false);
  }, [classId, date, cls]);
  useEffect(() => { load(); }, [load]);

  function setRow(i: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }
  function addRow() { setRows((prev) => [...prev, { name: "", attend: "", warmup: "", classScore: "", homework: "", comment: "" }]); }
  function removeRow(i: number) { setRows((prev) => prev.filter((_, idx) => idx !== i)); }

  async function save() {
    setSaving(true);
    const res = await api.post(`/session-diary`, {
      classId, date,
      programKey, currentLesson,
      teacherName, assistantName,
      students: rows.filter((r) => r.name.trim() !== ""),
    });
    setSaving(false);
    if (!res.success) { alert(res.message || "Lỗi lưu"); return; }
    flash("Đã lưu lộ trình + điểm danh");
  }

  async function exportPNG() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `VESTA_LoTrinh_${cls?.name || "lop"}_${date}.png`.replace(/\s+/g, "");
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) { alert("Lỗi xuất ảnh."); console.error(err); }
    setExporting(false);
  }

  const prog = PROGRAMS[programKey];
  const flat = prog ? flatten(prog) : [];
  const curLabel = currentLesson > 0 ? (flat.find((f) => f.n === currentLesson)?.label || "") : "";

  return (
    <div>
      {/* Thanh điều khiển */}
      <div className="card mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">Buổi học ngày</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field !w-auto" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">Chương trình</label>
            <select value={programKey} onChange={(e) => { setProgramKey(e.target.value); setCurrentLesson(0); }} className="input-field !w-auto">
              {PROGRAM_LIST.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {msg && <span className="text-xs font-semibold text-green-600">{msg}</span>}
          <button onClick={exportPNG} disabled={exporting} className="btn-secondary"><Download size={15} />{exporting ? "Đang xuất..." : "Xuất ảnh"}</button>
          <button onClick={save} disabled={saving} className="btn-primary"><Save size={15} />{saving ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
      ) : (
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
      )}

      {/* Bố cục: lộ trình trái + điểm danh phải */}
      <div ref={cardRef} className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        {/* LỘ TRÌNH — cột trái */}
        <div className="card !p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Lộ trình — click bài đang học</div>
          <ClassRoadmap programKey={programKey} currentN={currentLesson}
            onPick={(n) => setCurrentLesson(n === currentLesson ? 0 : n)} />
        </div>

        {/* ĐIỂM DANH — cột phải, 5 cột */}
        <div className="card !p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wide text-muted">Điểm danh & Nhận xét</div>
            <span className="text-[0.7rem] text-muted">{rows.length} HV · tự lấy từ lớp, sửa được</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-silver/30 text-left text-muted">
                  <th className="py-1.5 pr-2 font-semibold">Học viên</th>
                  <th className="px-1 font-semibold">Điểm danh</th>
                  <th className="px-1 font-semibold">Từ đầu giờ</th>
                  <th className="px-1 font-semibold">Điểm lớp</th>
                  <th className="px-1 font-semibold">Bài về nhà</th>
                  <th className="px-1 font-semibold">Nhận xét</th>
                  <th className="w-6"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-silver/10 align-top">
                    <td className="py-1.5 pr-2">
                      <input value={r.name} onChange={(e) => setRow(i, "name", e.target.value)} placeholder="Tên"
                        className="w-full min-w-[90px] rounded border border-silver/40 px-1.5 py-1 outline-none focus:border-gold" />
                    </td>
                    <td className="px-1">
                      <select value={r.attend} onChange={(e) => setRow(i, "attend", e.target.value)}
                        className="w-full rounded border border-silver/40 px-1 py-1 outline-none focus:border-gold">
                        <option value="">—</option>
                        {ATTEND_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                      </select>
                    </td>
                    <td className="px-1"><input value={r.warmup} onChange={(e) => setRow(i, "warmup", e.target.value)} className="w-full min-w-[70px] rounded border border-silver/40 px-1.5 py-1 outline-none focus:border-gold" /></td>
                    <td className="px-1"><input value={r.classScore} onChange={(e) => setRow(i, "classScore", e.target.value)} className="w-full min-w-[55px] rounded border border-silver/40 px-1.5 py-1 outline-none focus:border-gold" /></td>
                    <td className="px-1"><input value={r.homework} onChange={(e) => setRow(i, "homework", e.target.value)} className="w-full min-w-[80px] rounded border border-silver/40 px-1.5 py-1 outline-none focus:border-gold" /></td>
                    <td className="px-1"><input value={r.comment} onChange={(e) => setRow(i, "comment", e.target.value)} className="w-full min-w-[100px] rounded border border-silver/40 px-1.5 py-1 outline-none focus:border-gold" /></td>
                    <td className="px-0.5"><button onClick={() => removeRow(i)} className="rounded p-1 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addRow} className="mt-2 flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-light"><Plus size={13} />Thêm học viên</button>
        </div>
      </div>
    </div>
  );
}