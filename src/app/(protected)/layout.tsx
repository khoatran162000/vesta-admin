"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, BookOpen, GraduationCap, Bell, UserCircle, LogOut, ChevronDown } from "lucide-react";
import { useAuth, ROLE_LABELS } from "@/hooks/useAuth";

type NavLink = { href: string; label: string; icon: any };
type NavGroup = { label: string; icon: any; children: { href: string; label: string }[] };
type NavItem = NavLink | NavGroup;

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { label: "Tài khoản", icon: Users, children: [
    { href: "/tai-khoan/giao-vien", label: "Giáo viên" },
    { href: "/tai-khoan/marketing", label: "Marketing" },
    { href: "/tai-khoan/hoc-vien", label: "Học viên" },
  ]},
  { label: "Ngân hàng đề", icon: BookOpen, children: [
    { href: "/ngan-hang-de/categories", label: "Danh mục" },
    { href: "/ngan-hang-de/de-thi", label: "Đề thi" },
  ]},
  { href: "/theo-doi", label: "Theo dõi học viên", icon: GraduationCap },
  { href: "/thong-bao", label: "Thông báo", icon: Bell },
  { href: "/ho-so", label: "Hồ sơ", icon: UserCircle },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname() || "";
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/dang-nhap");
  }, [loading, user, router]);

  function toggleMenu(label: string) {
    setOpenMenus((prev) => prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r border-silver/30 bg-white">
        <div className="border-b border-silver/20 px-5 py-5">
          <p className="font-display text-xl font-bold text-royal">VESTA ADMIN</p>
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted">Quản trị hệ thống</p>
        </div>
        <div className="border-b border-silver/20 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-royal/10 text-sm font-bold text-royal">{user.fullName.charAt(0)}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1a1a2e]">{user.fullName}</p>
              <p className="truncate text-[0.6rem] text-muted">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV.map((item) => {
            if ("href" in item) {
              const link = item as NavLink;
              const active = pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.82rem] font-medium transition-colors ${active ? "bg-royal/8 text-royal" : "text-muted hover:bg-cream hover:text-royal"}`}>
                  <link.icon size={17} />{link.label}
                </Link>
              );
            }
            const group = item as NavGroup;
            const isOpen = openMenus.includes(group.label);
            const hasActive = group.children.some((c) => pathname.startsWith(c.href));
            return (
              <div key={group.label}>
                <button onClick={() => toggleMenu(group.label)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[0.82rem] font-medium transition-colors ${hasActive ? "text-royal" : "text-muted hover:bg-cream hover:text-royal"}`}>
                  <group.icon size={17} />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {(isOpen || hasActive) && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l border-silver/20 pl-3">
                    {group.children.map((child) => {
                      const active = pathname.startsWith(child.href);
                      return (
                        <Link key={child.href} href={child.href}
                          className={`block rounded-md px-2.5 py-1.5 text-[0.78rem] transition-colors ${active ? "font-semibold text-royal" : "text-muted hover:text-royal"}`}>
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-silver/20 px-3 py-3">
          <button onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[0.82rem] font-medium text-muted transition-colors hover:bg-red-50 hover:text-red-600">
            <LogOut size={17} />Đăng xuất
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
