// FILE: src/app/(protected)/lich-cong-tac/page.tsx — Lịch công tác nội bộ (TKB tuần + nhiệm vụ đội ngũ)
// ADMIN sửa (thêm/sửa/xoá/tick), mọi tài khoản đăng nhập đều xem. Font to, tông VESTA. Xuất PNG.
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Download, Loader2, X, Check, Calendar as CalIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type S = { id: string; weekStart: string; dayIndex: number; slot: string; room: string; className: string; teacher: string; assistant: string; tags: string; note: string };
type T = { id: string; weekStart: string; title: string; owner: string; tags: string; deadline: string; note: string; completed: boolean };

const GV = ["MS. LY", "MR. TÀI", "MR. D.A.", "MR. TIẾN"];
const TA = ["MS. NGÂN", "MR. DUY", "MS. QUỲNH"];
const STAFF_PEOPLE = [...GV, ...TA, "MS. NGỌC"];
const ROOMS = ["Phòng 1 · To", "Phòng 2 · VIP", "Phòng 3 · Ngoài"];
const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const SLOTS = [
  { id: "morning", name: "Sáng 08:00", time: "08:00–10:00" },
  { id: "morning9", name: "Sáng 09:00", time: "09:00–11:00" },
  { id: "morning2", name: "Sáng 10:00", time: "10:00–12:00" },
  { id: "afternoon", name: "Chiều 13:00", time: "13:00–15:00" },
  { id: "afternoon2", name: "Chiều 15:00", time: "15:00–17:00" },
  { id: "evening17", name: "Chiều 17:00", time: "17:00–19:00" },
  { id: "early", name: "Tối 18:00", time: "18:00–20:00" },
  { id: "evening19", name: "Tối 19:00", time: "19:00–21:00" },
  { id: "late", name: "Tối 20:00", time: "20:00–22:00" },
];
const DAY_PRESETS = [
  { label: "T2·T4·T6", days: [0, 2, 4] },
  { label: "T3·T5·T7", days: [1, 3, 5] },
  { label: "T2→T6", days: [0, 1, 2, 3, 4] },
  { label: "Cả tuần", days: [0, 1, 2, 3, 4, 5, 6] },
];
// Màu chip theo người (8 tông VESTA-ish)
const PERSON_TONES: Record<string, number> = { "MS. LY": 0, "MR. TÀI": 1, "MR. D.A.": 2, "MR. TIẾN": 3, "MS. NGÂN": 4, "MR. DUY": 5, "MS. QUỲNH": 6, "MS. NGỌC": 7 };
const TONE_BG = ["#1B2A5B", "#A6882E", "#B22234", "#2A7D6F", "#7A4E9E", "#3B6FB0", "#C0653A", "#5A6570"];
function toneIdx(name: string): number {
  const k = name.trim().toUpperCase();
  if (PERSON_TONES[k] !== undefined) return PERSON_TONES[k];
  let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 8;
}
function parseTags(v: unknown): string[] {
  if (Array.isArray(v)) return [...new Set(v.map(String).map((x) => x.trim()).filter(Boolean))];
  if (typeof v !== "string" || !v) return [];
  try { return parseTags(JSON.parse(v)); } catch { return v.split(",").map((x) => x.trim()).filter(Boolean); }
}
const uniq = (a: string[]) => [...new Set(a.map((x) => x.trim()).filter(Boolean))];
const isoLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d, 12); };
const monday = (d = new Date()) => { const x = new Date(d), n = x.getDay() || 7; x.setDate(x.getDate() - n + 1); return isoLocal(x); };
const addDays = (iso: string, n: number) => { const d = fromIso(iso); d.setDate(d.getDate() + n); return isoLocal(d); };
const fmt = (iso: string) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(fromIso(iso));

function PersonChip({ name, small }: { name: string; small?: boolean }) {
  return <span style={{ background: TONE_BG[toneIdx(name)] }}
    className={`inline-flex items-center gap-1 rounded-full font-semibold text-white ${small ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs"}`}>{name}</span>;
}

export default function LichCongTacPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [week, setWeek] = useState(monday());
  const [schedule, setSchedule] = useState<S[]>([]);
  const [tasks, setTasks] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [toast, setToast] = useState("");
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const res = await api.get(`/planner?week=${week}`);
    if (res.success) { setSchedule(res.data.schedule || []); setTasks(res.data.tasks || []); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [week]);

  const title = useMemo(() => `${fmt(week)} – ${fmt(addDays(week, 6))}`, [week]);
  const done = tasks.filter((x) => x.completed).length;
  function notify(m: string) { setToast(m); setTimeout(() => setToast(""), 2600); }

  async function del(type: string, id: string) {
    if (!isAdmin || !confirm("Xoá mục này?")) return;
    const res = await api.delete(`/planner?type=${type}&id=${id}`);
    if (!res.success) return notify(res.message || "Không xoá được");
    load();
  }
  async function toggle(t: T) {
    if (!isAdmin) return;
    const res = await api.patch(`/planner`, { type: "task", ...t, completed: !t.completed });
    if (!res.success) return notify(res.message || "Không có quyền");
    setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, completed: !x.completed } : x));
  }
  async function exportPNG() {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `VESTA_LichCongTac_${week}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      notify("Đã xuất ảnh");
    } catch (e) { notify("Lỗi xuất ảnh"); console.error(e); }
    setExporting(false);
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      {/* Thanh điều khiển */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-royal/10 text-royal"><CalIcon size={22} /></span>
          <div>
            <h1 className="font-display text-3xl font-bold text-royal">Lịch công tác</h1>
            <p className="text-sm text-muted">{isAdmin ? "Quản trị — sửa được" : "Chỉ xem"} · Tuần {title}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-silver/30 bg-white p-1">
            <button onClick={() => setWeek(addDays(week, -7))} className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ChevronLeft size={18} /></button>
            <button onClick={() => setWeek(monday())} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-royal hover:bg-cream-dark">Tuần này</button>
            <button onClick={() => setWeek(addDays(week, 7))} className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ChevronRight size={18} /></button>
          </div>
          <button onClick={exportPNG} disabled={exporting} className="btn-secondary text-base"><Download size={17} />{exporting ? "Đang xuất..." : "Xuất ảnh"}</button>
        </div>
      </div>

      {/* Vùng xuất ảnh: stats + lịch + nhiệm vụ */}
      <div ref={exportRef} className="rounded-2xl bg-white p-4">
        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Buổi đã xếp", schedule.length],
            ["Lớp trong tuần", new Set(schedule.map((x) => x.className)).size],
            ["Nhiệm vụ", tasks.length],
            ["Hoàn thành", `${tasks.length ? Math.round(done / tasks.length * 100) : 0}%`],
          ].map(([label, val]) => (
            <div key={label as string} className="rounded-xl bg-gradient-to-br from-royal to-[#2A3F7A] px-4 py-3 text-white">
              <div className="text-2xl font-extrabold">{val}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-white/70">{label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gold" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
            {/* LỊCH */}
            <div className="overflow-x-auto rounded-xl border border-silver/30">
              <div className="min-w-[900px]">
                {/* Header ngày */}
                <div className="grid" style={{ gridTemplateColumns: "150px repeat(7, 1fr)" }}>
                  <div className="border-b border-r border-silver/30 bg-cream px-2 py-2.5 text-xs font-bold uppercase text-muted">Ca / Phòng</div>
                  {DAYS.map((d, i) => (
                    <div key={d} className="border-b border-silver/30 bg-cream px-2 py-2.5 text-center">
                      <div className="text-sm font-bold text-royal">{d}</div>
                      <div className="text-xs text-muted">{fmt(addDays(week, i))}</div>
                    </div>
                  ))}
                </div>
                {/* Hàng: ca × phòng */}
                {SLOTS.map((slot) => ROOMS.map((room, ri) => (
                  <div key={slot.id + room} className="grid border-b border-silver/10" style={{ gridTemplateColumns: "150px repeat(7, 1fr)" }}>
                    <div className="border-r border-silver/30 bg-cream/40 px-2 py-2">
                      {ri === 0 && <div className="text-sm font-bold text-royal">{slot.name}</div>}
                      {ri === 0 && <div className="text-[11px] text-muted">{slot.time}</div>}
                      <div className="text-[11px] text-muted">{room}</div>
                    </div>
                    {DAYS.map((_, day) => {
                      const x = schedule.find((v) => v.dayIndex === day && v.slot === slot.id && v.room === room);
                      const people = x ? uniq([x.teacher, x.assistant, ...parseTags(x.tags)]) : [];
                      return (
                        <div key={day} className="border-r border-silver/10 p-1">
                          {x ? (
                            <div className="group relative rounded-lg border-l-4 bg-cream/40 p-1.5" style={{ borderColor: TONE_BG[toneIdx(x.teacher)] }}>
                              <button disabled={!isAdmin} onClick={() => isAdmin && setModal({ type: "schedule", item: x })} className="block w-full text-left">
                                <div className="text-sm font-bold text-[#1a1a2e]">{x.className}</div>
                                <div className="mt-1 flex flex-wrap gap-1">{people.slice(0, 3).map((n) => <PersonChip key={n} name={n} small />)}{people.length > 3 && <span className="text-[11px] text-muted">+{people.length - 3}</span>}</div>
                              </button>
                              {isAdmin && <button onClick={() => del("schedule", x.id)} className="absolute -right-1.5 -top-1.5 hidden rounded-full bg-red-500 p-0.5 text-white group-hover:block"><X size={12} /></button>}
                            </div>
                          ) : isAdmin ? (
                            <button onClick={() => setModal({ type: "schedule", day, slot: slot.id, room })}
                              className="flex h-full min-h-[44px] w-full items-center justify-center rounded-lg border border-dashed border-silver/40 text-xs text-muted hover:border-gold/50 hover:bg-gold/5"><Plus size={13} /></button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )))}
              </div>
            </div>

            {/* NHIỆM VỤ */}
            <div className="rounded-xl border border-silver/30 bg-white p-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-muted">Nhiệm vụ tuần</div>
                  <div className="text-lg font-bold text-royal">Công việc đội ngũ</div>
                  <div className="text-xs text-muted">{tasks.filter((x) => !x.completed).length} việc đang chờ</div>
                </div>
                {isAdmin && <button onClick={() => setModal({ type: "task" })} className="btn-primary text-sm"><Plus size={15} />Thêm</button>}
              </div>
              <div className="space-y-2">
                {tasks.length === 0 ? <div className="py-8 text-center text-sm text-muted">Chưa có nhiệm vụ.</div> :
                  [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed) || a.deadline.localeCompare(b.deadline)).map((t) => (
                    <div key={t.id} className={`rounded-lg border p-2.5 ${t.completed ? "border-silver/20 bg-cream/30 opacity-60" : "border-silver/30 bg-white"}`}>
                      <div className="flex items-start gap-2">
                        <button disabled={!isAdmin} onClick={() => toggle(t)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${t.completed ? "border-green-600 bg-green-600 text-white" : "border-silver/50"}`}>
                          {t.completed && <Check size={13} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-bold text-[#1a1a2e] ${t.completed ? "line-through" : ""}`}>{t.title}</div>
                          {t.note && <div className="text-xs text-muted">{t.note}</div>}
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {uniq([t.owner, ...parseTags(t.tags)]).map((n) => <PersonChip key={n} name={n} small />)}
                            <span className={`ml-auto text-[11px] font-semibold ${t.deadline < isoLocal() && !t.completed ? "text-red-600" : "text-muted"}`}>DL {fmt(t.deadline)}</span>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex shrink-0 flex-col gap-1">
                            <button onClick={() => setModal({ type: "task", item: t })} className="rounded p-1 text-xs text-muted hover:text-royal">Sửa</button>
                            <button onClick={() => del("task", t.id)} className="rounded p-1 text-muted hover:text-red-600"><Trash2 size={13} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {modal && isAdmin && <Editor modal={modal} week={week} close={() => setModal(null)} saved={() => { setModal(null); load(); notify("Đã lưu"); }} notify={notify} />}
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-royal px-5 py-2.5 text-sm font-semibold text-white shadow-xl">{toast}</div>}
    </div>
  );
}

// ───────── Editor modal: xếp lớp / giao nhiệm vụ ─────────
function Editor({ modal, week, close, saved, notify }: { modal: any; week: string; close: () => void; saved: () => void; notify: (m: string) => void }) {
  const isS = modal.type === "schedule";
  const old = modal.item ?? {};
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<any>(isS
    ? { weekStart: week, dayIndices: [modal.day ?? old.dayIndex ?? 0], slot: modal.slot ?? old.slot ?? "morning", room: modal.room ?? old.room ?? ROOMS[0], className: old.className ?? "", teacher: old.teacher ?? GV[0], assistant: old.assistant ?? "", tags: parseTags(old.tags), note: old.note ?? "" }
    : { weekStart: week, title: old.title ?? "", owner: old.owner ?? STAFF_PEOPLE[0], tags: parseTags(old.tags), deadline: old.deadline ?? week, note: old.note ?? "", completed: old.completed ?? false });
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const toggleDay = (i: number) => set("dayIndices", f.dayIndices.includes(i) ? f.dayIndices.filter((x: number) => x !== i) : [...f.dayIndices, i].sort());
  const toggleTag = (name: string) => set("tags", f.tags.includes(name) ? f.tags.filter((x: string) => x !== name) : [...f.tags, name]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isS && !f.dayIndices.length) return setError("Chọn ít nhất một ngày");
    setSaving(true); setError("");
    const body = isS ? { ...f, dayIndex: f.dayIndices[0], dayIndices: old.id ? undefined : f.dayIndices } : { ...f };
    const payload = { type: modal.type, id: old.id, ...body };
    const res = old.id ? await api.patch(`/planner`, payload) : await api.post(`/planner`, payload);
    setSaving(false);
    if (!res.success) return setError(res.message || "Không lưu được");
    saved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{old.id ? "Chỉnh sửa" : "Thêm mới"}</p>
            <h2 className="font-display text-xl font-bold text-royal">{isS ? "Xếp lớp vào lịch" : "Giao nhiệm vụ tuần"}</h2>
          </div>
          <button type="button" onClick={close} className="text-muted hover:text-royal"><X size={20} /></button>
        </div>

        {isS ? (
          <>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-bold text-muted">Tên lớp / hoạt động</span>
              <input autoFocus value={f.className} onChange={(e) => set("className", e.target.value)} placeholder="VD: IELTS 6+ 0726" required className="input-field" />
            </label>
            <fieldset className="mb-3 rounded-lg border border-silver/30 p-3">
              <legend className="px-1 text-xs font-bold text-muted">{old.id ? "Ngày học (đang sửa 1 buổi)" : "Chọn ngày học"}</legend>
              {!old.id && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {DAY_PRESETS.map((p) => (
                    <button type="button" key={p.label} onClick={() => set("dayIndices", p.days)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${p.days.length === f.dayIndices.length && p.days.every((x) => f.dayIndices.includes(x)) ? "bg-royal text-white" : "bg-cream text-muted hover:bg-cream-dark"}`}>{p.label}</button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                {DAYS.map((d, i) => (
                  <label key={d} className={`cursor-pointer rounded-lg border px-1 py-1.5 text-center ${f.dayIndices.includes(i) ? "border-royal bg-royal/10" : "border-silver/30"} ${old.id && !f.dayIndices.includes(i) ? "opacity-40" : ""}`}>
                    <input type="checkbox" checked={f.dayIndices.includes(i)} onChange={() => !old.id ? toggleDay(i) : set("dayIndices", [i])} className="hidden" />
                    <div className="text-xs font-bold text-royal">{d.replace("Thứ ", "T").replace("Chủ nhật", "CN")}</div>
                    <div className="text-[10px] text-muted">{fmt(addDays(week, i))}</div>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label><span className="mb-1 block text-xs font-bold text-muted">Ca</span>
                <select value={f.slot} onChange={(e) => set("slot", e.target.value)} className="input-field">{SLOTS.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.time}</option>)}</select></label>
              <label><span className="mb-1 block text-xs font-bold text-muted">Phòng</span>
                <select value={f.room} onChange={(e) => set("room", e.target.value)} className="input-field">{ROOMS.map((x) => <option key={x}>{x}</option>)}</select></label>
              <label><span className="mb-1 block text-xs font-bold text-muted">Giáo viên chính</span>
                <input list="gv-opts" value={f.teacher} onChange={(e) => set("teacher", e.target.value)} placeholder="Chọn hoặc gõ tên" required className="input-field" />
                <datalist id="gv-opts">{GV.map((x) => <option key={x} value={x} />)}</datalist></label>
              <label><span className="mb-1 block text-xs font-bold text-muted">Trợ giảng</span>
                <input list="ta-opts" value={f.assistant} onChange={(e) => set("assistant", e.target.value)} placeholder="Không có / gõ tên" className="input-field" />
                <datalist id="ta-opts">{TA.map((x) => <option key={x} value={x} />)}</datalist></label>
            </div>
          </>
        ) : (
          <>
            <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-muted">Nhiệm vụ</span>
              <input autoFocus value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="VD: Report lớp 5+ và 6+" required className="input-field" /></label>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label><span className="mb-1 block text-xs font-bold text-muted">Người phụ trách</span>
                <input list="staff-opts" value={f.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Chọn hoặc gõ tên" required className="input-field" />
                <datalist id="staff-opts">{STAFF_PEOPLE.map((x) => <option key={x} value={x} />)}</datalist></label>
              <label><span className="mb-1 block text-xs font-bold text-muted">Deadline</span>
                <input type="date" value={f.deadline} onChange={(e) => set("deadline", e.target.value)} required className="input-field" /></label>
            </div>
          </>
        )}

        {/* Tag người (chung cho cả 2) */}
        <fieldset className="mb-3 rounded-lg border border-silver/30 p-3">
          <legend className="px-1 text-xs font-bold text-muted">Tag thêm nhân sự</legend>
          <div className="flex flex-wrap gap-1.5">
            {STAFF_PEOPLE.map((name) => (
              <button type="button" key={name} onClick={() => toggleTag(name)}
                style={f.tags.includes(name) ? { background: TONE_BG[toneIdx(name)] } : {}}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${f.tags.includes(name) ? "text-white" : "bg-cream text-muted hover:bg-cream-dark"}`}>{name}</button>
            ))}
          </div>
        </fieldset>

        <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-muted">Ghi chú</span>
          <textarea value={f.note} onChange={(e) => set("note", e.target.value)} rows={2} placeholder="Lưu ý..." className="input-field" /></label>

        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={close} className="btn-secondary">Huỷ</button>
          <button className="btn-primary" disabled={saving}>{saving ? "Đang lưu..." : old.id ? "Lưu thay đổi" : isS && f.dayIndices.length > 1 ? `Thêm ${f.dayIndices.length} buổi` : "Thêm"}</button>
        </div>
      </form>
    </div>
  );
}