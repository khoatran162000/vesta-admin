// FILE: src/app/(protected)/ngan-hang-de/de-thi/[examId]/ket-qua/page.tsx
// Ket qua de thi: ai da lam + diem + so lan (moi HS tinh luot moi nhat)
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Users, Target, BarChart3 } from "lucide-react";
import { api } from "@/lib/api";

export default function ExamResultsPage() {
  const params = useParams();
  const examId = params.examId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/attempts/exam/${examId}/results`);
        if (res.success) setData(res.data);
      } catch {} finally { setLoading(false); }
    })();
  }, [examId]);

  function scoreColor(s: number | null, total: number) {
    if (s === null) return "text-gray-400";
    const pct = total > 0 ? s / total : 0;
    if (pct >= 0.7) return "text-green-600";
    if (pct >= 0.5) return "text-amber-600";
    return "text-red-600";
  }
  function fmtDate(d: string) {
    return new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gold" /></div>;
  if (!data) return (
    <div className="mx-auto max-w-[900px]">
      <Link href="/ngan-hang-de/de-thi" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal"><ArrowLeft size={15} />Quay lại danh sách</Link>
      <div className="card text-sm text-red-600">Không tải được kết quả.</div>
    </div>
  );
  const { exam, totalStudents, totalAttempts, avgScore, students } = data;
  const totalScore = exam?.totalScore || 0;
  return (
    <div className="mx-auto max-w-[900px]">
      <Link href="/ngan-hang-de/de-thi" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal"><ArrowLeft size={15} />Quay lại danh sách</Link>
      <h2 className="mb-1 font-display text-2xl font-bold text-royal">📊 Kết quả: {exam.title}</h2>
      <p className="mb-6 text-sm text-muted">Mỗi học viên tính lượt làm mới nhất{totalScore ? ` · thang điểm ${totalScore}` : ""}</p>
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-royal/10"><Users size={18} className="text-royal" /></div>
          <div><div className="text-xl font-bold text-royal">{totalStudents}</div><div className="text-xs text-muted">Học viên đã làm</div></div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15"><Target size={18} className="text-gold-dim" /></div>
          <div><div className="text-xl font-bold text-royal">{avgScore === null ? "—" : avgScore}</div><div className="text-xs text-muted">Điểm trung bình</div></div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100"><BarChart3 size={18} className="text-purple-600" /></div>
          <div><div className="text-xl font-bold text-royal">{totalAttempts}</div><div className="text-xs text-muted">Tổng lượt làm</div></div>
        </div>
      </div>
      {students.length === 0 ? (
        <div className="rounded-xl border border-silver/30 bg-white py-16 text-center text-sm text-muted">Chưa có học viên nào làm đề này.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-silver/30 bg-white">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">#</th>
              <th className="px-4 py-3 font-semibold text-royal">Học viên</th>
              <th className="px-4 py-3 text-center font-semibold text-royal">Điểm</th>
              <th className="px-4 py-3 text-center font-semibold text-royal">Số lần</th>
              <th className="px-4 py-3 font-semibold text-royal">Trạng thái</th>
              <th className="px-4 py-3 font-semibold text-royal">Lần gần nhất</th>
            </tr></thead>
            <tbody>
              {students.map((s: any, i: number) => (
                <tr key={s.attemptId} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-4 py-3 text-muted">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a2e]">
                    {s.studentName}
                    {s.studentCode && <div className="text-xs font-mono text-muted">{s.studentCode}</div>}
                  </td>
                  <td className={`px-4 py-3 text-center text-base font-bold ${scoreColor(s.score, totalScore)}`}>{s.score === null ? "—" : `${s.score}${totalScore ? "/" + totalScore : ""}`}</td>
                  <td className="px-4 py-3 text-center text-muted">{s.attemptCount}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.status === "SUBMITTED" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {s.status === "SUBMITTED" ? "Đã nộp" : "Đang làm"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{fmtDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
