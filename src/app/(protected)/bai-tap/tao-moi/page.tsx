// FILE: src/app/(protected)/bai-tap/tao-moi/page.tsx — Tạo bài tập tương tác
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, Loader2, GripVertical } from "lucide-react";
import { api } from "@/lib/api";

const EXERCISE_TYPES = [
  { value: "QUIZ", label: "Trắc nghiệm (Quiz)" },
  { value: "FILL_BLANK", label: "Điền vào chỗ trống" },
  { value: "MATCHING", label: "Nối câu (Matching)" },
  { value: "VOCAB_CHECK", label: "Kiểm tra từ vựng" },
];
const COURSES = ["5+", "6+", "7+", "1-1", "Intensive", "Writing", "Chuyên Cấp 3"];

interface Question {
  id: string;
  content: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function CreateExercisePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("QUIZ");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [visibleTo, setVisibleTo] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    { id: "q1", content: "", options: ["", "", "", ""], correctAnswer: "", explanation: "" },
  ]);
  const [saving, setSaving] = useState(false);

  function addQuestion() {
    setQuestions([...questions, { id: `q${Date.now()}`, content: "", options: ["", "", "", ""], correctAnswer: "", explanation: "" }]);
  }
  function removeQuestion(id: string) { setQuestions(questions.filter((q) => q.id !== id)); }
  function updateQuestion(id: string, field: keyof Question, value: any) {
    setQuestions(questions.map((q) => q.id === id ? { ...q, [field]: value } : q));
  }
  function updateOption(qId: string, optIndex: number, value: string) {
    setQuestions(questions.map((q) => {
      if (q.id !== qId) return q;
      const opts = [...q.options];
      opts[optIndex] = value;
      return { ...q, options: opts };
    }));
  }
  function toggleClass(c: string) {
    setVisibleTo((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  async function handleSave() {
    if (!title.trim()) return alert("Vui lòng nhập tiêu đề");
    if (questions.some((q) => !q.content.trim())) return alert("Vui lòng điền nội dung tất cả câu hỏi");

    setSaving(true);
    const data = await api.post("/interactive", {
      title, description, type, questions,
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

      <div className="card mb-6">
        <h3 className="mb-4 font-display text-lg font-bold text-royal">Thông tin chung</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Tiêu đề</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Quiz Reading - Unit 5" className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Mô tả</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Loại bài tập</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
                {EXERCISE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
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
          </div>

          {visibility === "CLASS" && (
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">Hiện cho lớp</label>
              <div className="flex flex-wrap gap-2">
                {COURSES.map((c) => (
                  <button key={c} onClick={() => toggleClass(c)}
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

      <div className="mb-6 space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="card">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-bold text-royal">
                <GripVertical size={16} className="text-muted" />Câu {i + 1}
              </h4>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(q.id)} className="text-muted hover:text-red-600"><Trash2 size={16} /></button>
              )}
            </div>

            <div className="space-y-3">
              <textarea value={q.content} onChange={(e) => updateQuestion(q.id, "content", e.target.value)} placeholder="Nội dung câu hỏi..." rows={2} className="input-field resize-none" />

              {(type === "QUIZ" || type === "VOCAB_CHECK") && (
                <div className="space-y-2">
                  {q.options.map((opt, j) => {
                    const letter = String.fromCharCode(65 + j);
                    const isCorrect = q.correctAnswer === letter;
                    return (
                      <div key={j} className="flex items-center gap-2">
                        <button onClick={() => updateQuestion(q.id, "correctAnswer", letter)}
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${isCorrect ? "bg-green-500 text-white" : "bg-cream text-muted"}`}
                          title="Bấm để chọn đáp án đúng">
                          {letter}
                        </button>
                        <input type="text" value={opt} onChange={(e) => updateOption(q.id, j, e.target.value)} placeholder={`Đáp án ${letter}`}
                          className="flex-1 rounded-lg border border-silver/40 px-3 py-1.5 text-sm outline-none focus:border-gold" />
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted">💡 Bấm vào chữ cái để chọn đáp án đúng (hiện xanh)</p>
                </div>
              )}

              {type === "FILL_BLANK" && (
                <input type="text" value={q.correctAnswer} onChange={(e) => updateQuestion(q.id, "correctAnswer", e.target.value)}
                  placeholder="Đáp án đúng (text)"
                  className="w-full rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm outline-none focus:border-green-500" />
              )}

              <input type="text" value={q.explanation} onChange={(e) => updateQuestion(q.id, "explanation", e.target.value)}
                placeholder="Giải thích (hiện sau khi học viên trả lời)"
                className="w-full rounded-lg border border-gold/30 bg-gold/5 px-3 py-2 text-sm outline-none focus:border-gold" />
            </div>
          </div>
        ))}

        <button onClick={addQuestion}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-silver/40 py-3 text-sm font-medium text-muted hover:border-gold/50 hover:text-royal">
          <Plus size={16} />Thêm câu hỏi
        </button>
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
