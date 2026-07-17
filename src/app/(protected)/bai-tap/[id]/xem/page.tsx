// FILE: src/app/(protected)/bai-tap/[id]/xem/page.tsx — Xem bài tập (chỉ đọc, có nút Hiện đáp án)
"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, Ban, BarChart3 } from "lucide-react";
import { api } from "@/lib/api";

const TOKEN_RE = /\[\[gap:([^\]]+)\]\]/g;
const looksLikeHtml = (s: string) => /<[a-z][\s\S]*>/i.test(s || "");
const escapeHtml = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Đổi [[gap:N]] thành ô trống, hoặc thành đáp án khi bật "Hiện đáp án"
function buildHtml(content: string, gaps: Record<string, any>, showKey: boolean) {
  const isHtml = looksLikeHtml(content);
  const base = isHtml ? content : escapeHtml(content);
  const html = base.replace(TOKEN_RE, (_m, id) => {
    const g = gaps[String(id)] || {};
    const ans = Array.isArray(g.answers) ? g.answers.join(" / ") : "";
    if (showKey && ans) {
      return `<span style="background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:4px;padding:1px 6px;margin:0 2px;font-weight:600;"><span style="font-size:0.7em;opacity:0.6;">${escapeHtml(String(id))}</span> ${escapeHtml(ans)}</span>`;
    }
    return `<span style="display:inline-block;min-width:80px;border-bottom:2px solid #94a3b8;margin:0 4px;"><span style="font-size:0.7em;color:#94a3b8;">${escapeHtml(String(id))}</span>&nbsp;</span>`;
  });
  return { html, isHtml };
}

export default function ViewExercisePage() {
  const { id } = useParams<{ id: string }>();
  const [ex, setEx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [blockMsg, setBlockMsg] = useState(false);

  useEffect(() => {
    api.get(`/interactive/${id}`).then((res) => { if (res.success) setEx(res.data); })
      .finally(() => setLoading(false));
  }, [id]);

  // Chặn sao chép nội dung bài. LƯU Ý: là rào cản, không phải khoá tuyệt đối.
  function block(e: React.SyntheticEvent) {
    e.preventDefault();
    setBlockMsg(true);
    setTimeout(() => setBlockMsg(false), 2200);
  }

  const gaps = useMemo(() => {
    if (!ex?.gaps) return null;
    const g = typeof ex.gaps === "string" ? JSON.parse(ex.gaps) : ex.gaps;
    return g && Object.keys(g).length > 0 ? g : null;
  }, [ex]);

  const questions = useMemo(() => {
    if (!ex?.questions) return [];
    const q = typeof ex.questions === "string" ? JSON.parse(ex.questions) : ex.questions;
    return Array.isArray(q) ? q : [];
  }, [ex]);

  const { html, isHtml } = useMemo(
    () => (gaps ? buildHtml(ex?.content || "", gaps, showKey) : { html: "", isHtml: false }),
    [gaps, ex, showKey]
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  if (!ex) return (
    <div className="mx-auto max-w-[900px]">
      <Link href="/bai-tap" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal"><ArrowLeft size={15} />Quay lại</Link>
      <div className="card text-sm text-red-600">Không tìm thấy bài tập.</div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1100px] select-none"
      onCopy={block} onCut={block} onContextMenu={block} onDragStart={block}>
      <style>{`
        .view-html table { width: 100% !important; max-width: 100% !important; }
        .view-html td, .view-html th { overflow-wrap: anywhere; }
        .view-html img, .view-html iframe { max-width: 100%; }
      `}</style>

      <Link href="/bai-tap" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal">
        <ArrowLeft size={15} />Quay lại danh sách
      </Link>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">{ex.title}</h2>
          {ex.description && <p className="mt-1 text-sm text-muted">{ex.description}</p>}
          <p className="mt-1 text-xs text-muted">
            {gaps ? `${Object.keys(gaps).length} chỗ trống` : `${questions.length} câu hỏi`} · {ex.type}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href={`/bai-tap/${id}/thong-ke`} className="btn-secondary"><BarChart3 size={15} />Kết quả lớp</Link>
          <button onClick={() => setShowKey((v) => !v)} className="btn-primary">
            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}{showKey ? "Ẩn đáp án" : "Hiện đáp án"}
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-2.5 text-xs text-blue-800">
        Chế độ <b>chỉ xem</b> — bài tập do quản trị viên tạo và chỉnh sửa. Bạn xem đáp án để dạy và theo dõi kết quả học viên.
      </div>

      <div className="card">
        {gaps ? (
          <div className="overflow-x-auto">
            <div className={isHtml ? "view-html text-sm text-[#1a1a2e]" : "whitespace-pre-wrap text-[1.05rem] leading-[2.4] text-[#1a1a2e]"}
              dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ) : ex.type === "MATCHING" ? (
          <div className="space-y-2">
            {questions.map((q: any, i: number) => (
              <div key={q.id || i} className="flex items-center gap-3 rounded-lg border border-silver/30 px-3 py-2 text-sm">
                <span className="font-medium text-[#1a1a2e]">{q.left}</span>
                <span className="text-muted">→</span>
                {showKey
                  ? <span className="rounded bg-green-50 px-2 py-0.5 font-semibold text-green-700">{q.right}</span>
                  : <span className="text-gray-300">•••</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q: any, i: number) => (
              <div key={q.id || i} className="rounded-lg border border-silver/30 p-3">
                <p className="mb-2 text-sm font-medium text-[#1a1a2e]">{i + 1}. {q.content}</p>
                {Array.isArray(q.options) && (
                  <div className="space-y-1.5 pl-4">
                    {q.options.map((opt: string, j: number) => {
                      const letter = String.fromCharCode(65 + j);
                      const isCorrect = showKey && (q.correctAnswer === letter || q.correctAnswer === opt);
                      return (
                        <div key={j} className={`rounded px-2 py-1 text-sm ${isCorrect ? "bg-green-50 font-semibold text-green-700" : "text-muted"}`}>
                          {letter}. {opt}
                        </div>
                      );
                    })}
                  </div>
                )}
                {showKey && q.explanation && (
                  <p className="mt-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">💡 {q.explanation}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {blockMsg && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-red-600/95 px-4 py-2.5 text-sm font-medium text-white shadow-xl">
          <Ban size={15} />Không cho phép sao chép nội dung bài tập.
        </div>
      )}
    </div>
  );
}