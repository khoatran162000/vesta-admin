// FILE: src/app/(protected)/noi-dung-trang-chu/page.tsx — Hub nội dung tĩnh landing
"use client";
import Link from "next/link";
import { LayoutTemplate, ScrollText, Wallet, BookMarked, ChevronRight, ImagePlus, CalendarDays } from "lucide-react";

const BLOCKS = [
  { key: "hero", label: "Hero (banner đầu trang)", desc: "Tiêu đề lớn + slogan", icon: LayoutTemplate },
  { key: "philosophy", label: "Phong cách dạy & Nội quy", desc: "Các đoạn nội quy học viên", icon: ScrollText },
  { key: "tuition", label: "Thông tin học phí", desc: "Các ghi chú học phí + thông tin ngân hàng + QR", icon: Wallet },
  { key: "books_spark", label: "Mô tả SPARK (mục Sách)", desc: "Đoạn giới thiệu bộ SPARK", icon: BookMarked },
  { key: "logo", label: "Logo & Favicon", desc: "Logo trang + favicon (icon tab trình duyệt)", icon: ImagePlus },
  { key: "calendar_html", label: "Lịch làm bài (dán HTML cả năm)", desc: "Dán nguyên trang HTML lịch — HS xem trực tiếp", icon: CalendarDays },
];

export default function SiteContentHubPage() {
  return (
    <div className="mx-auto max-w-[820px]">
      <h2 className="font-display text-2xl font-bold text-royal">🏠 Nội Dung Trang Chủ</h2>
      <p className="mb-6 mt-1 text-sm text-muted">Các khối văn bản cố định trên landing. Bấm để sửa.</p>
      <div className="space-y-3">
        {BLOCKS.map((b) => {
          const Icon = b.icon;
          return (
            <Link key={b.key} href={`/noi-dung-trang-chu/${b.key}`}
              className="flex items-center gap-4 rounded-xl border border-silver/30 bg-white px-5 py-4 shadow-sm hover:border-gold/50 hover:bg-cream/40">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-royal/10 text-royal"><Icon size={20} /></span>
              <div className="flex-1">
                <div className="font-medium text-[#1a1a2e]">{b.label}</div>
                <div className="text-xs text-muted">{b.desc}</div>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}