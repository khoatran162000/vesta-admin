// FILE: src/app/(protected)/ngan-hang-de/de-thi/[examId]/cau-hoi/page.tsx — Danh sach cau hoi
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, GripVertical } from "lucide-react";
import { api } from "@/lib/api";

interface Question {
  id: string; type: string; content: string; options: any;
  correctAnswer: any; score: number; orderIndex: number;
}
interface Exam { id: string; title: string; status: string; duration: number; totalScore: number; }

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Trắc nghiệm", FILL_IN_BLANK: "Điền từ", MATCHING: "Nối câu", ESSAY: "Tự luận",
};

export default function QuestionListPage() {
  const params = useParams();
  const examId = params.examId as string;
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
  }

  async function handlePublish() {
    const status = exam?.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await api.put(`/exams/${examId}`, { status });
    fetchData();
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ngan-hang-de/de-thi" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
          <div>
            <h2 className="font-display text-2xl font-bold text-royal">{exam?.title}</h2>
            <p className="text-sm text-muted">{questions.length} câu hỏi · {exam?.duration} phút · {exam?.totalScore} điểm</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePublish} className={exam?.status === "PUBLISHED" ? "btn-secondary" : "btn-primary"}>
            {exam?.status === "PUBLISHED" ? "Chuyển Draft" : "Xuất bản"}
          </button>
          <Link href={`/ngan-hang-de/de-thi/${examId}/cau-hoi/tao-moi`} className="btn-primary">
            <Plus size={15} />Thêm câu hỏi
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.id} className="card flex items-start gap-4 !py-4">
            <div className="mt-1 text-muted"><GripVertical size={16} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded bg-royal/8 px-2 py-0.5 text-[0.65rem] font-semibold text-royal">Câu {i + 1}</span>
                <span className="rounded bg-cream-dark px-2 py-0.5 text-[0.65rem] text-muted">{TYPE_LABELS[q.type] || q.type}</span>
                <span className="text-[0.65rem] text-muted">{q.score} điểm</span>
              </div>
              <p className="text-sm text-[#1a1a2e] line-clamp-2" dangerouslySetInnerHTML={{ __html: q.content }} />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link href={`/ngan-hang-de/de-thi/${examId}/cau-hoi/${q.id}`}
                className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Pencil size={14} /></Link>
              <button onClick={() => setDeleteId(q.id)}
                className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <div className="card py-12 text-center text-muted">
            Chưa có câu hỏi nào.
            <Link href={`/ngan-hang-de/de-thi/${examId}/cau-hoi/tao-moi`} className="ml-2 font-semibold text-gold hover:underline">
              Thêm câu hỏi đầu tiên →
            </Link>
          </div>
        )}
      </div>

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