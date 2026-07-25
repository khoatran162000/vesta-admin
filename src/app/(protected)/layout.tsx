"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, Bell, UserCircle,
  LogOut, ChevronDown, Calendar, FileText, Target, BarChart3, ShieldAlert, MessageSquare
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth, ROLE_LABELS } from "@/hooks/useAuth";
// Nhóm quyền — khớp với backend (authorize ở routes). Đây CHỉ là lớp giao diện;
// chặn thật nằm ở server, ẩn menu chỉ để GV không bấm vào chỗ 403.
const ADMIN = ["ADMIN"];
const STAFF = ["ADMIN", "TEACHER"];
const CMS = ["ADMIN", "CONTENT_CREATOR"];   // giống cmsRoles bên post.routes
type NavChild = { href: string; label: string; roles?: string[] };
type NavLink = { href: string; label: string; icon: any; roles?: string[]; badgeKey?: string };
type NavGroup = { label: string; icon: any; children: NavChild[]; roles?: string[] };
type NavItem = NavLink | NavGroup;
// Không khai `roles` = mọi vai đăng nhập được admin portal đều thấy
const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { label: "Tài khoản", icon: Users, children: [
    { href: "/tai-khoan/giao-vien", label: "Giáo viên", roles: ADMIN },
    { href: "/tai-khoan/marketing", label: "Marketing", roles: ADMIN },
    { href: "/tai-khoan/hoc-vien", label: "Học viên", roles: STAFF },
  ]},
  { label: "Lớp học", icon: Calendar, roles: STAFF, children: [
    { href: "/lop-hoc-moi", label: "Quản lý lớp học" },
    { href: "/lop-hoc", label: "Nội dung lớp" },
    { href: "/lich-hoc", label: "Lịch học cả năm" },
    { href: "/trinh-do", label: "Trình độ", roles: ADMIN },
  ]},
  { label: "Ngân hàng đề", icon: BookOpen, roles: STAFF, children: [
    { href: "/ngan-hang-de/categories", label: "Danh mục", roles: ADMIN },
    { href: "/ngan-hang-de/de-thi", label: "Đề thi" },
  ]},
  { label: "Nội dung", icon: FileText, children: [
    { href: "/bai-viet", label: "Bài viết Blog", roles: CMS },
    { href: "/bai-tap", label: "Bài tập tương tác", roles: STAFF },
    { href: "/giao-vien", label: "Đội ngũ giáo viên", roles: ADMIN },
    { href: "/khoa-hoc", label: "Khoá học", roles: ADMIN },
    { href: "/sach", label: "Sách & Giáo trình", roles: ADMIN },
    { href: "/noi-dung-trang-chu", label: "Nội dung trang chủ", roles: CMS },
  ]},
  { href: "/theo-doi", label: "Theo dõi học viên", icon: GraduationCap, roles: STAFF },
  { href: "/theo-doi/ky-luat", label: "Kỷ luật học tập", icon: ShieldAlert, roles: STAFF },
  { label: "Báo cáo", icon: BarChart3, roles: STAFF, children: [
    { href: "/bao-cao", label: "Tổng hợp điểm" },
    { href: "/bao-cao/dinh-ky", label: "Báo cáo định kỳ" },
    { href: "/bao-cao/cuoi-khoa", label: "Báo cáo cuối khóa" },
  ] },
  { href: "/tu-van", label: "Yêu cầu tư vấn", icon: MessageSquare, roles: ADMIN, badgeKey: "consultation" },
  { href: "/thong-bao", label: "Thông báo", icon: Bell, roles: STAFF },
  { href: "/ho-so", label: "Hồ sơ", icon: UserCircle },
];
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname() || "";
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [consultCount, setConsultCount] = useState(0);
  useEffect(() => {
    if (!loading && !user) router.replace("/dang-nhap");
  }, [loading, user, router]);
  // Đếm yêu cầu tư vấn MỚI (chỉ ADMIN) — poll mỗi 60s để badge tự cập nhật.
  // Cập nhật lại ngay khi chuyển route (vd vừa xử lý xong ở trang /tu-van rồi rời đi).
  useEffect(() => {
    if (loading || user?.role !== "ADMIN") return;
    let alive = true;
    async function loadCount() {
      try {
        const res = await api.get("/consultation/count");
        if (alive && res.success) setConsultCount(res.data.newCount || 0);
      } catch {}
    }
    loadCount();
    const t = setInterval(loadCount, 60000);
    return () => { alive = false; clearInterval(t); };
  }, [loading, user, pathname]);
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
  // Lọc menu theo vai: bỏ mục không có quyền, bỏ luôn nhóm nếu rỗng
  const can = (roles?: string[]) => !roles || roles.includes(user.role);
  const navForRole: NavItem[] = NAV
    .filter((item) => can(item.roles))
    .map((item) => {
      if ("href" in item) return item;
      const group = item as NavGroup;
      return { ...group, children: group.children.filter((c) => can(c.roles)) };
    })
    .filter((item) => "href" in item || (item as NavGroup).children.length > 0);
  // Số badge theo key
  const badgeFor = (key?: string) => (key === "consultation" ? consultCount : 0);
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
          {navForRole.map((item) => {
            if ("href" in item) {
              const link = item as NavLink;
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              const badge = badgeFor(link.badgeKey);
              return (
                <Link key={link.href} href={link.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.82rem] font-medium transition-colors ${active ? "bg-royal/8 text-royal" : "text-muted hover:bg-cream hover:text-royal"}`}>
                  <link.icon size={17} />
                  <span className="flex-1">{link.label}</span>
                  {badge > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[0.65rem] font-bold text-white">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              );
            }
            const group = item as NavGroup;
            const isOpen = openMenus.includes(group.label);
            const hasActive = group.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
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
                      const active = pathname === child.href || pathname.startsWith(child.href + "/");
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