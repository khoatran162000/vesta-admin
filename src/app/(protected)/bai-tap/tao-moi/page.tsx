// FILE: src/app/(protected)/bai-tap/tao-moi/page.tsx — Tạo bài tập LearnClick (gap)
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import GapEditor, { GapData } from "@/components/exercise/GapEditor";

const COURSES = ["5+", "6+", "7+", "1-1", "Intensive", "Writing", "Chuyên Cấp 3"];

export default function CreateExercisePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [visibleTo, setVisibleTo] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [gapData, setGapData] = useState<GapData>({ content: "", gaps: {} });
  const [distractors, setDistractors] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleClass(c: string) {
    setVisibleTo((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  // Có gap nào loại DRAG không → hiện ô từ nhiễu
  const hasDragGap = Object.values(gapData.gaps).some((g) => g.type === "DRAG");

  async function handleSave() {
    if (!title.trim()) return alert("Vui lòng nhập tiêu đề");
    const gapIds = Object.keys(gapData.gaps);
    if (gapIds.length === 0) return alert("Hãy tạo ít nhất 1 chỗ trống (bôi đen từ rồi bấm + Ô điền)");
    // Validate: mỗi gap phải có đáp án
    for (const id of gapIds) {
      const g = gapData.gaps[id];
      if (!g.answers || g.answers.length === 0) {
        return alert(`Chỗ trống #${id} chưa có đáp án. Bấm vào chip để nhập đáp án.`);
      }
      if (g.type === "DROPDOWN" && (!g.options || g.options.length < 2)) {
        return alert(`Dropdown #${id} cần ít nhất 2 lựa chọn.`);
      }
    }

    setSaving(true);
    const distractorArr = distractors.split(",").map((s) => s.trim()).filter(Boolean);
    const data = await api.post("/interactive", {
      title,
      description,
      type: "CLOZE",
      content: gapData.content,
      gaps: gapData.gaps,
      distractors: hasDragGap && distractorArr.length ? distractorArr : null,
      questions: [],
      visibility,
      visibleTo: visibility === "CLASS" ? visibleTo.join(",") : null,
      isPublished,
    });
    setSaving(false);
    if (data.success) router.push("/bai-tap");
    else alert(data.message || "Lỗi tạo bài tập");
  }

  return (
    <div className="mx-auto max-w-[800px]">
      <Link href="/bai-tap" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal">
        <ArrowLeft size={15} />Quay lại
      </Link>
      <h2 className="mb-6 font-display text-2xl font-bold text-royal">🎯 Tạo Bài Tập Tương Tác</h2>

      {/* Thông tin chung */}
      <div className="card mb-6">
        <h3 className="mb-4 font-display text-lg font-bold text-royal">Thông tin chung</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Tiêu đề</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Cloze Reading - Unit 5" className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Mô tả</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Phân quyền</label>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="input-field">
              <option value="PUBLIC">Công khai (ai cũng thấy)</option>
              <option value="STUDENT">Chỉ học viên</option>
              <option value="TEACHER">Chỉ giáo viên</option>
              <option value="CLASS">Theo lớp cụ thể</option>
            </select>
          </div>
          {visibility === "CLASS" && (
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">Hiện cho lớp</label>
              <div className="flex flex-wrap gap-2">
                {COURSES.map((c) => (
                  <button key={c} type="button" onClick={() => toggleClass(c)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${visibleTo.includes(c) ? "bg-royal text-white" : "bg-cream text-muted hover:bg-cream-dark"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4" />
            <span className="text-[#1a1a2e]">Đăng ngay (nếu không tick sẽ lưu nháp)</span>
          </label>
        </div>
      </div>

      {/* Soạn nội dung gap */}
      <div className="card mb-6">
        <h3 className="mb-2 font-display text-lg font-bold text-royal">Soạn nội dung</h3>
        <p className="mb-3 text-sm text-muted">
          Gõ hoặc dán đoạn văn. Bôi đen từ muốn ẩn rồi bấm nút để tạo chỗ trống. Bấm vào chip để chỉnh đáp án.
        </p>
        <GapEditor onChange={setGapData} />

        {hasDragGap && (
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
              Từ nhiễu cho kéo-thả (ngăn bằng dấu , — không bắt buộc)
            </label>
            <input type="text" value={distractors} onChange={(e) => setDistractors(e.target.value)}
              placeholder="vd: winter, autumn, summer" className="input-field" />
            <p className="mt-1 text-xs text-muted">Các từ này trộn vào ngân hàng từ để tăng độ khó.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-silver/20 pt-6">
        <Link href="/bai-tap" className="btn-secondary">Huỷ</Link>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Lưu bài tập
        </button>
      </div>
    </div>
  );
}