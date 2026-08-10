// FILE: src/app/(protected)/lich-hoc/page.tsx — Quản lý Lịch làm bài cả năm (3b sửa ngày + 3c cấu trúc)
"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, ExternalLink, CalendarDays, Save, X, Pencil, Plus, Trash2, Settings2, CalendarPlus } from "lucide-react";
import { api } from "@/lib/api";

type Day = { d: string; w: string; h?: string; l?: string };
type Week = { i: number; u: number; d: Day[] };
type Cls = { id: string; kg: string; r: string; w: Week[] };
type CalData = Record<string, Cls[]>;

const dowColor: Record<string, string> = {
  T2: "bg-red-50 text-red-600", T3: "bg-orange-50 text-orange-600", T4: "bg-green-50 text-green-700",
  T5: "bg-blue-50 text-blue-700", T6: "bg-purple-50 text-purple-700", T7: "bg-teal-50 text-teal-700", CN: "bg-pink-50 text-pink-700",
};
const fdShort = (s: string) => { const p = s.split("-"); return p[2] + "/" + p[1]; };

// ── Date helpers (UTC, tránh lệch múi giờ) ──
function isoToUTC(iso: string) { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); }
function utcToIso(ms: number) { const dt = new Date(ms); const y = dt.getUTCFullYear(); const m = String(dt.getUTCMonth() + 1).padStart(2, "0"); const d = String(dt.getUTCDate()).padStart(2, "0"); return y + "-" + m + "-" + d; }
function shiftIso(iso: string, days: number) { return utcToIso(isoToUTC(iso) + days * 86400000); }
function weekdayVi(iso: string) { const wd = new Date(isoToUTC(iso)).getUTCDay(); return ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][wd]; }
function daysBetween(a: string, b: string) { return Math.round((isoToUTC(a) - isoToUTC(b)) / 86400000); }
function rangeStr(w: Week[]) {
  if (!w.length) return "";
  const kgWeek = w.find((x) => x.i === 0) || w[0];
  const first = kgWeek.d[0]?.d;
  const lastWk = w[w.length - 1];
  const last = lastWk.d[lastWk.d.length - 1]?.d;
  return first && last ? fdShort(first) + " – " + fdShort(last) : "";
}
function shiftAllDays(w: Week[], delta: number): Week[] {
  return w.map((wk) => ({ ...wk, d: wk.d.map((dd) => { const nd = shiftIso(dd.d, delta); return { ...dd, d: nd, w: weekdayVi(nd) }; }) }));
}
function makeWeek(startIso: string, i: number, u: number): Week {
  const d: Day[] = [];
  for (let k = 0; k < 7; k++) { const nd = shiftIso(startIso, k); d.push({ d: nd, w: weekdayVi(nd), h: "", l: "" }); }
  return { i, u, d };
}
function nextWeek(cls: Cls): Week {
  if (!cls.w.length) return makeWeek(cls.kg, 0, 1);
  const last = cls.w[cls.w.length - 1];
  const lastDay = last.d[last.d.length - 1].d;
  return makeWeek(shiftIso(lastDay, 1), last.i + 1, last.u + 1);
}

type DayEdit = { wi: number; date: string; w: string; h: string; l: string } | null;
type ClsForm = { mode: "add" | "edit"; level: string; srcId: string; id: string; kg: string; shift: boolean } | null;

export default function LichHocPage() {
  const [data, setData] = useState<CalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lv, setLv] = useState("");
  const [clsId, setClsId] = useState("");
  const [edit, setEdit] = useState<DayEdit>(null);
  const [dirty, setDirty] = useState(false);
  const [editedKeys, setEditedKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [structEdit, setStructEdit] = useState(false);
  const [clsForm, setClsForm] = useState<ClsForm>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/site-content/calendar_all");
      const d = res?.data?.data;
      if (d && Object.keys(d).length) {
        setData(d);
        const startLv = Object.keys(d).includes("6+") ? "6+" : Object.keys(d)[0];
        setLv(startLv);
        setClsId(d[startLv]?.[0]?.id || "");
        setDirty(false); setEditedKeys(new Set()); setMsg("");
      } else setData(null);
    } catch { setData(null); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const levels = useMemo(() => (data ? Object.keys(data) : []), [data]);
  const classes = useMemo(() => ((data && lv ? data[lv] : []) || []), [data, lv]);
  const cls = useMemo(() => classes.find((c) => c.id === clsId) || null, [classes, clsId]);
  const allClasses = useMemo(() => {
    if (!data) return [] as { level: string; c: Cls }[];
    const out: { level: string; c: Cls }[] = [];
    for (const l of Object.keys(data)) for (const c of data[l]) out.push({ level: l, c });
    return out;
  }, [data]);

  function pickLv(l: string) { setLv(l); setClsId(data?.[l]?.[0]?.id || ""); }
  function keyOf(wi: number, date: string) { return lv + "|" + clsId + "|" + wi + "|" + date; }

  // ── Sửa nhãn + link 1 ngày (3b) ──
  function applyEdit() {
    if (!edit || !data) return;
    const newH = edit.h.trim(); const newL = edit.l.trim();
    setData((prev) => {
      if (!prev) return prev;
      const copy: CalData = { ...prev };
      copy[lv] = copy[lv].map((c) => c.id !== clsId ? c : {
        ...c, w: c.w.map((wk) => wk.i !== edit.wi ? wk : {
          ...wk, d: wk.d.map((dd) => dd.d === edit.date ? { ...dd, h: newH || undefined, l: newL || undefined } : dd),
        }),
      });
      return copy;
    });
    setEditedKeys((prev) => new Set(prev).add(keyOf(edit.wi, edit.date)));
    setDirty(true); setEdit(null);
  }

  // ── 3c: thêm/sửa lớp ──
  function submitClsForm() {
    if (!clsForm || !data) return;
    const f = clsForm;
    const id = f.id.trim();
    if (!id) { alert("Nhập mã lớp."); return; }
    if (!f.kg) { alert("Chọn ngày khai giảng."); return; }

    setData((prev) => {
      if (!prev) return prev;
      const copy: CalData = {};
      for (const k of Object.keys(prev)) copy[k] = prev[k].map((c) => ({ ...c }));

      if (f.mode === "add") {
        // trùng mã?
        if (Object.values(copy).some((arr) => arr.some((c) => c.id === id))) { alert("Mã lớp đã tồn tại."); return prev; }
        let newCls: Cls;
        if (f.srcId) {
          const src = allClasses.find((x) => x.c.id === f.srcId)?.c;
          if (!src) { alert("Không thấy lớp mẫu."); return prev; }
          const delta = daysBetween(f.kg, src.kg);
          const w = shiftAllDays(src.w, delta);
          newCls = { id, kg: f.kg, r: rangeStr(w), w };
        } else {
          newCls = { id, kg: f.kg, r: "", w: [] };
        }
        if (!copy[f.level]) copy[f.level] = [];
        copy[f.level].push(newCls);
      } else {
        // edit: tìm lớp hiện tại
        for (const k of Object.keys(copy)) {
          copy[k] = copy[k].map((c) => {
            if (c.id !== clsId) return c;
            let w = c.w;
            let kg = f.kg;
            if (f.shift && f.kg !== c.kg) { const delta = daysBetween(f.kg, c.kg); w = shiftAllDays(c.w, delta); }
            return { ...c, id, kg, w, r: rangeStr(w) };
          });
        }
      }
      return copy;
    });

    if (f.mode === "add") { setLv(f.level); setClsId(id); }
    else { setClsId(id); }
    setDirty(true); setClsForm(null);
  }

  function deleteClass() {
    if (!data || !cls) return;
    if (!confirm('Xoá lớp "' + cls.id + '"? Toàn bộ lịch của lớp này sẽ mất.')) return;
    setData((prev) => {
      if (!prev) return prev;
      const copy: CalData = {};
      for (const k of Object.keys(prev)) {
        const arr = prev[k].filter((c) => c.id !== cls.id);
        if (arr.length) copy[k] = arr; // bỏ level rỗng
      }
      return copy;
    });
    setDirty(true);
    // chọn lại lớp khác
    setTimeout(() => {
      const remaining = data[lv]?.filter((c) => c.id !== cls.id) || [];
      if (remaining.length) setClsId(remaining[0].id);
      else { const firstLv = Object.keys(data).find((l) => l !== lv && data[l].length); if (firstLv) { setLv(firstLv); setClsId(data[firstLv][0].id); } }
    }, 0);
  }

  // ── 3c: thêm/xoá tuần ──
  function addWeek() {
    if (!data || !cls) return;
    setData((prev) => {
      if (!prev) return prev;
      const copy: CalData = { ...prev };
      copy[lv] = copy[lv].map((c) => c.id !== clsId ? c : { ...c, w: [...c.w, nextWeek(c)], r: rangeStr([...c.w, nextWeek(c)]) });
      return copy;
    });
    setDirty(true);
  }
  function deleteWeek(wi: number) {
    if (!data || !cls) return;
    if (!confirm("Xoá tuần này (7 ngày)?")) return;
    setData((prev) => {
      if (!prev) return prev;
      const copy: CalData = { ...prev };
      copy[lv] = copy[lv].map((c) => { if (c.id !== clsId) return c; const w = c.w.filter((x) => x.i !== wi); return { ...c, w, r: rangeStr(w) }; });
      return copy;
    });
    setDirty(true);
  }
  function setUnit(wi: number, u: number) {
    setData((prev) => {
      if (!prev) return prev;
      const copy: CalData = { ...prev };
      copy[lv] = copy[lv].map((c) => c.id !== clsId ? c : { ...c, w: c.w.map((x) => x.i === wi ? { ...x, u } : x) });
      return copy;
    });
    setDirty(true);
  }

  async function saveAll() {
    if (!data) return;
    setSaving(true); setMsg("");
    try {
      const res = await api.put("/site-content/calendar_all", { label: "Lịch làm bài cả năm", data: JSON.stringify(data) });
      if (res?.success) { setDirty(false); setEditedKeys(new Set()); setMsg("Đã lưu thành công. Học viên sẽ thấy thay đổi ngay."); }
      else setMsg("Lỗi lưu: " + (res?.message || "không rõ"));
    } catch (e: any) { setMsg("Lỗi lưu: " + (e?.message || "kết nối")); }
    setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-gold" size={28} /></div>;
  if (!data) return (
    <div className="mx-auto max-w-[900px] py-24 text-center">
      <p className="text-muted">Chưa có dữ liệu lịch làm bài.</p>
      <button onClick={load} className="btn-secondary mt-4"><RefreshCw size={14} />Tải lại</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1200px] pb-24">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal flex items-center gap-2"><CalendarDays size={22} />Lịch làm bài cả năm</h2>
          <p className="mt-1 text-sm text-muted">{levels.length} trình độ · {Object.values(data).reduce((a, c) => a + c.length, 0)} lớp · Bấm ô ngày để sửa nhãn + link</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStructEdit((v) => !v)} className={structEdit ? "btn-primary" : "btn-secondary"}><Settings2 size={14} />Chỉnh cấu trúc {structEdit ? ": BẬT" : ""}</button>
          <button onClick={load} className="btn-secondary"><RefreshCw size={14} />Tải lại</button>
          <a href="https://vestaedu.online/lich-lam-bai" target="_blank" rel="noopener noreferrer" className="btn-secondary"><ExternalLink size={14} />Xem trang HV</a>
        </div>
      </div>

      {msg && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</div>}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {levels.map((l) => (
          <button key={l} onClick={() => pickLv(l)} className={`rounded-full px-4 py-1.5 text-sm font-bold border-2 transition ${l === lv ? "bg-royal text-white border-royal" : "border-silver/40 text-muted hover:border-gold"}`}>IELTS {l}</button>
        ))}
        {structEdit && (
          <button onClick={() => setClsForm({ mode: "add", level: lv || levels[0] || "6+", srcId: classes[0]?.id || "", id: "", kg: "", shift: true })}
            className="rounded-full px-4 py-1.5 text-sm font-bold border-2 border-green-500 text-green-600 hover:bg-green-50"><Plus size={14} className="inline" /> Thêm lớp</button>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {classes.map((c) => (
          <button key={c.id} onClick={() => setClsId(c.id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition text-left ${c.id === clsId ? "bg-royal text-white border-royal" : "bg-white border-silver/30 text-muted hover:border-gold"}`}>
            <div>{c.id}</div><div className="text-[0.65rem] opacity-80">{c.r}</div>
          </button>
        ))}
      </div>

      {/* Thanh thao tác lớp (khi bật chỉnh cấu trúc) */}
      {structEdit && cls && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gold/40 bg-gold/5 px-4 py-2 text-sm">
          <span className="font-semibold text-royal">Lớp {cls.id}</span>
          <span className="text-muted">· Khai giảng {fdShort(cls.kg)} · {cls.w.length} tuần</span>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setClsForm({ mode: "edit", level: lv, srcId: "", id: cls.id, kg: cls.kg, shift: true })} className="btn-secondary"><Pencil size={13} />Sửa lớp</button>
            <button onClick={addWeek} className="btn-secondary"><CalendarPlus size={13} />Thêm tuần</button>
            <button onClick={deleteClass} className="rounded-lg border border-red-200 px-3 py-1.5 text-red-600 hover:bg-red-50"><Trash2 size={13} className="inline" /> Xoá lớp</button>
          </div>
        </div>
      )}

      {cls && (
        <div className="space-y-4">
          {cls.w.map((wk) => (
            <div key={wk.i} className="rounded-xl border border-silver/30 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded bg-gold/12 px-2 py-0.5 text-[0.7rem] font-bold text-gold-dark">{wk.i < 0 ? "PRE" : "TUẦN " + (wk.i + 1)}</span>
                {structEdit && wk.i >= 0 ? (
                  <span className="flex items-center gap-1 text-sm text-royal">Unit
                    <input type="number" value={wk.u} onChange={(e) => setUnit(wk.i, parseInt(e.target.value) || 0)} className="w-14 rounded border border-silver/40 px-1.5 py-0.5 text-sm" />
                  </span>
                ) : (
                  <span className="font-display font-semibold text-royal">{wk.i < 0 ? "Trước KG" : "Unit " + wk.u}</span>
                )}
                {wk.d[0] && <span className="ml-auto text-xs text-muted">{fdShort(wk.d[0].d)} – {fdShort(wk.d[wk.d.length - 1].d)}</span>}
                {structEdit && <button onClick={() => deleteWeek(wk.i)} className="rounded p-1 text-red-500 hover:bg-red-50" title="Xoá tuần"><Trash2 size={14} /></button>}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {wk.d.map((day) => {
                  const isEdited = editedKeys.has(keyOf(wk.i, day.d));
                  return (
                    <button key={day.d} type="button" onClick={() => setEdit({ wi: wk.i, date: day.d, w: day.w, h: day.h || "", l: day.l || "" })}
                      className={`group rounded-lg border p-2 text-left transition hover:border-gold hover:shadow ${isEdited ? "border-gold bg-gold/5" : "border-silver/20"}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#1a1a2e]">{Number(day.d.split("-")[2])}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[0.6rem] font-bold ${dowColor[day.w] || ""}`}>{day.w}</span>
                      </div>
                      <div className="mt-1 min-h-[2.4rem]">
                        <div className="text-[0.8rem] font-semibold text-royal">{day.h || "—"}</div>
                        {day.l && <div className="mt-0.5 truncate text-[0.65rem] text-blue-600" title={day.l}>🔗 có link</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {structEdit && (
            <button onClick={addWeek} className="w-full rounded-xl border-2 border-dashed border-gold/50 py-3 text-sm font-semibold text-gold-dark hover:bg-gold/5"><CalendarPlus size={15} className="inline" /> Thêm tuần vào cuối</button>
          )}
        </div>
      )}

      {/* Popup sửa ngày (3b) */}
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4" onClick={(e) => { if (e.target === e.currentTarget) setEdit(null); }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-royal">Sửa ngày {fdShort(edit.date)} · {edit.w}</h3>
              <button onClick={() => setEdit(null)} className="text-muted hover:text-royal"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs font-bold text-muted">Nhãn bài (VD: 1A, Quizlet tuần mới)</label>
                <input type="text" value={edit.h} onChange={(e) => setEdit({ ...edit, h: e.target.value })} placeholder="Để trống nếu ngày nghỉ" className="input-field" autoFocus /></div>
              <div><label className="mb-1 block text-xs font-bold text-muted">Link bài tập</label>
                <input type="text" value={edit.l} onChange={(e) => setEdit({ ...edit, l: e.target.value })} placeholder="https://... (để trống nếu không có)" className="input-field" /></div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button onClick={() => setEdit(null)} className="btn-secondary">Huỷ</button>
              <button onClick={applyEdit} className="btn-primary"><Pencil size={14} />Áp dụng</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup thêm/sửa lớp (3c) */}
      {clsForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4" onClick={(e) => { if (e.target === e.currentTarget) setClsForm(null); }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-royal">{clsForm.mode === "add" ? "Thêm lớp mới" : "Sửa thông tin lớp"}</h3>
              <button onClick={() => setClsForm(null)} className="text-muted hover:text-royal"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {clsForm.mode === "add" && (
                <>
                  <div><label className="mb-1 block text-xs font-bold text-muted">Cấp độ</label>
                    <select value={clsForm.level} onChange={(e) => setClsForm({ ...clsForm, level: e.target.value })} className="input-field">
                      {levels.map((l) => <option key={l} value={l}>IELTS {l}</option>)}
                    </select></div>
                  <div><label className="mb-1 block text-xs font-bold text-muted">Nhân bản từ lớp mẫu (giữ cấu trúc + nhãn bài, tự dời ngày)</label>
                    <select value={clsForm.srcId} onChange={(e) => setClsForm({ ...clsForm, srcId: e.target.value })} className="input-field">
                      <option value="">— Tạo lớp trống (tự thêm tuần sau) —</option>
                      {allClasses.map((x) => <option key={x.c.id} value={x.c.id}>{x.level} · {x.c.id} ({x.c.w.length} tuần)</option>)}
                    </select></div>
                </>
              )}
              <div><label className="mb-1 block text-xs font-bold text-muted">Mã lớp</label>
                <input type="text" value={clsForm.id} onChange={(e) => setClsForm({ ...clsForm, id: e.target.value })} placeholder="VD: 6C0826A" className="input-field" /></div>
              <div><label className="mb-1 block text-xs font-bold text-muted">Ngày khai giảng (nên chọn Thứ Hai)</label>
                <input type="date" value={clsForm.kg} onChange={(e) => setClsForm({ ...clsForm, kg: e.target.value })} className="input-field" /></div>
              {clsForm.mode === "edit" && (
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" checked={clsForm.shift} onChange={(e) => setClsForm({ ...clsForm, shift: e.target.checked })} />
                  Dời toàn bộ ngày theo khai giảng mới
                </label>
              )}
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button onClick={() => setClsForm(null)} className="btn-secondary">Huỷ</button>
              <button onClick={submitClsForm} className="btn-primary"><Save size={14} />{clsForm.mode === "add" ? "Tạo lớp" : "Lưu"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Thanh Lưu nổi */}
      {dirty && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-2xl border border-gold">
          <span className="text-sm font-semibold text-royal">Có thay đổi chưa lưu</span>
          <button onClick={saveAll} disabled={saving} className="btn-primary">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Lưu tất cả</button>
        </div>
      )}
    </div>
  );
}
