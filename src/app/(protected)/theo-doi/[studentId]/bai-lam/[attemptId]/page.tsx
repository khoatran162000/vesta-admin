// FILE: src/app/(protected)/theo-doi/[studentId]/bai-lam/[attemptId]/page.tsx — Chi tiet bai lam hoc vien
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Minus, FileText } from "lucide-react";
import { api } from "@/lib/api";

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Trắc nghiệm", FILL_IN_BLANK: "Điền từ", MATCHING: "Nối câu", ESSAY: "Tự luận",
};

interface GapDetail {
  id: string;
  studentAnswer: string | null;
  correctAnswers: string[];
  isCorrect: boolean;
}

// Câu có nhiều gap? backend trả kèm gapResult.detail cho câu FILL nhiều ô
function hasGaps(q: any): boolean {
  return !!(q?.gapResult && Array.isArray(q.gapResult.detail) && q.gapResult.detail.length > 0);
}

const TOKEN_RE = /\[\[gap:([^\]]+)\]\]/g;

// Render read-only nội dung có [[gap:N]] → tô đúng/sai từng ô (không cần GapPlayer/dnd-kit).
// Giữ nguyên HTML LearnClick giữa các gap; mỗi gap thành 1 chip màu.
function GapReview({ content, detail }: { content: string; detail: GapDetail[] }) {
  const map: Record<string, GapDetail> = {};
  detail.forEach((d) => { map[String(d.id)] = d; });

  // Cắt content thành các mảnh [html, gap, html, gap, ...]
  const parts: Array<{ type: "html"; html: string } | { type: "gap"; id: string }> = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(content)) !== null) {
    if (m.index > lastIndex) parts.push({ type: "html", html: content.slice(lastIndex, m.index) });
    parts.push({ type: "gap", id: String(m[1]) });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < content.length) parts.push({ type: "html", html: content.slice(lastIndex) });

  return (
    <div className="gap-review overflow-x-auto text-sm leading-[2.4] text-[#1a1a2e] [&_table]:!w-full [&_table]:!max-w-full [&_td]:[overflow-wrap:anywhere] [&_img]:max-w-full [&_iframe]:max-w-full">
      {parts.map((p, i) => {
        if (p.type === "html") {
          return <span key={i} dangerouslySetInnerHTML={{ __html: p.html }} />;
        }
        const d = map[p.id];
        const studentAns = d?.studentAnswer?.trim();
        const correct = d?.isCorrect;
        const cls = correct
          ? "border-green-400 bg-green-50 text-green-700"
          : "border-red-400 bg-red-50 text-red-700";
        return (
          <span key={i} className="mx-1 inline-flex items-center align-baseline">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-sm font-medium ${cls}`}>
              <b className="text-[0.65em] opacity-50">{p.id}</b>
              {studentAns || <span className="italic opacity-60">(bỏ trống)</span>}
              {correct
                ? <CheckCircle size={13} className="text-green-500" />
                : <XCircle size={13} className="text-red-400" />}
            </span>
            {!correct && (d?.correctAnswers?.length ?? 0) > 0 && (
              <span className="ml-1 text-xs font-semibold text-green-600">→ {d!.correctAnswers[0]}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default function AttemptDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const attemptId = params.attemptId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/attempts/${attemptId}`);
        if (res.success) setData(res.data);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, [attemptId]);
  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  if (!data) return <p className="py-20 text-center text-muted">Không tìm thấy bài làm.</p>;
  const { student, exam, summary, errorByType, questions, startTime, endTime, score } = data;
  return (
    <div className="mx-auto max-w-[900px]">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/theo-doi/${studentId}`} className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">{exam.title}</h2>
          <p className="text-sm text-muted">Học viên: {student.fullName} · {student.email}</p>
        </div>
      </div>
      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="card !py-3 text-center">
          <p className="text-2xl font-bold text-royal">{score ?? "—"}<span className="text-sm font-normal text-muted">/{exam.totalScore}</span></p>
          <p className="text-xs text-muted">Điểm</p>
        </div>
        <div className="card !py-3 text-center">
          <p className="text-2xl font-bold text-green-600">{summary.correct}</p>
          <p className="text-xs text-muted">Đúng</p>
        </div>
        <div className="card !py-3 text-center">
          <p className="text-2xl font-bold text-red-500">{summary.wrong}</p>
          <p className="text-xs text-muted">Sai</p>
        </div>
        <div className="card !py-3 text-center">
          <p className="text-2xl font-bold text-amber-500">{summary.totalQuestions - summary.answered}</p>
          <p className="text-xs text-muted">Bỏ trống</p>
        </div>
        <div className="card !py-3 text-center">
          <p className="text-2xl font-bold text-muted">{summary.totalQuestions}</p>
          <p className="text-xs text-muted">Tổng câu</p>
        </div>
      </div>
      {/* Error analysis by type */}
      {Object.keys(errorByType).length > 0 && (
        <div className="card mb-6">
          <h3 className="mb-3 text-sm font-semibold text-royal">Phân tích lỗi theo dạng câu hỏi</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Object.entries(errorByType).map(([type, stats]: [string, any]) => (
              <div key={type} className="rounded-lg bg-cream p-3 text-center">
                <p className="text-xs font-medium text-muted">{TYPE_LABELS[type] || type}</p>
                <p className="mt-1 text-lg font-bold text-red-500">{stats.wrong}<span className="text-sm font-normal text-muted">/{stats.total}</span></p>
                <p className="text-[0.65rem] text-muted">câu sai</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Time info */}
      <div className="card mb-6 flex flex-wrap items-center gap-6 !py-3 text-sm text-muted">
        <span>Bắt đầu: <strong className="text-[#1a1a2e]">{new Date(startTime).toLocaleString("vi-VN")}</strong></span>
        {endTime && <span>Nộp bài: <strong className="text-[#1a1a2e]">{new Date(endTime).toLocaleString("vi-VN")}</strong></span>}
      </div>
      {/* Questions detail */}
      <h3 className="mb-4 font-display text-lg font-bold text-royal">Chi tiết từng câu</h3>
      <div className="space-y-4">
        {questions.map((q: any) => {
          const gapQuestion = hasGaps(q);
          return (
            <div key={q.questionId} className={`card !py-4 border-l-4 ${
              q.isCorrect === true ? "border-l-green-500" : q.isCorrect === false ? "border-l-red-500" : "border-l-silver"
            }`}>
              {/* Question header */}
              <div className="mb-2 flex items-center gap-2">
                {q.isCorrect === true && <CheckCircle size={16} className="text-green-500" />}
                {q.isCorrect === false && <XCircle size={16} className="text-red-500" />}
                {q.isCorrect === null && <Minus size={16} className="text-silver" />}
                <span className="rounded bg-royal/8 px-2 py-0.5 text-[0.65rem] font-semibold text-royal">Câu {q.questionNumber}</span>
                <span className="rounded bg-cream-dark px-2 py-0.5 text-[0.65rem] text-muted">{TYPE_LABELS[q.type]}</span>
                <span className="text-[0.65rem] text-muted">{q.score} điểm</span>
                {gapQuestion && (
                  <span className="ml-auto rounded bg-royal/8 px-2 py-0.5 text-[0.65rem] font-semibold text-royal">
                    Đúng {q.gapResult.score}/{q.gapResult.maxScore} ô
                  </span>
                )}
              </div>

              {/* Câu NHIỀU GAP: render nội dung + tô đúng/sai từng ô */}
              {gapQuestion ? (
                <div className="mb-3">
                  <GapReview content={q.content} detail={q.gapResult.detail} />
                </div>
              ) : (
                <>
                  {/* Question content */}
                  <div className="mb-3 overflow-x-auto text-sm text-[#1a1a2e] [&_table]:!w-full [&_table]:!max-w-full [&_td]:[overflow-wrap:anywhere] [&_img]:max-w-full [&_iframe]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: q.content }} />
                  {/* Options for MC */}
                  {q.type === "MULTIPLE_CHOICE" && Array.isArray(q.options) && (
                    <div className="mb-3 space-y-1.5">
                      {q.options.map((opt: string, i: number) => {
                        const isCorrect = JSON.stringify(q.correctAnswer) === JSON.stringify(opt);
                        const isStudentPick = JSON.stringify(q.studentAnswer) === JSON.stringify(opt);
                        return (
                          <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                            isCorrect ? "bg-green-50 font-medium text-green-700" :
                            isStudentPick && !isCorrect ? "bg-red-50 text-red-600 line-through" :
                            "bg-cream text-muted"
                          }`}>
                            <span className="font-mono text-xs">{String.fromCharCode(65 + i)}.</span>
                            {opt}
                            {isCorrect && <CheckCircle size={14} className="ml-auto text-green-500" />}
                            {isStudentPick && !isCorrect && <XCircle size={14} className="ml-auto text-red-400" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Fill in blank / other types */}
                  {q.type !== "MULTIPLE_CHOICE" && q.type !== "ESSAY" && (
                    <div className="mb-3 space-y-1 text-sm">
                      <p><span className="text-muted">Đáp án đúng:</span> <strong className="text-green-700">{typeof q.correctAnswer === "string" ? q.correctAnswer : JSON.stringify(q.correctAnswer)}</strong></p>
                      <p><span className="text-muted">Học viên trả lời:</span> <strong className={q.isCorrect ? "text-green-700" : "text-red-600"}>{q.studentAnswer || "(bỏ trống)"}</strong></p>
                    </div>
                  )}
                  {/* Essay */}
                  {q.type === "ESSAY" && (
                    <div className="mb-3 rounded-lg bg-cream p-3 text-sm text-[#1a1a2e]">
                      <p className="mb-1 text-xs font-medium text-muted">Bài viết của học viên:</p>
                      <p>{q.studentAnswer || "(chưa viết)"}</p>
                    </div>
                  )}
                </>
              )}

              {/* Explanation */}
              {q.explanation && (
                <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  <span className="font-medium">Giải thích:</span> {q.explanation}
                </div>
              )}
              {/* Student note */}
              {q.studentNote && (
                <div className="mt-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-amber-700">
                  <FileText size={13} className="mb-0.5 mr-1 inline" />
                  <span className="font-medium">Ghi chú của học viên:</span> {q.studentNote}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}