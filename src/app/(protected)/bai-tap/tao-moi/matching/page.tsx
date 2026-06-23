// FILE: src/app/(protected)/bai-tap/tao-moi/matching/page.tsx — Editor nối cột (Matching)
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, Trash2, ArrowLeftRight } from "lucide-react";
import { api } from "@/lib/api";
import ExerciseMeta, { MetaState, emptyMeta } from "@/components/exercise/ExerciseMeta";

interface Pair { id: string; left: string; right: string; }

function newPair(): Pair {
  return { id: `m${Date.now()}${Math.floor(Math.random() * 1000)}`, left: "", right: "" };
}

export default function CreateMatchingPage() {
  const router = useRouter();
  const [meta, setMeta] = useState<MetaState>(emptyMeta());
  const [pairs, setPairs] = useState<Pair[]>([newPair(), newPair()]);
  const [saving, setSaving] = useState(false);

  function updatePair(idx: number, field: "left" | "right", val: string) {
    setPairs((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: val } : p)));
  }
  function addPair() { setPairs((prev) => [...prev, newPair()]); }
  function removePair(idx: number) { setPairs((prev) => prev.filter((_, i) => i !== idx)); }

  async function handleSave() {
    if (!meta.title.trim()) return alert("Vui lòng nhập tiêu đề");
    const filled = pairs.filter((p) => p.left.trim() && p.right.trim());
    if (filled.length < 2) return alert("Cần ít nhất 2 cặp nối hoàn chỉnh (cả 2 cột)");
    for (let i = 0; i < pairs.length; i++) {
      const p = pairs[i];
      if ((p.left.trim() && !p.right.trim()) || (!p.left.trim() && p.right.trim())) {
        return alert(`Cặp ${i + 1} thiếu một vế. Điền đủ cả 2 cột hoặc xoá cặp đó.`);
      }
    }
    // Cảnh báo nếu có vế phải trùng nhau (nối cột sẽ nhập nhằng)
    const rights = filled.map((p) => p.right.trim());
    if (new Set(rights).size !== rights.length) {
      if (!confirm("Có 2 đáp án cột phải trùng nhau — học viên có thể nối nhầm mà vẫn đúng. Vẫn lưu?")) return;
    }
    setSaving(true);
    const payloadQuestions = filled.map((p) => ({ id: p.id, left: p.left.trim(), right: p.right.trim() }));
    const data = await api.post("/interactive", {
      title: meta.title,
      description: meta.description,
      type: "MATCHING",
      questions: payloadQuestions,
      content: null,
      gaps: null,
      distractors: null,
      visibility: meta.visibility,
      visibleTo: meta.visibility === "CLASS" ? meta.visibleTo.join(",") : null,
      isPublished: meta.isPublished,
    });
    setSaving(false);
    if (data.success) router.push("/bai-tap");
    else alert(data.message || "Lỗi tạo bài");
  }

  return (
    <div className="mx-auto max-w-[800px]">
      <Link href="/bai-tap/tao-moi" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal">
        <ArrowLeft size={15} />Chọn loại khác
      </Link>
      <h2 className="mb-6 font-display text-2xl font-bold text-royal">🔗 Tạo bài Nối cột</h2>

      <ExerciseMeta meta={meta} onChange={setMeta} />

      <div className="card">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-royal">
          <ArrowLeftRight size={16} />Các cặp nối
        </div>
        <p className="mb-4 text-xs text-muted">Cột trái hiện cố định, cột phải sẽ được xáo trộn khi học viên làm. Mỗi cặp đúng = 1 điểm.</p>

        {/* Header 2 cột */}
        <div className="mb-2 grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 text-[0.7rem] font-bold uppercase text-muted">
          <span>Cột trái (đề)</span><span></span><span>Cột phải (đáp án)</span><span></span>
        </div>

        <div className="space-y-2">
          {pairs.map((p, i) => (
            <div key={p.id} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
              <input type="text" value={p.left} onChange={(e) => updatePair(i, "left", e.target.value)}
                placeholder="VD: Dog" className="input-field" />
              <ArrowLeftRight size={14} className="text-muted" />
              <input type="text" value={p.right} onChange={(e) => updatePair(i, "right", e.target.value)}
                placeholder="VD: Chó" className="input-field" />
              {pairs.length > 2 ? (
                <button onClick={() => removePair(i)} className="text-muted hover:text-red-500"><Trash2 size={15} /></button>
              ) : <span className="w-[15px]" />}
            </div>
          ))}
        </div>

        <button onClick={addPair} className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gold-dim hover:underline">
          <Plus size={14} />Thêm cặp
        </button>
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