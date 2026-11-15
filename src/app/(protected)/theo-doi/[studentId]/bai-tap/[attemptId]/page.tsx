// FILE: src/app/(protected)/theo-doi/[studentId]/bai-tap/[attemptId]/page.tsx
// Xem 1 luot lam bai tap cua hoc vien, kem dap an dung/sai (xanh/do)
"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const TOKEN_RE = /\[\[gap:([^\]]+)\]\]/g;
const looksLikeHtml = (s: string) => /<[a-z][\s\S]*>/i.test(s || "");
const escHtml = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const normAns = (s: any) => String(s ?? "").trim().toLowerCase();

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

export default function StudentExerciseAttemptPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const attemptId = params.attemptId as string;
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/interactive/attempt-detail/${attemptId}`);
        if (res.success) setD(res.data);
      } catch {} finally { setLoading(false); }
    })();
  }, [attemptId]);

  const srcDoc = useMemo(() => {
    if (!d?.exercise) return "";
    const content: string = d.exercise.content || "";
    let gaps: Record<string, any> = {};
    try { const g = d.exercise.gaps; gaps = typeof g === "string" ? JSON.parse(g) : (g || {}); } catch {}
    let answers: Record<string, any> = {};
    try { const a = d.attempt?.answers; answers = typeof a === "string" ? JSON.parse(a) : (a || {}); } catch {}
    const inner = buildStudentHtml(content, gaps, answers);
    if (/<!doctype|<html[\s>]/i.test(content)) return inner;
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;margin:16px;color:#1e293b;line-height:1.7}img,iframe,video,table{max-width:100%}</style></head><body>${inner}</body></html>`;
  }, [d]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  if (!d) return (
    <div className="mx-auto max-w-[900px]">
      <Link href={`/theo-doi/${studentId}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal"><ArrowLeft size={15} />Quay lại hồ sơ</Link>
      <div className="card text-sm text-red-600">Không tìm thấy lượt làm bài.</div>
    </div>
  );
  const ex = d.exercise; const at = d.attempt;
  const score = typeof at?.score === "number" ? at.score : null;
  return (
    <div className="mx-auto max-w-[1000px]">
      <Link href={`/theo-doi/${studentId}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal"><ArrowLeft size={15} />Quay lại hồ sơ</Link>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">{ex.title}</h2>
          <p className="text-sm text-muted">{at?.studentName || "Học viên"}{at?.createdAt ? ` · ${new Date(at.createdAt).toLocaleString("vi-VN")}` : ""}</p>
        </div>
        {score !== null && (
          <span className={`rounded-full px-4 py-1.5 text-base font-bold ${score >= 70 ? "bg-green-50 text-green-700" : score >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>{score}%</span>
        )}
      </div>
      <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-2.5 text-xs text-blue-800">
        Ô <b style={{ color: "#166534" }}>xanh</b> = học viên trả lời đúng, ô <b style={{ color: "#b91c1c" }}>đỏ</b> = sai (kèm ✓ đáp án đúng).
      </div>
      <div className="card !p-0 overflow-hidden">
        <iframe title="Bài làm của học viên" className="w-full" style={{ border: "none", minHeight: "400px" }}
          srcDoc={srcDoc}
          onLoad={(e) => { try { const f = e.currentTarget as HTMLIFrameElement; const dc = f.contentDocument; if (dc && dc.body) f.style.height = (Math.max(dc.documentElement.scrollHeight, dc.body.scrollHeight) + 16) + "px"; } catch {} }} />
      </div>
    </div>
  );
}
