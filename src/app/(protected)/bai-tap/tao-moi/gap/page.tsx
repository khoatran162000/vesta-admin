// FILE: src/app/(protected)/bai-tap/tao-moi/gap/page.tsx — Editor bài GAP (LearnClick)
"use client";
import Link from "next/link";
import { ArrowLeft, TextCursorInput, ListChecks, ArrowLeftRight } from "lucide-react";

const TYPES = [
  {
    href: "/bai-tap/tao-moi/gap",
    icon: TextCursorInput,
    title: "Điền vào chỗ trống",
    sub: "Gap-fill / Dropdown / Kéo-thả",
    desc: "Bôi đen từ trong đoạn văn để biến thành chỗ trống. Học viên gõ, chọn dropdown hoặc kéo-thả.",
    color: "from-blue-500/10 to-blue-500/5 border-blue-200",
    ic: "bg-blue-100 text-blue-600",
  },
  {
    href: "/bai-tap/tao-moi/mc",
    icon: ListChecks,
    title: "Trắc nghiệm",
    sub: "Multiple Choice",
    desc: "Nhiều câu hỏi, mỗi câu có các lựa chọn A/B/C/D và một đáp án đúng.",
    color: "from-purple-500/10 to-purple-500/5 border-purple-200",
    ic: "bg-purple-100 text-purple-600",
  },
  {
    href: "/bai-tap/tao-moi/matching",
    icon: ArrowLeftRight,
    title: "Nối cột",
    sub: "Matching",
    desc: "Học viên nối từng mục ở cột trái với đáp án tương ứng ở cột phải (đã xáo trộn).",
    color: "from-amber-500/10 to-amber-500/5 border-amber-200",
    ic: "bg-amber-100 text-amber-600",
  },
];

export default function ChooseExerciseTypePage() {
  return (
    <div className="mx-auto max-w-[900px]">
      <Link href="/bai-tap" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal">
        <ArrowLeft size={15} />Quay lại danh sách
      </Link>
      <h2 className="mb-1 font-display text-2xl font-bold text-royal">Tạo bài tập tương tác</h2>
      <p className="mb-8 text-sm text-muted">Chọn loại bài tập bạn muốn tạo</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TYPES.map((t) => (
          <Link key={t.href} href={t.href}
            className={`group rounded-2xl border bg-gradient-to-br ${t.color} p-5 transition-all hover:shadow-md`}>
            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${t.ic}`}>
              <t.icon size={24} />
            </div>
            <div className="text-lg font-bold text-royal">{t.title}</div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t.sub}</div>
            <p className="text-sm text-[#4C4A54]">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}