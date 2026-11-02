// FILE: src/app/(protected)/bai-tap/[id]/thong-ke/page.tsx — Thống kê lượt làm cả lớp
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Users, Target, BarChart3, Eye, X } from "lucide-react";
import { api } from "@/lib/api";

// Lấy đáp án đúng cho hiển thị: bài gap trả `correctAnswers` (mảng), MC/matching trả `correctAnswer` (string)
function correctText(d: any): string {
  if (Array.isArray(d?.correctAnswers) && d.correctAnswers.length > 0) return d.correctAnswers.join(" / ");
  if (d?.correctAnswer !== undefined && d?.correctAnswer !== null && d.correctAnswer !== "") return String(d.correctAnswer);
  return "";
}

const TOKEN_RE = /\[\[gap:([^\]]+)\]\]/g;
function looksLikeHtml(s: string) { return /<[a-z][\s\S]*>/i.test(s || ""); }
function escHtml(s: string) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function normAns(s: any) { return String(s ?? "").trim().toLowerCase(); }
// Dung lai noi dung bai, thay [[gap:N]] bang dap an cua HV (xanh dung / do sai; sai thi kem dap an dung)
function buildStudentHtml(content: string, gaps: Record<string, any>, answers: Record<string, any>): string {
  const base = looksLikeHtml(content) ? content : escHtml(content);
  return base.replace(TOKEN_RE, (_m, id) => {
    const g = gaps[String(id)] || {};
    const accepted: string[] = Array.isArray(g.answers) ? g.answers : [];
    const ans = answers?.[String(id)];
    const has = ans !== undefined && ans !== null && String(ans).trim() !== "";
    const okGap = has && accepted.some((a) => normAns(a) === normAns(ans));
    const shown = has ? escHtml(String(ans)) : "(trống)";
    const col = okGap ? "#166534" : "#b91c1c";
    const bg = okGap ? "#dcfce7" : "#fee2e2";
    const bd = okGap ? "#22c55e" : "#ef4444";
    const key = !okGap && accepted.length ? `<span style="color:#166534;font-weight:600;font-size:.8em;margin-left:4px">(✓ ${escHtml(accepted.join(" / "))})</span>` : "";
    return `<span style="display:inline-block;min-width:54px;text-align:center;padding:1px 8px;margin:0 2px;border:1.5px solid ${bd};border-radius:6px;background:${bg};color:${col};font-weight:700">${shown}</span>${key}`;
  });
}

export default function ExerciseStatsPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const res = await api.get(`/interactive/${id}/attempts`);
      if (res.success) setData(res.data);
      setLoading(false);
    })();
  }, [id]);
  function scoreColor(s: number | null) {
    if (s === null) return "text-gray-400";
    if (s >= 80) return "text-green-600";
    if (s >= 50) return "text-amber-600";
    return "text-red-600";
  }
  function fmtDate(d: string) {
    return new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }
  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gold" /></div>;
  if (!data) return <div className="py-20 text-center text-muted">Không tải được thống kê.</div>;
  const { exercise, totalStudents, avgScore, students } = data;
  const exContent: string = (exercise as any).content || "";
  const exGaps: Record<string, any> | null = (() => {
    try { const g = (exercise as any).gaps; if (!g) return null; const o = typeof g === "string" ? JSON.parse(g) : g; return o && Object.keys(o).length ? o : null; } catch { return null; }
  })();
  return (
    <div className="mx-auto max-w-[900px]">
      <Link href="/bai-tap" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal">
        <ArrowLeft size={15} />Quay lại danh sách
      </Link>
      <h2 className="mb-1 font-display text-2xl font-bold text-royal">📊 Thống kê: {exercise.title}</h2>
      <p className="mb-6 text-sm text-muted">Kết quả làm bài của học viên (mỗi em tính lượt mới nhất)</p>
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-royal/10"><Users size={18} className="text-royal" /></div>
          <div><div className="text-xl font-bold text-royal">{totalStudents}</div><div className="text-xs text-muted">Học viên đã làm</div></div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15"><Target size={18} className="text-gold-dim" /></div>
          <div><div className={`text-xl font-bold ${scoreColor(avgScore)}`}>{avgScore === null ? "—" : `${avgScore}%`}</div><div className="text-xs text-muted">Điểm trung bình</div></div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100"><BarChart3 size={18} className="text-purple-600" /></div>
          <div><div className="text-xl font-bold text-royal">{students.filter((s: any) => s.score === 100).length}</div><div className="text-xs text-muted">Đạt 100%</div></div>
        </div>
      </div>
      {students.length === 0 ? (
        <div className="rounded-xl border border-silver/30 bg-white py-16 text-center text-sm text-muted">Chưa có học viên nào làm bài này.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-silver/30 bg-white">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">#</th>
              <th className="px-4 py-3 font-semibold text-royal">Học viên</th>
              <th className="px-4 py-3 text-center font-semibold text-royal">Điểm</th>
              <th className="px-4 py-3 font-semibold text-royal">Thời gian</th>
              <th className="px-4 py-3 text-center font-semibold text-royal">Chi tiết</th>
            </tr></thead>
            <tbody>
              {students.map((s: any, i: number) => (
                <tr key={s.attemptId} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-4 py-3 text-muted">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a2e]">
                    {s.studentName}
                    {s.studentCode && <div className="text-xs font-mono text-muted">{s.studentCode}</div>}
                  </td>
                  <td className={`px-4 py-3 text-center text-base font-bold ${scoreColor(s.score)}`}>{s.score === null ? "—" : `${s.score}%`}</td>
                  <td className="px-4 py-3 text-muted">{fmtDate(s.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setViewing(s)} className="inline-flex items-center gap-1 text-sm text-gold-dim hover:underline">
                      <Eye size={14} />Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setViewing(null)}>
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-royal">{viewing.studentName} — {viewing.score}%</h3>
              <button onClick={() => setViewing(null)} className="text-muted hover:text-royal"><X size={18} /></button>
            </div>
            {exGaps && exContent && (
              <div className="mb-4">
                <div className="mb-1.5 text-xs font-semibold text-muted">Bài làm đầy đủ — đáp án của học viên được tô màu:</div>
                <iframe
                  title="Bài làm đầy đủ"
                  srcDoc={/<!doctype|<html[\s>]/i.test(exContent)
                    ? buildStudentHtml(exContent, exGaps, viewing.answers || {})
                    : `<!doctype html><meta charset="utf-8"><base target="_blank"><style>body{margin:0;padding:14px;font-family:system-ui,Arial,sans-serif;color:#1a1a2e;font-size:14px;line-height:1.7}img{max-width:100%}table{max-width:100%;border-collapse:collapse}</style>${buildStudentHtml(exContent, exGaps, viewing.answers || {})}`}
                  className="w-full rounded-lg border border-silver/20 bg-white"
                  style={{ height: "440px" }}
                  onLoad={(e) => { try { const f = e.currentTarget as HTMLIFrameElement; const d = f.contentDocument; if (d && d.body) f.style.height = Math.min(Math.max(d.documentElement.scrollHeight, d.body.scrollHeight) + 8, 440) + "px"; } catch {} }}
                />
                <div className="mt-2 flex flex-wrap gap-3 text-[0.7rem] text-muted">
                  <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded border border-green-500 bg-green-100" />Đúng</span>
                  <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded border border-red-500 bg-red-100" />Sai (kèm đáp án đúng)</span>
                </div>
              </div>
            )}
            {Array.isArray(viewing.detail) && viewing.detail.length > 0 ? (
              <div className="space-y-2">
                {viewing.detail.map((d: any, j: number) => {
                  const correct = correctText(d);
                  return (
                    <div key={j} className={`rounded-lg border p-3 text-sm ${d.isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                      <div className="font-medium text-[#1a1a2e]">{d.content || `Câu ${j + 1}`}</div>
                      <div className="mt-1 text-xs">
                        <span className="text-muted">HV trả lời: </span>
                        <span className={d.isCorrect ? "font-semibold text-green-700" : "font-semibold text-red-700"}>{String(d.studentAnswer ?? "(trống)")}</span>
                        {!d.isCorrect && correct && <span className="ml-2 text-green-700">· Đúng: <strong>{correct}</strong></span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">Không có chi tiết.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}