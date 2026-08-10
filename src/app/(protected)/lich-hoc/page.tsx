// FILE: src/app/(protected)/lich-hoc/page.tsx — Trình quản lý Lịch làm bài cả năm (3a: xem)
"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, ExternalLink, CalendarDays } from "lucide-react";
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

export default function LichHocPage() {
  const [data, setData] = useState<CalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lv, setLv] = useState("");
  const [clsId, setClsId] = useState("");

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
      } else setData(null);
    } catch { setData(null); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const levels = useMemo(() => (data ? Object.keys(data) : []), [data]);
  const classes = useMemo(() => ((data && lv ? data[lv] : []) || []), [data, lv]);
  const cls = useMemo(() => classes.find((c) => c.id === clsId) || null, [classes, clsId]);

  function pickLv(l: string) { setLv(l); setClsId(data?.[l]?.[0]?.id || ""); }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-gold" size={28} /></div>;

  if (!data) return (
    <div className="mx-auto max-w-[900px] py-24 text-center">
      <p className="text-muted">Chưa có dữ liệu lịch làm bài.</p>
      <button onClick={load} className="btn-secondary mt-4"><RefreshCw size={14} />Tải lại</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal flex items-center gap-2"><CalendarDays size={22} />Lịch làm bài cả năm</h2>
          <p className="mt-1 text-sm text-muted">{levels.length} trình độ · {Object.values(data).reduce((a, c) => a + c.length, 0)} lớp</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw size={14} />Tải lại</button>
          <a href="https://vestaedu.online/lich-lam-bai" target="_blank" rel="noopener noreferrer" className="btn-secondary"><ExternalLink size={14} />Xem trang HV</a>
        </div>
      </div>

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
                {wk.d.map((day) => (
                  <div key={day.d} className="rounded-lg border border-silver/20 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1a1a2e]">{Number(day.d.split("-")[2])}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[0.6rem] font-bold ${dowColor[day.w] || ""}`}>{day.w}</span>
                    </div>
                    <div className="mt-1 min-h-[2.2rem]">
                      <div className="text-[0.8rem] font-semibold text-royal">{day.h || "—"}</div>
                      {day.l && <a href={day.l} target="_blank" rel="noopener noreferrer" className="mt-0.5 block truncate text-[0.65rem] text-blue-600 hover:underline" title={day.l}>🔗 link</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
