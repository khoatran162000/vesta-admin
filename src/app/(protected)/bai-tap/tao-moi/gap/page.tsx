// FILE: src/app/(protected)/bai-tap/tao-moi/gap/page.tsx — Editor bài GAP (LearnClick)
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import ExerciseMeta, { MetaState, emptyMeta } from "@/components/exercise/ExerciseMeta";
import GapEditor, { GapData } from "@/components/exercise/GapEditor";

export default function CreateGapPage() {
  const router = useRouter();
  const [meta, setMeta] = useState<MetaState>(emptyMeta());
  const [data, setData] = useState<GapData>({ content: "", gaps: {} });
  const [distractorsRaw, setDistractorsRaw] = useState("");
  const [saving, setSaving] = useState(false);

  const gapCount = Object.keys(data.gaps).length;
  const hasDrag = Object.values(data.gaps).some((g) => g.type === "DRAG");

  async function handleSave() {
    if (!meta.title.trim()) return alert("Vui lòng nhập tiêu đề");
    if (!data.content.trim()) return alert("Chưa có nội dung đoạn văn");
    if (gapCount === 0) return alert("Cần tạo ít nhất 1 chỗ trống (bôi đen từ rồi bấm + Ô điền / Dropdown / Kéo-thả)");

    // Kiểm tra từng gap có đáp án hợp lệ
    for (const [id, g] of Object.entries(data.gaps)) {
      if (!g.answers || g.answers.length === 0 || g.answers.every((a) => !a.trim())) {
        return alert(`Chỗ trống số ${id} chưa có đáp án. Bấm vào chip để nhập đáp án (nhiều đáp án ngăn bằng dấu #).`);
      }
      if (g.type === "DROPDOWN" && (!g.options || g.options.length < 2)) {
        return alert(`Chỗ trống số ${id} (Dropdown) cần ít nhất 2 lựa chọn (ngăn bằng dấu phẩy).`);
      }
    }

    const distractors = distractorsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

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
      timeLimit: meta.timeLimit === "" ? null : Number(meta.timeLimit),
      maxAttempts: meta.maxAttempts === "" ? null : Number(meta.maxAttempts),
    });
    setSaving(false);
    if (res.success) router.push("/bai-tap");
    else alert(res.message || "Lỗi tạo bài");
  }

  return (
    <div className="mx-auto max-w-[800px]">
      <Link href="/bai-tap/tao-moi" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal">
        <ArrowLeft size={15} />Chọn loại khác
      </Link>
      <h2 className="mb-6 font-display text-2xl font-bold text-royal">✏️ Tạo bài Điền vào chỗ trống</h2>

      <ExerciseMeta meta={meta} onChange={setMeta} />

      <div className="card">
        <div className="mb-1 text-sm font-bold text-royal">Nội dung bài</div>
        <p className="mb-3 text-xs text-muted">
          Gõ đoạn văn, bôi đen từ muốn ẩn rồi bấm nút tương ứng để biến thành chỗ trống.
          Ô điền = học viên gõ · Dropdown = chọn từ danh sách · Kéo-thả = kéo từ vào chỗ trống.
        </p>
        <GapEditor onChange={setData} />

        <div className="mt-3 text-xs text-muted">
          Đã tạo <b>{gapCount}</b> chỗ trống{hasDrag ? " · có chỗ kéo-thả" : ""}.
        </div>

        {hasDrag && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">
              Từ nhiễu cho kéo-thả (tuỳ chọn)
            </label>
            <input
              type="text"
              value={distractorsRaw}
              onChange={(e) => setDistractorsRaw(e.target.value)}
              placeholder="VD: cat, dog, fish (ngăn bằng dấu phẩy)"
              className="input-field"
            />
            <p className="mt-1 text-[0.7rem] text-muted">
              Các từ này hiện chung trong ngân hàng kéo-thả để gây nhiễu, không phải đáp án của chỗ nào.
            </p>
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