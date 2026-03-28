// FILE: src/app/(protected)/dashboard/page.tsx — Dashboard nang cao
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, BookOpen, FileText, GraduationCap, AlertTriangle, Clock, Eye } from "lucide-react";
import { api } from "@/lib/api";

interface Stats {
  teachers: number; students: number; exams: number; posts: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ teachers: 0, students: 0, exams: 0, posts: 0 });
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [inactiveStudents, setInactiveStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [t, s, e, p] = await Promise.all([
          api.get("/users?role=TEACHER&limit=1"),
          api.get("/users?role=STUDENT&limit=1"),
          api.get("/exams?limit=1"),
          api.get("/posts/admin/all?limit=1"),
        ]);
        setStats({
          teachers: t.meta?.total || 0,
          students: s.meta?.total || 0,
          exams: e.meta?.total || 0,
          posts: p.meta?.total || 0,
        });

        // Recent attempts
        const attemptsData = await api.get("/attempts?limit=10&status=SUBMITTED");
        if (attemptsData.success) setRecentAttempts(attemptsData.data);

        // Find inactive students (check all students)
        const allStudents = await api.get("/users?role=STUDENT&limit=100");
        if (allStudents.success) {
          const inactive: any[] = [];
          for (const student of allStudents.data.slice(0, 20)) {
            try {
              const statsData = await api.get(`/attempts/student/${student.id}/stats`);
              if (statsData.success && statsData.data.stats.daysSinceLastActivity >= 7) {
                inactive.push({
                  ...student,
                  daysSinceLastActivity: statsData.data.stats.daysSinceLastActivity,
                });
              }
            } catch {}
          }
          setInactiveStudents(inactive);
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  const cards = [
    { label: "Giáo viên", value: stats.teachers, icon: Users, color: "bg-blue-50 text-blue-600", href: "/tai-khoan/giao-vien" },
    { label: "Học viên", value: stats.students, icon: GraduationCap, color: "bg-green-50 text-green-600", href: "/tai-khoan/hoc-vien" },
    { label: "Đề thi", value: stats.exams, icon: BookOpen, color: "bg-purple-50 text-purple-600", href: "/ngan-hang-de/de-thi" },
    { label: "Bài viết", value: stats.posts, icon: FileText, color: "bg-amber-50 text-amber-600", href: "/ngan-hang-de/categories" },
  ];

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="mb-6 font-display text-3xl font-bold text-royal">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.color}`}><c.icon size={22} /></div>
            <div><p className="text-2xl font-bold text-[#1a1a2e]">{c.value}</p><p className="text-sm text-muted">{c.label}</p></div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent attempts — 2 cols */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-royal">Bài thi gần đây</h2>
            <Link href="/theo-doi" className="text-xs font-medium text-gold hover:text-gold-light">Xem tất cả →</Link>
          </div>
          <div className="card !p-0 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-3 border-gold border-t-transparent" /></div>
            ) : recentAttempts.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted">Chưa có bài thi nào được nộp.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-silver/20 bg-cream">
                  <th className="px-4 py-2.5 text-xs font-semibold text-royal">Học viên</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-royal">Đề thi</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-royal">Điểm</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-royal">Ngày</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-royal"></th>
                </tr></thead>
                <tbody>{recentAttempts.slice(0, 8).map((a) => (
                  <tr key={a.id} className="border-b border-silver/10 hover:bg-cream/50">
                    <td className="px-4 py-2.5 text-xs font-medium text-[#1a1a2e]">{a.student?.fullName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{a.exam?.title}</td>
                    <td className="px-4 py-2.5">
                      {a.score !== null ? (
                        <span className={`text-xs font-semibold ${a.score >= a.exam?.totalScore * 0.7 ? "text-green-600" : a.score >= a.exam?.totalScore * 0.5 ? "text-amber-600" : "text-red-500"}`}>
                          {a.score}/{a.exam?.totalScore}
                        </span>
                      ) : <span className="text-xs text-muted">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{new Date(a.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/theo-doi/${a.student?.id}/bai-lam/${a.id}`} className="rounded p-1 text-muted hover:text-royal"><Eye size={13} /></Link>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>

        {/* Inactive students — 1 col */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="font-display text-lg font-bold text-royal">Cần nhắc nhở</h2>
          </div>
          <div className="card !p-0 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-3 border-gold border-t-transparent" /></div>
            ) : inactiveStudents.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-green-600 font-medium">Tất cả học viên đều hoạt động tốt!</p>
              </div>
            ) : (
              <div className="divide-y divide-silver/10">
                {inactiveStudents.map((s) => (
                  <Link key={s.id} href={`/theo-doi/${s.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-cream/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-600">
                      {s.daysSinceLastActivity}d
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-[#1a1a2e]">{s.fullName}</p>
                      <p className="truncate text-[0.65rem] text-muted">{s.daysSinceLastActivity} ngày không hoạt động</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}