// FILE: src/components/diary/ClassRoadmapPanel.tsx
// Tab "Lộ trình lớp": lộ trình bên trái (tick bài hiện tại) + bảng điểm danh 5 cột bên phải.
// Lưu DB qua /session-diary (dùng chung API với nhật ký cũ). Xuất PNG thẻ đẹp gửi phụ huynh.
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Save, Loader2, Plus, Trash2, Download, Eye } from "lucide-react";
import { api } from "@/lib/api";
import ClassRoadmap from "./ClassRoadmap";
import { PROGRAM_LIST, PROGRAMS, flatten, type Program } from "@/lib/classCurriculum";

function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function fmtDateVN(ymd: string) { const [y,m,d] = ymd.split("-"); return `${d}/${m}/${y}`; }

interface Row {
  name: string;
  attend: "present" | "late" | "absent" | "";
  warmup: string;
  classScore: string;
  homework: string;
  comment: string;
}
const ATTEND_OPTS: { v: Row["attend"]; label: string }[] = [
  { v: "present", label: "Đúng giờ" },
  { v: "late", label: "Muộn" },
  { v: "absent", label: "Vắng" },
];
const ATTEND_LABEL: Record<string, string> = { present: "Đúng giờ", late: "Muộn", absent: "Vắng", "": "—" };

const GOLD = "#C9A84C", GOLD_DARK = "#A6882E", CRIMSON = "#B22234", BLUE = "#1B2A5B", INK = "#1A1A2E";

export default function ClassRoadmapPanel({ classId, cls }: { classId: string; cls: any }) {
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [msg, setMsg] = useState("");
  const [programKey, setProgramKey] = useState("p4");
  const [currentLesson, setCurrentLesson] = useState(0);
  const [teacherName, setTeacherName] = useState("");
  const [assistantName, setAssistantName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const cardRef = useRef<HTMLDivElement | null>(null);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 2500); }

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
  const filledRows = rows.filter((r) => r.name.trim() !== "");

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
          <button onClick={() => setShowPreview((v) => !v)} className="btn-secondary"><Eye size={15} />{showPreview ? "Ẩn xem trước" : "Xem trước thẻ"}</button>
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

      {/* Bố cục nhập liệu: lộ trình trái + điểm danh phải */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <div className="card !p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Lộ trình — click bài đang học</div>
          <ClassRoadmap programKey={programKey} currentN={currentLesson}
            onPick={(n) => setCurrentLesson(n === currentLesson ? 0 : n)} />
        </div>

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

      {/* Thẻ xuất PNG — hiện khi Xem trước; luôn render off-screen để Xuất ảnh chụp được */}
      <div className={showPreview ? "mt-5 overflow-x-auto" : "pointer-events-none fixed -left-[9999px] top-0"}>
        <RoadmapCard
          cardRef={cardRef}
          className={cls?.name || ""}
          dateVN={fmtDateVN(date)}
          teacherName={teacherName}
          assistantName={assistantName}
          prog={prog}
          currentLesson={currentLesson}
          currentLabel={curLabel}
          rows={filledRows}
        />
      </div>
    </div>
  );
}

// ───────── Thẻ xuất PNG: header VESTA + lộ trình trái + bảng điểm danh phải ─────────
function RoadmapCard({ cardRef, className, dateVN, teacherName, assistantName, prog, currentLesson, currentLabel, rows }: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  className: string; dateVN: string; teacherName: string; assistantName: string;
  prog?: Program; currentLesson: number; currentLabel: string; rows: Row[];
}) {
  const flat = prog ? flatten(prog) : [];

  // Dựng lộ trình dạng nhóm cho thẻ (unit / section / buổi)
  function renderRail() {
    if (!prog) return null;
    const line = (n: number, text: string, indent = false) => {
      const now = n === currentLesson;
      const past = n < currentLesson;
      return (
        <div key={n} style={{
          padding: "3px 8px", marginBottom: 2, borderRadius: 5, fontSize: 11,
          paddingLeft: indent ? 16 : 8,
          background: now ? BLUE : "transparent",
          color: now ? "#fff" : past ? "#B8B8B8" : "#555",
          fontWeight: now ? 700 : 400,
          textDecoration: past ? "line-through" : "none",
        }}>
          <span style={{ opacity: 0.5, marginRight: 5 }}>{n}.</span>{text}
        </div>
      );
    };
    let running = 0;
    if (prog.flatItems) {
      return <div>{flat.map((l) => line(l.n, l.label))}</div>;
    }
    if (prog.sections) {
      return (
        <div>
          {prog.sections.map((sec, si) => (
            <div key={si} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: BLUE, fontSize: 11.5, borderLeft: `3px solid ${GOLD}`, paddingLeft: 6, marginBottom: 3 }}>{sec.title}</div>
              {sec.items.map((lb) => { running++; return line(running, lb, true); })}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div>
        {prog.units!.map((u, ui) => (
          <div key={ui} style={{ marginBottom: 7 }}>
            <div style={{ fontWeight: 700, color: BLUE, fontSize: 11.5, marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD, display: "inline-block" }} />{u.title}
            </div>
            {u.lessons.map((l) => { running++; return line(running, l.label, true); })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={cardRef} style={{ width: 960, background: "#fff", fontFamily: "'Be Vietnam Pro', Arial, sans-serif", color: INK }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#FAF6EE 0%,#F4ECDA 50%,#ECE0C4 100%)", padding: "22px 30px 18px", display: "flex", alignItems: "center", gap: 20, borderBottom: `2px solid ${GOLD}` }}>
        <img src="/logo-vesta-01.jpg" alt="VESTA" crossOrigin="anonymous" style={{ width: 84, height: 84, flex: "none", objectFit: "contain" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: GOLD_DARK }}>VESTA UNI · SINCE 2012</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#111122", letterSpacing: 1, margin: "3px 0 4px", fontFamily: "Georgia, serif" }}>LỘ TRÌNH HỌC TẬP</div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.4, textTransform: "uppercase", color: GOLD_DARK }}>{prog?.name || ""}{prog?.meta ? ` · ${prog.meta}` : ""}</div>
        </div>
        <div style={{ flex: "none", minWidth: 180, background: "rgba(255,255,255,.9)", border: `1px solid ${GOLD}`, borderRadius: 12, padding: "9px 13px", fontSize: 12 }}>
          {[["Lớp", className], ["Ngày", dateVN], ["GV", teacherName], ["TG", assistantName]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0", borderBottom: "1px dashed rgba(166,136,46,.3)" }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: .6, textTransform: "uppercase", color: BLUE }}>{k}</span>
              <span style={{ fontWeight: 600, color: CRIMSON, textAlign: "right" }}>{v || "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Thân: lộ trình trái + bảng phải */}
      <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
        {/* Lộ trình trái */}
        <div style={{ width: 280, flex: "none", background: "#FAFAF7", borderRight: `1px solid ${GOLD}`, padding: "16px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: GOLD_DARK, marginBottom: 10 }}>Lộ trình khoá học</div>
          {renderRail()}
        </div>

        {/* Bảng điểm danh phải */}
        <div style={{ flex: 1, padding: "16px 22px" }}>
          {currentLabel && (
            <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(27,42,91,.06)", borderLeft: `3px solid ${BLUE}`, borderRadius: "0 6px 6px 0" }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8, color: GOLD_DARK }}>Buổi hôm nay · </span>
              <span style={{ fontWeight: 700, color: BLUE, fontSize: 13 }}>{currentLabel}</span>
            </div>
          )}
          {rows.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
              <thead>
                <tr style={{ background: BLUE, color: "#fff" }}>
                  <th style={{ padding: "7px 8px", textAlign: "left" }}>Học viên</th>
                  <th style={{ padding: "7px 6px", textAlign: "center" }}>Điểm danh</th>
                  <th style={{ padding: "7px 6px", textAlign: "center" }}>Từ đầu giờ</th>
                  <th style={{ padding: "7px 6px", textAlign: "center" }}>Điểm lớp</th>
                  <th style={{ padding: "7px 6px", textAlign: "left" }}>Bài về nhà</th>
                  <th style={{ padding: "7px 6px", textAlign: "left" }}>Nhận xét</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #EEE" }}>
                    <td style={{ padding: "6px 8px", fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: "6px 6px", textAlign: "center" }}>{ATTEND_LABEL[r.attend] || "—"}</td>
                    <td style={{ padding: "6px 6px", textAlign: "center" }}>{r.warmup || "—"}</td>
                    <td style={{ padding: "6px 6px", textAlign: "center" }}>
                      {r.classScore ? <span style={{ display: "inline-block", background: "rgba(201,168,76,.18)", color: GOLD_DARK, fontWeight: 700, borderRadius: 5, padding: "1px 7px" }}>{r.classScore}</span> : "—"}
                    </td>
                    <td style={{ padding: "6px 6px", lineHeight: 1.4 }}>{r.homework || "—"}</td>
                    <td style={{ padding: "6px 6px", lineHeight: 1.4 }}>{r.comment || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ color: "#999", fontStyle: "italic", fontSize: 12 }}>(chưa có học viên)</p>}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#FAF6EE", borderTop: `2px solid ${GOLD}`, padding: "14px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 800, color: BLUE }}>VESTA UNI</div>
          <div style={{ fontStyle: "italic", color: GOLD_DARK, fontSize: 10.5 }}>Học Nhanh Thi Chắc · Phá Tắc Band</div>
        </div>
        <div style={{ textAlign: "right", color: BLUE, lineHeight: 1.6 }}>
          <div>www.vestaedu.online · 083 877 9988</div>
          <div>60 Hoàng Quốc Việt, Hà Nội</div>
        </div>
      </div>
    </div>
  );
}