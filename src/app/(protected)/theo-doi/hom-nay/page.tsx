"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, ChevronLeft, ChevronRight, CalendarDays, FileText, GraduationCap } from "lucide-react";
import { api } from "@/lib/api";

type Item = { kind: "BAI_TAP" | "DE_THI"; title: string; score: number | null; maxScore: number | null; graded: boolean; time: string };
type Stu = { studentId: string; fullName: string; studentCode: string | null; items: Item[] };
type Cls = { classId: string; className: string; course: string | null; students: Stu[] };
type Summary = { date: string; label: string; stats: { students: number; attempts: number; baiTap: number; deThi: number; avgScore: number | null }; classes: Cls[] };

function todayVN(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}
function shiftDate(d: string, days: number): string {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd) + days * 86400000).toISOString().slice(0, 10);
}
function fmtTime(iso: string): string {
  const t = new Date(new Date(iso).getTime() + 7 * 3600 * 1000);
  return `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
}
function scoreText(it: Item): string {
  if (it.score == null) return "—";
  const s = Number.isInteger(it.score) ? it.score : Math.round(it.score * 10) / 10;
  const base = it.maxScore ? `${s}/${it.maxScore}` : `${s}`;
  return it.graded ? base : `${base} (ôn tập)`;
}

export default function DailySummaryPage() {
  const [date, setDate] = useState(todayVN());
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/notifications/admin/daily-summary?date=${date}`);
      setData(res.success ? res.data : null);
    } catch { setData(null); } finally { setLoading(false); }
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isToday = date === todayVN();

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">Tóm tắt hôm nay</h2>
          <p className="text-sm text-muted">Trong ngày, bạn nào đã làm bài gì và được mấy điểm</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDate((d) => shiftDate(d, -1))} className="btn-secondary !px-2" title="Ngày trước"><ChevronLeft size={16} /></button>
          <div className="relative">
            <CalendarDays size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input type="date" value={date} max={todayVN()} onChange={(e) => setDate(e.target.value || todayVN())} className="input-field !w-auto pl-8" />
          </div>
          <button onClick={() => setDate((d) => shiftDate(d, 1))} disabled={isToday} className="btn-secondary !px-2 disabled:opacity-40" title="Ngày sau"><ChevronRight size={16} /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gold" /></div>
      ) : !data ? (
        <div className="card text-center text-sm text-muted">Không tải được dữ liệu.</div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card !p-4"><div className="text-xs text-muted">Học sinh làm bài</div><div className="mt-1 text-2xl font-bold text-royal">{data.stats.students}</div></div>
            <div className="card !p-4"><div className="text-xs text-muted">Tổng lượt</div><div className="mt-1 text-2xl font-bold text-royal">{data.stats.attempts}</div></div>
            <div className="card !p-4"><div className="text-xs text-muted">Bài tập / Đề thi</div><div className="mt-1 text-2xl font-bold text-royal">{data.stats.baiTap}/{data.stats.deThi}</div></div>
            <div className="card !p-4"><div className="text-xs text-muted">Điểm trung bình</div><div className="mt-1 text-2xl font-bold text-royal">{data.stats.avgScore != null ? `${data.stats.avgScore}/10` : "—"}</div></div>
          </div>

          {data.classes.length === 0 ? (
            <div className="card text-center text-sm text-muted">Ngày {data.label}: chưa có học sinh nào làm bài.</div>
          ) : (
            <div className="space-y-4">
              {data.classes.map((c) => (
                <div key={c.classId} className="card !p-0 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-silver/20 bg-cream px-5 py-3">
                    <div className="font-semibold text-royal">{c.className}{c.course ? <span className="ml-2 text-xs font-normal text-muted">({c.course})</span> : null}</div>
                    <div className="text-xs text-muted">{c.students.length} học sinh</div>
                  </div>
                  <div className="divide-y divide-silver/10">
                    {c.students.map((s) => (
                      <div key={c.classId + s.studentId} className="px-5 py-3">
                        <div className="mb-1.5 flex items-center justify-between">
                          <Link href={`/theo-doi/${s.studentId}`} className="font-medium text-[#1a1a2e] hover:text-royal hover:underline">
                            {s.fullName}{s.studentCode ? <span className="ml-2 text-xs text-muted">{s.studentCode}</span> : null}
                          </Link>
                          <span className="text-xs text-muted">{s.items.length} bài</span>
                        </div>
                        <ul className="space-y-1">
                          {s.items.map((it, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              {it.kind === "DE_THI" ? <GraduationCap size={13} className="shrink-0 text-royal/60" /> : <FileText size={13} className="shrink-0 text-royal/60" />}
                              <span className="flex-1 text-[#333]">{it.title}</span>
                              <span className="text-xs text-muted">{fmtTime(it.time)}</span>
                              <span className={`min-w-[54px] text-right text-sm font-semibold ${it.graded ? "text-royal" : "text-muted"}`}>{scoreText(it)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
