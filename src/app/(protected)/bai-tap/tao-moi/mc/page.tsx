// FILE: src/app/(protected)/bai-tap/tao-moi/mc/page.tsx — Editor trắc nghiệm (nhiều câu)
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Check } from "lucide-react";
import { api } from "@/lib/api";
import ExerciseMeta, { MetaState, emptyMeta } from "@/components/exercise/ExerciseMeta";

interface MCQuestion {
  id: string;
  content: string;
  options: string[];
  correctIndex: number; // index đáp án đúng
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function newQuestion(): MCQuestion {
  return { id: `q${Date.now()}${Math.floor(Math.random() * 1000)}`, content: "", options: ["", ""], correctIndex: 0 };
}

export default function CreateMCPage() {
  const router = useRouter();
  const [meta, setMeta] = useState<MetaState>(emptyMeta());
  const [questions, setQuestions] = useState<MCQuestion[]>([newQuestion()]);
  const [saving, setSaving] = useState(false);

  function updateQ(idx: number, updater: (q: MCQuestion) => MCQuestion) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? updater(q) : q)));
  }
  function addQuestion() { setQuestions((prev) => [...prev, newQuestion()]); }
  function removeQuestion(idx: number) { setQuestions((prev) => prev.filter((_, i) => i !== idx)); }
  function addOption(qi: number) { updateQ(qi, (q) => ({ ...q, options: [...q.options, ""] })); }
  function removeOption(qi: number, oi: number) {
    updateQ(qi, (q) => {
      const options = q.options.filter((_, i) => i !== oi);
      let correctIndex = q.correctIndex;
      if (oi === correctIndex) correctIndex = 0;
      else if (oi < correctIndex) correctIndex -= 1;
      return { ...q, options, correctIndex };
    });
  }
  function setOption(qi: number, oi: number, val: string) {
    updateQ(qi, (q) => ({ ...q, options: q.options.map((o, i) => (i === oi ? val : o)) }));
  }

  async function handleSave() {
    if (!meta.title.trim()) return alert("Vui lòng nhập tiêu đề");
    if (questions.length === 0) return alert("Cần ít nhất 1 câu hỏi");
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) return alert(`Câu ${i + 1} chưa có nội dung`);
      const filled = q.options.filter((o) => o.trim());
      if (filled.length < 2) return alert(`Câu ${i + 1} cần ít nhất 2 lựa chọn`);
      if (!q.options[q.correctIndex]?.trim()) return alert(`Câu ${i + 1}: đáp án đúng đang để trống`);
    }
    setSaving(true);
    // Chuyển sang format backend: correctAnswer = chữ cái
    const payloadQuestions = questions.map((q) => ({
      id: q.id,
      content: q.content,
      options: q.options.filter((o) => o.trim()),
      correctAnswer: LETTERS[q.correctIndex],
    }));
    const data = await api.post("/interactive", {
      title: meta.title,
      description: meta.description,
      type: "MULTIPLE_CHOICE",
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
      <h2 className="mb-6 font-display text-2xl font-bold text-royal">📝 Tạo bài Trắc nghiệm</h2>

      <ExerciseMeta meta={meta} onChange={setMeta} />

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={q.id} className="card">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-royal">Câu {qi + 1}</span>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(qi)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
              )}
            </div>
            <input type="text" value={q.content} onChange={(e) => updateQ(qi, (x) => ({ ...x, content: e.target.value }))}
              placeholder="Nội dung câu hỏi..." className="input-field mb-3" />

            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const isCorrect = q.correctIndex === oi;
                return (
                  <div key={oi} className="flex items-center gap-2">
                    <button type="button" onClick={() => updateQ(qi, (x) => ({ ...x, correctIndex: oi }))}
                      title="Đánh dấu đáp án đúng"
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                        isCorrect ? "border-green-500 bg-green-500 text-white" : "border-silver/40 text-muted hover:border-green-400"
                      }`}>
                      {isCorrect ? <Check size={14} /> : LETTERS[oi]}
                    </button>
                    <input type="text" value={opt} onChange={(e) => setOption(qi, oi, e.target.value)}
                      placeholder={`Lựa chọn ${LETTERS[oi]}`}
                      className={`input-field flex-1 ${isCorrect ? "border-green-400 bg-green-50" : ""}`} />
                    {q.options.length > 2 && (
                      <button onClick={() => removeOption(qi, oi)} className="text-muted hover:text-red-500"><Trash2 size={14} /></button>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={() => addOption(qi)} className="mt-2 text-xs font-medium text-gold-dim hover:underline">+ Thêm lựa chọn</button>
            <p className="mt-2 text-[0.7rem] text-muted">Bấm vòng tròn bên trái để chọn đáp án đúng (đang đúng: {LETTERS[q.correctIndex]}).</p>
          </div>
        ))}
      </div>

      <button onClick={addQuestion} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gold/40 py-3 text-sm font-medium text-gold-dim hover:bg-gold/5">
        <Plus size={16} />Thêm câu hỏi
      </button>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-silver/20 pt-6">
        <Link href="/bai-tap" className="btn-secondary">Huỷ</Link>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Lưu bài tập
        </button>
      </div>
    </div>
  );
}