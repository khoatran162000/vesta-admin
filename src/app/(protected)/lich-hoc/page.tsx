// FILE: src/app/(protected)/lich-hoc/page.tsx — Trình quản lý Lịch làm bài cả năm (3b: sửa nhãn + link)
"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, ExternalLink, CalendarDays, Save, X, Pencil } from "lucide-react";
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

type EditTarget = { wi: number; date: string; w: string; h: string; l: string } | null;

export default function LichHocPage() {
  const [data, setData] = useState<CalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lv, setLv] = useState("");
  const [clsId, setClsId] = useState("");
  const [edit, setEdit] = useState<EditTarget>(null);
  const [dirty, setDirty] = useState(false);
  const [editedKeys, setEditedKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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

  function pickLv(l: string) { setLv(l); setClsId(data?.[l]?.[0]?.id || ""); }

  function keyOf(wi: number, date: string) { return `${lv}|${clsId}|${wi}|${date}`; }

  function applyEdit() {
    if (!edit || !data) return;
    const newH = edit.h.trim();
    const newL = edit.l.trim();
    setData((prev) => {
      if (!prev) return prev;
      const copy: CalData = { ...prev };
      copy[lv] = copy[lv].map((c) => {
        if (c.id !== clsId) return c;
        return {
          ...c,
          w: c.w.map((wk) => {
            if (wk.i !== edit.wi) return wk;
            return {
              ...wk,
              d: wk.d.map((dd) =>
                dd.d === edit.date ? { ...dd, h: newH || undefined, l: newL || undefined } : dd
              ),
            };
          }),
        };
      });
      return copy;
    });
    setEditedKeys((prev) => new Set(prev).add(keyOf(edit.wi, edit.date)));
    setDirty(true);
    setEdit(null);
  }

  async function saveAll() {
    if (!data) return;
    setSaving(true); setMsg("");
    try {
      const res = await api.put("/site-content/calendar_all", {
        label: "Lịch làm bài cả năm",
        data: JSON.stringify(data),
      });
      if (res?.success) {
        setDirty(false); setEditedKeys(new Set());
        setMsg("Đã lưu thành công. Học viên sẽ thấy thay đổi ngay.");
      } else {
        setMsg("Lỗi lưu: " + (res?.message || "không rõ"));
      }
    } catch (e: any) {
      setMsg("Lỗi lưu: " + (e?.message || "kết nối"));
    }
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
          <p className="mt-1 text-sm text-muted">{levels.length} trình độ · {Object.values(data).reduce((a, c) => a + c.length, 0)} lớp · Bấm ô ngày để sửa nhãn bài + link</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw size={14} />Tải lại</button>
          <a href="https://vestaedu.online/lich-lam-bai" target="_blank" rel="noopener noreferrer" className="btn-secondary"><ExternalLink size={14} />Xem trang HV</a>
        </div>
      </div>

      {msg && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</div>}

      <div className="mb-3 flex flex-wrap gap-2">
        {levels.map((l) => (
          <button key={l} onClick={() => pickLv(l)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold border-2 transition ${l === lv ? "bg-royal text-white border-royal" : "border-silver/40 text-muted hover:border-gold"}`}>
            IELTS {l}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {classes.map((c) => (
          <button key={c.id} onClick={() => setClsId(c.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition text-left ${c.id === clsId ? "bg-royal text-white border-royal" : "bg-white border-silver/30 text-muted hover:border-gold"}`}>
            <div>{c.id}</div><div className="text-[0.65rem] opacity-80">{c.r}</div>
          </button>
        ))}
      </div>

      {cls && (
        <div className="space-y-4">
          {cls.w.map((wk) => (
            <div key={wk.i} className="rounded-xl border border-silver/30 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded bg-gold/12 px-2 py-0.5 text-[0.7rem] font-bold text-gold-dark">{wk.i < 0 ? "PRE" : "TUẦN " + (wk.i + 1)}</span>
                <span className="font-display font-semibold text-royal">{wk.i < 0 ? "Trước KG" : "Unit " + wk.u}</span>
                {wk.d[0] && <span className="ml-auto text-xs text-muted">{fdShort(wk.d[0].d)} – {fdShort(wk.d[wk.d.length - 1].d)}</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {wk.d.map((day) => {
                  const isEdited = editedKeys.has(keyOf(wk.i, day.d));
                  return (
                    <button key={day.d} type="button"
                      onClick={() => setEdit({ wi: wk.i, date: day.d, w: day.w, h: day.h || "", l: day.l || "" })}
                      className={`group rounded-lg border p-2 text-left transition hover:border-gold hover:shadow ${isEdited ? "border-gold bg-gold/5" : "border-silver/20"}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#1a1a2e]">{Number(day.d.split("-")[2])}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[0.6rem] font-bold ${dowColor[day.w] || ""}`}>{day.w}</span>
                      </div>
                      <div className="mt-1 min-h-[2.4rem]">
                        <div className="text-[0.8rem] font-semibold text-royal">{day.h || "—"}</div>
                        {day.l && <div className="mt-0.5 truncate text-[0.65rem] text-blue-600" title={day.l}>🔗 có link</div>}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[0.6rem] text-muted opacity-0 transition group-hover:opacity-100"><Pencil size={10} />Sửa</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Popup sửa ngày */}
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4" onClick={(e) => { if (e.target === e.currentTarget) setEdit(null); }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-royal">Sửa ngày {fdShort(edit.date)} · {edit.w}</h3>
              <button onClick={() => setEdit(null)} className="text-muted hover:text-royal"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Nhãn bài (VD: 1A, Quizlet tuần mới)</label>
                <input type="text" value={edit.h} onChange={(e) => setEdit({ ...edit, h: e.target.value })}
                  placeholder="Để trống nếu ngày nghỉ" className="input-field" autoFocus />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Link bài tập (learnclick/quizlet...)</label>
                <input type="text" value={edit.l} onChange={(e) => setEdit({ ...edit, l: e.target.value })}
                  placeholder="https://... (để trống nếu không có)" className="input-field" />
              </div>
              <p className="text-[0.7rem] text-muted">Bấm "Áp dụng" để ghi nhận, rồi "Lưu tất cả" ở góc dưới để lưu vĩnh viễn.</p>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button onClick={() => setEdit(null)} className="btn-secondary">Huỷ</button>
              <button onClick={applyEdit} className="btn-primary"><Pencil size={14} />Áp dụng</button>
            </div>
          </div>
        </div>
      )}

      {/* Thanh Lưu nổi */}
      {dirty && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-2xl border border-gold">
          <span className="text-sm font-semibold text-royal">Có thay đổi chưa lưu</span>
          <button onClick={saveAll} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Lưu tất cả
          </button>
        </div>
      )}
    </div>
  );
}
