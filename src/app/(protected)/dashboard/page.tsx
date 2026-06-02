// FILE: src/app/(protected)/dashboard/page.tsx — Dashboard mới (ghi đè)
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, FileText, ClipboardList, Calendar, Target, BarChart3,
  UserPlus, Upload, ArrowRight, Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState({ students: 0, posts: 0, exams: 0, schedules: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [users, posts, exams, schedules] = await Promise.all([
          api.get("/users?role=STUDENT&limit=1"),
          api.get("/posts/admin/all?limit=1"),
          api.get("/exams?limit=1"),
          api.get("/schedule"),
        ]);
        setStats({
          students: users.meta?.total || 0,
          posts: posts.meta?.total || (Array.isArray(posts.data) ? posts.data.length : 0),
          exams: exams.meta?.total || (Array.isArray(exams.data) ? exams.data.length : 0),
          schedules: Array.isArray(schedules.data) ? schedules.data.length : 0,
        });
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  const STAT_CARDS = [
    { icon: Users, label: "Học viên", value: stats.students, color: "#0F1B3D", href: "/tai-khoan/hoc-vien" },
    { icon: FileText, label: "Bài viết", value: stats.posts, color: "#C9A84C", href: "/bai-viet" },
    { icon: ClipboardList, label: "Đề thi", value: stats.exams, color: "#22c55e", href: "/ngan-hang-de/de-thi" },
    { icon: Calendar, label: "Lớp học", value: stats.schedules, color: "#C93040", href: "/lich-hoc" },
  ];

  const QUICK_ACTIONS = [
    { icon: UserPlus, label: "Tạo học viên hàng loạt", href: "/tai-khoan/hoc-vien/tao-hang-loat", color: "#0F1B3D" },
    { icon: Upload, label: "Import CSV học viên", href: "/tai-khoan/hoc-vien/import", color: "#2563eb" },
    { icon: Target, label: "Tạo bài tập tương tác", href: "/bai-tap/tao-moi", color: "#7c3aed" },
    { icon: Calendar, label: "Thêm lịch học", href: "/lich-hoc", color: "#C93040" },
    { icon: FileText, label: "Quản lý nội dung lớp", href: "/lop-hoc", color: "#059669" },
    { icon: BarChart3, label: "Xem báo cáo kết quả", href: "/bao-cao", color: "#C9A84C" },
  ];

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="mb-1 font-display text-3xl font-bold text-royal">Dashboard</h1>
      <p className="mb-6 text-sm text-muted">Tổng quan hệ thống VESTA UNI</p>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((s, i) => (
          <Link key={i} href={s.href} className="card group transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${s.color}15` }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-bold text-[#1a1a2e]">
              {loading ? <Loader2 size={20} className="animate-spin text-muted" /> : s.value}
            </p>
            <p className="text-xs text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h3 className="mb-4 font-display text-lg font-bold text-royal">Thao tác nhanh</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_ACTIONS.map((a, i) => (
          <Link key={i} href={a.href}
            className="card group flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ background: `${a.color}15` }}>
              <a.icon size={20} style={{ color: a.color }} />
            </div>
            <span className="flex-1 text-sm font-medium text-[#1a1a2e]">{a.label}</span>
            <ArrowRight size={16} className="text-muted opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  );
}
