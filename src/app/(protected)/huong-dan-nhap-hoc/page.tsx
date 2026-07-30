// FILE: src/app/(protected)/huong-dan-nhap-hoc/page.tsx — Hub 5 trang hướng dẫn nhập học
"use client";
import Link from "next/link";
import { GraduationCap, ChevronRight } from "lucide-react";
const GUIDES = [
  { key: "enroll_ielts4plus", label: "IELTS 4+", slug: "ielts4plus" },
  { key: "enroll_ielts5plus", label: "IELTS 5+", slug: "ielts5plus" },
  { key: "enroll_ielts6plus", label: "IELTS 6+", slug: "ielts6plus" },
  { key: "enroll_ielts7plus", label: "IELTS 7+", slug: "ielts7plus" },
  { key: "enroll_intensive", label: "789 Intensive", slug: "intensive" },
];
export default function EnrollGuideHubPage() {
  return (
    <div className="mx-auto max-w-[820px]">
      <h2 className="font-display text-2xl font-bold text-royal">📋 Hướng Dẫn Nhập Học</h2>
      <p className="mb-6 mt-1 text-sm text-muted">
        Nội dung trang &quot;Chi tiết &amp; Hướng dẫn nhập học&quot; cho từng khoá (HS xem khi bấm nút trên thẻ lớp). Bấm để sửa.
      </p>
      <div className="space-y-3">
        {GUIDES.map((g) => (
          <Link key={g.key} href={`/huong-dan-nhap-hoc/${g.slug}`}
            className="flex items-center gap-4 rounded-xl border border-silver/30 bg-white px-5 py-4 shadow-sm hover:border-gold/50 hover:bg-cream/40">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-royal/10 text-royal"><GraduationCap size={20} /></span>
            <div className="flex-1">
              <div className="font-medium text-[#1a1a2e]">{g.label}</div>
              <div className="text-xs text-muted">/nhap-hoc/{g.slug}</div>
            </div>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}