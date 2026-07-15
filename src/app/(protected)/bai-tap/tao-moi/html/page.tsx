// FILE: src/app/(protected)/bai-tap/tao-moi/html/page.tsx — Tạo bài gap từ HTML (LearnClick)
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import ExerciseMeta, { MetaState, emptyMeta } from "@/components/exercise/ExerciseMeta";
import HtmlGapEditor, { GapData } from "@/components/exercise/HtmlGapEditor";

export default function CreateHtmlGapPage() {
  const router = useRouter();
  const [meta, setMeta] = useState<MetaState>(emptyMeta());
  const [data, setData] = useState<GapData>({ content: "", gaps: {} });
  const [distractorsRaw, setDistractorsRaw] = useState("");
  const [saving, setSaving] = useState(false);

  const gapCount = Object.keys(data.gaps).length;
  const hasDrag = Object.values(data.gaps).some((g) => g.type === "DRAG");

  async function handleSave() {
    if (!meta.title.trim()) return alert("Vui lòng nhập tiêu đề");
    if (!data.content.trim()) return alert("Chưa có nội dung bài");
    if (gapCount === 0) return alert("Cần ít nhất 1 chỗ trống (dán HTML có <a class=\"cloze\"> hoặc bôi đen + ⌘G)");

    for (const [id, g] of Object.entries(data.gaps)) {
      if (!g.answers || g.answers.length === 0 || g.answers.every((a) => !a.trim())) {
        return alert(`Chỗ trống số ${id} chưa có đáp án. Bấm vào chip để nhập.`);
      }
      if (g.type === "DROPDOWN" && (!g.options || g.options.length < 2)) {
        return alert(`Chỗ trống số ${id} (Dropdown) cần ít nhất 2 lựa chọn.`);
      }
    }

    const distractors = distractorsRaw.split(",").map((s) => s.trim()).filter(Boolean);

    setSaving(true);
    const res = await api.post("/interactive", {
      title: meta.title,
      description: meta.description,
      type: "CLOZE",
      questions: null,
      content: data.content,
      gaps: data.gaps,
      distractors: hasDrag && distractors.length > 0 ? distractors : null,
      visibility: meta.visibility,
      visibleTo: meta.visibility === "CLASS" ? meta.visibleTo.join(",") : null,
      isPublished: meta.isPublished,
    });
    setSaving(false);
    if (res.success) router.push("/bai-tap");
    else alert(res.message || "Lỗi tạo bài");
  }

  return (
    <div className="mx-auto max-w-[980px]">
      <Link href="/bai-tap/tao-moi" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal">
        <ArrowLeft size={15} />Chọn loại khác
      </Link>
      <h2 className="mb-1 font-display text-2xl font-bold text-royal">📋 Tạo bài từ HTML (LearnClick)</h2>
      <p className="mb-6 text-sm text-muted">Giữ nguyên bảng, màu, video của bài gốc. Dán HTML là có luôn cả trăm chỗ trống.</p>

      <ExerciseMeta meta={meta} onChange={setMeta} />

      <div className="card">
        <div className="mb-3 text-sm font-bold text-royal">Nội dung bài</div>
        <HtmlGapEditor onChange={setData} />

        {hasDrag && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Từ nhiễu cho kéo-thả (tuỳ chọn)</label>
            <input type="text" value={distractorsRaw} onChange={(e) => setDistractorsRaw(e.target.value)}
              placeholder="VD: cat, dog, fish (ngăn bằng dấu phẩy)" className="input-field" />
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-silver/20 pt-6">
        <Link href="/bai-tap" className="btn-secondary">Huỷ</Link>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Lưu bài tập
        </button>
      </div>
    </div>
  );
}