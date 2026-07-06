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
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-royal">{viewing.studentName} — {viewing.score}%</h3>
              <button onClick={() => setViewing(null)} className="text-muted hover:text-royal"><X size={18} /></button>
            </div>
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