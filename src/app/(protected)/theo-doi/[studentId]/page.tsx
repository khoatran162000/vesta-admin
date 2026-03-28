// FILE: src/app/(protected)/theo-doi/[studentId]/page.tsx — Chi tiet hoc vien + lich su thi
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trophy, BookOpen, Target, AlertTriangle, Eye, Calendar } from "lucide-react";
import { api } from "@/lib/api";

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/attempts/student/${studentId}/stats`);
        if (res.success) setData(res.data);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, [studentId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  if (!data) return <p className="py-20 text-center text-muted">Không tìm thấy học viên.</p>;

  const { student, stats, recentAttempts } = data;

  return (
    <div className="mx-auto max-w-[900px]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/theo-doi" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
          <div>
            <h2 className="font-display text-2xl font-bold text-royal">{student.fullName}</h2>
            <p className="text-sm text-muted">{student.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${student.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {student.isActive ? "Hoạt động" : "Đã khoá"}
          </span>
          <Link href={`/tai-khoan/${studentId}`} className="btn-secondary text-xs">Sửa thông tin</Link>
        </div>
      </div>

      {/* Inactive warning */}
      {stats.daysSinceLastActivity !== null && stats.daysSinceLastActivity >= 7 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-amber-50 px-5 py-4 border border-amber-200">
          <AlertTriangle size={20} className="shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Học viên không hoạt động {stats.daysSinceLastActivity} ngày</p>
            <p className="text-xs text-amber-600">Lần làm bài gần nhất: {stats.lastActivityDate ? new Date(stats.lastActivityDate).toLocaleDateString("vi-VN") : "Chưa bao giờ"}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="card flex items-center gap-3 !py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><BookOpen size={18} /></div>
          <div><p className="text-xl font-bold text-[#1a1a2e]">{stats.totalAttempts}</p><p className="text-[0.65rem] text-muted">Tổng lượt thi</p></div>
        </div>
        <div className="card flex items-center gap-3 !py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600"><Target size={18} /></div>
          <div><p className="text-xl font-bold text-[#1a1a2e]">{stats.submittedAttempts}</p><p className="text-[0.65rem] text-muted">Đã nộp bài</p></div>
        </div>
        <div className="card flex items-center gap-3 !py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Trophy size={18} /></div>
          <div><p className="text-xl font-bold text-[#1a1a2e]">{stats.averageScore ?? "—"}</p><p className="text-[0.65rem] text-muted">Điểm TB</p></div>
        </div>
        <div className="card flex items-center gap-3 !py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600"><Trophy size={18} /></div>
          <div><p className="text-xl font-bold text-green-600">{stats.highestScore ?? "—"}</p><p className="text-[0.65rem] text-muted">Cao nhất</p></div>
        </div>
        <div className="card flex items-center gap-3 !py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500"><Calendar size={18} /></div>
          <div><p className="text-xl font-bold text-[#1a1a2e]">{stats.daysSinceLastActivity ?? "—"}</p><p className="text-[0.65rem] text-muted">Ngày không HĐ</p></div>
        </div>
      </div>

      {/* Recent attempts */}
      <h3 className="mb-3 font-display text-lg font-bold text-royal">Lịch sử làm bài</h3>
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-silver/20 bg-cream">
              <th className="px-5 py-3 font-semibold text-royal">Đề thi</th>
              <th className="px-5 py-3 font-semibold text-royal">Điểm</th>
              <th className="px-5 py-3 font-semibold text-royal">Trạng thái</th>
              <th className="px-5 py-3 font-semibold text-royal">Ngày</th>
              <th className="px-5 py-3 text-right font-semibold text-royal">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {recentAttempts.map((a: any) => (
              <tr key={a.id} className="border-b border-silver/10 hover:bg-cream/50">
                <td className="px-5 py-3 font-medium text-[#1a1a2e]">{a.exam.title}</td>
                <td className="px-5 py-3">
                  {a.score !== null ? (
                    <span className={`font-semibold ${a.score >= a.exam.totalScore * 0.7 ? "text-green-600" : a.score >= a.exam.totalScore * 0.5 ? "text-amber-600" : "text-red-500"}`}>
                      {a.score}/{a.exam.totalScore}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${a.status === "SUBMITTED" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                    {a.status === "SUBMITTED" ? "Đã nộp" : "Đang làm"}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted">{new Date(a.createdAt).toLocaleDateString("vi-VN")}</td>
                <td className="px-5 py-3 text-right">
                  {a.status === "SUBMITTED" && (
                    <Link href={`/theo-doi/${studentId}/bai-lam/${a.id}`} className="btn-secondary text-xs">
                      <Eye size={13} />Xem bài
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recentAttempts.length === 0 && <p className="py-8 text-center text-muted">Chưa có lượt thi nào.</p>}
      </div>
    </div>
  );
}