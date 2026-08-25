// FILE: src/app/(protected)/ngan-hang-de/de-thi/[examId]/cau-hoi/page.tsx — Danh sach cau hoi
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, GripVertical, Eye, EyeOff, Ban, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { canEditContent } from "@/lib/permissions";
interface Question {
  id: string; type: string; content: string; options: any;
  correctAnswer: any; gaps?: Record<string, { type?: string; answers?: string[]; options?: string[] }> | null;
  explanation?: string | null; score: number; orderIndex: number;
}
interface Exam { id: string; title: string; status: string; duration: number; totalScore: number; }
const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Trắc nghiệm", FILL_IN_BLANK: "Điền từ", MATCHING: "Nối câu", ESSAY: "Tự luận",
};
const ansText = (a: any) => (typeof a === "string" ? a : JSON.stringify(a));
const TOKEN_RE = /\[\[gap:([^\]]+)\]\]/g;
function escHtml(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// Thay [[gap:N]] trong content:
//  - showKey=false → ô trống có số thứ tự
//  - showKey=true  → đáp án đúng (đáp án đầu tiên) tô xanh
function renderGapContent(content: string, gaps: Question["gaps"], showKey: boolean): string {
  if (!content) return "";
  return content.replace(TOKEN_RE, (_m, id) => {
    const key = String(id);
    if (showKey) {
      const ans = gaps?.[key]?.answers?.[0] || "___";
      return `<span style="display:inline-block;background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:4px;padding:0 6px;margin:0 2px;font-weight:600;"><span style="font-size:0.7em;opacity:0.6;margin-right:3px;">${escHtml(key)}</span>${escHtml(ans)}</span>`;
    }
    return `<span style="display:inline-block;min-width:70px;background:#f1f5f9;border:1px dashed #94a3b8;border-radius:4px;padding:0 8px;margin:0 2px;color:#64748b;text-align:center;"><span style="font-size:0.7em;opacity:0.7;margin-right:3px;">${escHtml(key)}</span>____</span>`;
  });
}
export default function QuestionListPage() {
  const params = useParams();
  const examId = params.examId as string;
  const { user } = useAuth();
  const canEdit = canEditContent(user?.role);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [blockMsg, setBlockMsg] = useState(false);
  // Chặn sao chép đề thi. Là rào cản, không phải khoá tuyệt đối.
  function block(e: React.SyntheticEvent) {
    if (canEdit) return;              // admin vẫn copy bình thường
    e.preventDefault();
    setBlockMsg(true);
    setTimeout(() => setBlockMsg(false), 2200);
  }
  async function fetchData() {
    setLoading(true);
    try {
      const [examData, qData] = await Promise.all([
        api.get(`/exams/${examId}`),
        api.get(`/questions?examId=${examId}`),
      ]);
      if (examData.success) setExam(examData.data);
      if (qData.success) setQuestions(qData.data);
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => { fetchData(); }, [examId]);
  async function handleDelete(id: string) {
    const data = await api.delete(`/questions/${id}`);
    if (data.success) { setDeleteId(null); fetchData(); }
    else { alert(data.message || "Không có quyền thực hiện"); setDeleteId(null); }
  }
  async function handlePublish() {
    const status = exam?.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const res = await api.put(`/exams/${examId}`, { status });
    if (!res.success) { alert(res.message || "Không có quyền thực hiện"); return; }
    fetchData();
  }
  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  return (
    <div className={`mx-auto max-w-[1100px] ${canEdit ? "" : "select-none"}`}
      onCopy={block} onCut={block} onContextMenu={block} onDragStart={block}>
      <style>{`
        .q-body table { width: 100% !important; max-width: 100% !important; }
        .q-body td, .q-body th { overflow-wrap: anywhere; }
        .q-body img, .q-body iframe { max-width: 100%; }
      `}</style>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ngan-hang-de/de-thi" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
          <div>
            <h2 className="font-display text-2xl font-bold text-royal">{exam?.title}</h2>
            <p className="text-sm text-muted">{questions.length} câu hỏi · {exam?.duration} phút · {exam?.totalScore} điểm</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowKey((v) => !v)} className="btn-secondary">
            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}{showKey ? "Ẩn đáp án" : "Hiện đáp án"}
          </button>
          {canEdit && (<>
            <button onClick={handlePublish} className={exam?.status === "PUBLISHED" ? "btn-secondary" : "btn-primary"}>
              {exam?.status === "PUBLISHED" ? "Chuyển Draft" : "Xuất bản"}
            </button>
            <Link href={`/ngan-hang-de/de-thi/${examId}/cau-hoi/tao-moi`} className="btn-primary">
              <Plus size={15} />Thêm câu hỏi
            </Link>
          </>)}
        </div>
      </div>
      {!canEdit && user && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-2.5 text-xs text-blue-800">
          Chế độ <b>chỉ xem</b> — bấm <b>Hiện đáp án</b> để xem key. Đề thi do quản trị viên tạo và chỉnh sửa.
        </div>
      )}
      <div className="space-y-3">
        {questions.map((q, i) => {
          const hasGaps = q.gaps && Object.keys(q.gaps).length > 0;
          const bodyHtml = hasGaps ? renderGapContent(q.content, q.gaps, showKey) : q.content;
          return (
          <div key={q.id} className="card flex items-start gap-4 !py-4">
            <div className="mt-1 text-muted"><GripVertical size={16} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded bg-royal/8 px-2 py-0.5 text-[0.65rem] font-semibold text-royal">Câu {i + 1}</span>
                <span className="rounded bg-cream-dark px-2 py-0.5 text-[0.65rem] text-muted">{TYPE_LABELS[q.type] || q.type}</span>
                <span className="text-[0.65rem] text-muted">{q.score} điểm</span>
                {hasGaps && <span className="rounded bg-blue-50 px-2 py-0.5 text-[0.65rem] font-semibold text-blue-700">{Object.keys(q.gaps!).length} chỗ trống</span>}
              </div>
              {/* div (không phải p) — đề dán HTML có table/div sẽ vỡ nếu bọc trong p.
                  Câu nhiều gap: line-clamp gây rối bảng nên không cắt dòng, luôn hiện đủ. */}
              <div className={`q-body overflow-x-auto text-sm text-[#1a1a2e] ${showKey || hasGaps ? "" : "line-clamp-2"}`}
                dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              {showKey && (
                <div className="mt-3 space-y-1.5 border-t border-silver/20 pt-3">
                  {q.type === "MULTIPLE_CHOICE" && Array.isArray(q.options) ? (
                    q.options.map((opt: string, j: number) => {
                      const isCorrect = ansText(q.correctAnswer) === opt;
                      return (
                        <div key={j} className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${isCorrect ? "bg-green-50 font-semibold text-green-700" : "text-muted"}`}>
                          <span className="font-mono text-xs">{String.fromCharCode(65 + j)}.</span>{opt}
                          {isCorrect && <CheckCircle size={13} className="ml-auto text-green-500" />}
                        </div>
                      );
                    })
                  ) : q.type === "ESSAY" ? (
                    <p className="text-xs text-muted">Câu tự luận — giáo viên chấm thủ công.</p>
                  ) : hasGaps ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted">Đáp án các chỗ trống:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(q.gaps!).map(([gid, g]) => (
                          <span key={gid} className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">
                            <b className="opacity-60">{gid}.</b> {(g.answers || []).join(" / ") || "—"}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm"><span className="text-muted">Đáp án đúng: </span>
                      <strong className="rounded bg-green-50 px-2 py-0.5 text-green-700">{ansText(q.correctAnswer)}</strong></p>
                  )}
                  {q.explanation && (
                    <p className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">💡 {q.explanation}</p>
                  )}
                </div>
              )}
            </div>
            {canEdit && (
              <div className="flex shrink-0 items-center gap-1">
                <Link href={`/ngan-hang-de/de-thi/${examId}/cau-hoi/${q.id}`}
                  className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Pencil size={14} /></Link>
                <button onClick={() => setDeleteId(q.id)}
                  className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            )}
          </div>
          );
        })}
        {questions.length === 0 && (
          <div className="card py-12 text-center text-muted">
            Chưa có câu hỏi nào.
            {canEdit && (
              <Link href={`/ngan-hang-de/de-thi/${examId}/cau-hoi/tao-moi`} className="ml-2 font-semibold text-gold hover:underline">
                Thêm câu hỏi đầu tiên →
              </Link>
            )}
          </div>
        )}
      </div>
      {blockMsg && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-red-600/95 px-4 py-2.5 text-sm font-medium text-white shadow-xl">
          <Ban size={15} />Không cho phép sao chép nội dung đề thi.
        </div>
      )}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
          <div className="w-full max-w-sm card space-y-4">
            <h3 className="font-display text-xl font-bold text-royal">Xoá câu hỏi?</h3>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Huỷ</button>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger">Xoá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}