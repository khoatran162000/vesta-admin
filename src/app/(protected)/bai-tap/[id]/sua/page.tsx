// FILE: src/app/(protected)/bai-tap/[id]/sua/page.tsx — Sửa bài tập tương tác (CLOZE / MC / MATCHING)
"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Check, ArrowLeftRight } from "lucide-react";
import { api } from "@/lib/api";
import ExerciseMeta, { MetaState, emptyMeta } from "@/components/exercise/ExerciseMeta";
import GapEditor, { GapData } from "@/components/exercise/GapEditor";
import { useAuth } from "@/hooks/useAuth";
import HtmlGapEditor from "@/components/exercise/HtmlGapEditor";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const GAP_TYPES = ["CLOZE", "CLOZE_TEXT", "GAP"]; // các type coi là bài gap

interface MCQuestion { id: string; content: string; options: string[]; correctIndex: number; }
interface Pair { id: string; left: string; right: string; }

function metaFromExercise(ex: any): MetaState {
  return {
    title: ex.title || "",
    description: ex.description || "",
    visibility: ex.visibility || "PUBLIC",
    visibleTo: ex.visibleTo ? String(ex.visibleTo).split(",").map((s: string) => s.trim()).filter(Boolean) : [],
    isPublished: !!ex.isPublished,
  };
}

export default function EditExercisePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<string>("");
  const [meta, setMeta] = useState<MetaState>(emptyMeta());

  // gap
  const [gapData, setGapData] = useState<GapData>({ content: "", gaps: {} });
  const [gapInitial, setGapInitial] = useState<GapData | undefined>(undefined);
  const [distractorsRaw, setDistractorsRaw] = useState("");

  // mc
  const [mcQuestions, setMcQuestions] = useState<MCQuestion[]>([]);
  // matching
  const [pairs, setPairs] = useState<Pair[]>([]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  // GV gõ thẳng URL /sua → đá sang trang xem (backend cũng đã chặn PUT)
  useEffect(() => {
    if (!authLoading && user && user.role !== "ADMIN") {
      router.replace(`/bai-tap/${id}/xem`);
    }
  }, [authLoading, user, id, router]);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await api.get(`/interactive/${id}`);
    if (!res.success) { setError(res.message || "Không tải được bài"); setLoading(false); return; }
    const ex = res.data;
    setType(ex.type);
    setMeta(metaFromExercise(ex));

    const gaps = ex.gaps ? (typeof ex.gaps === "string" ? JSON.parse(ex.gaps) : ex.gaps) : null;
    const questions = ex.questions ? (typeof ex.questions === "string" ? JSON.parse(ex.questions) : ex.questions) : [];

    if ((gaps && Object.keys(gaps).length > 0) || GAP_TYPES.includes(ex.type)) {
      const gd: GapData = { content: ex.content || "", gaps: gaps || {} };
      setGapInitial(gd);
      setGapData(gd);
      const dist = ex.distractors ? (typeof ex.distractors === "string" ? JSON.parse(ex.distractors) : ex.distractors) : [];
      setDistractorsRaw(Array.isArray(dist) ? dist.join(", ") : "");
    } else if (ex.type === "MATCHING") {
      setPairs((Array.isArray(questions) ? questions : []).map((q: any) => ({
        id: q.id || `m${Math.random()}`, left: q.left || "", right: q.right || "",
      })));
    } else {
      // MULTIPLE_CHOICE
      setMcQuestions((Array.isArray(questions) ? questions : []).map((q: any) => {
        const options: string[] = Array.isArray(q.options) ? q.options : [];
        let correctIndex = 0;
        if (typeof q.correctAnswer === "string") {
          const byLetter = LETTERS.indexOf(q.correctAnswer);
          if (byLetter >= 0) correctIndex = byLetter;
          else { const byVal = options.indexOf(q.correctAnswer); if (byVal >= 0) correctIndex = byVal; }
        }
        return { id: q.id || `q${Math.random()}`, content: q.content || "", options: options.length ? options : ["", ""], correctIndex };
      }));
    }
    setLoading(false);
  }

  const isGap = (gapData && Object.keys(gapData.gaps).length >= 0) && (GAP_TYPES.includes(type) || Object.keys(gapData.gaps).length > 0);
  const hasDrag = Object.values(gapData.gaps).some((g) => g.type === "DRAG");
  // content có thẻ HTML → dùng editor HTML (TipTap sẽ nuốt mất bảng/màu/iframe)
  const isHtmlGap = /<[a-z][\s\S]*>/i.test(gapInitial?.content || "");

  // ---- MC helpers ----
  function updateQ(idx: number, updater: (q: MCQuestion) => MCQuestion) {
    setMcQuestions((prev) => prev.map((q, i) => (i === idx ? updater(q) : q)));
  }
  function addQuestion() { setMcQuestions((p) => [...p, { id: `q${Date.now()}`, content: "", options: ["", ""], correctIndex: 0 }]); }
  function removeQuestion(i: number) { setMcQuestions((p) => p.filter((_, x) => x !== i)); }
  function addOption(qi: number) { updateQ(qi, (q) => ({ ...q, options: [...q.options, ""] })); }
  function removeOption(qi: number, oi: number) {
    updateQ(qi, (q) => {
      const options = q.options.filter((_, i) => i !== oi);
      let correctIndex = q.correctIndex;
      if (oi === correctIndex) correctIndex = 0; else if (oi < correctIndex) correctIndex -= 1;
      return { ...q, options, correctIndex };
    });
  }
  function setOption(qi: number, oi: number, v: string) { updateQ(qi, (q) => ({ ...q, options: q.options.map((o, i) => (i === oi ? v : o)) })); }

  // ---- Matching helpers ----
  function updatePair(i: number, f: "left" | "right", v: string) { setPairs((p) => p.map((x, idx) => (idx === i ? { ...x, [f]: v } : x))); }
  function addPair() { setPairs((p) => [...p, { id: `m${Date.now()}`, left: "", right: "" }]); }
  function removePair(i: number) { setPairs((p) => p.filter((_, x) => x !== i)); }

  async function handleSave() {
    if (!meta.title.trim()) return alert("Vui lòng nhập tiêu đề");

    let body: any = {
      title: meta.title,
      description: meta.description,
      visibility: meta.visibility,
      visibleTo: meta.visibility === "CLASS" ? meta.visibleTo.join(",") : null,
      isPublished: meta.isPublished,
    };

    if (isGap) {
      if (!gapData.content.trim()) return alert("Chưa có nội dung đoạn văn");
      if (Object.keys(gapData.gaps).length === 0) return alert("Cần ít nhất 1 chỗ trống");
      for (const [gid, g] of Object.entries(gapData.gaps)) {
        if (!g.answers || g.answers.length === 0 || g.answers.every((a) => !a.trim()))
          return alert(`Chỗ trống số ${gid} chưa có đáp án.`);
        if (g.type === "DROPDOWN" && (!g.options || g.options.length < 2))
          return alert(`Chỗ trống số ${gid} (Dropdown) cần ít nhất 2 lựa chọn.`);
      }
      const distractors = distractorsRaw.split(",").map((s) => s.trim()).filter(Boolean);
      body = { ...body, questions: null, content: gapData.content, gaps: gapData.gaps,
        distractors: hasDrag && distractors.length > 0 ? distractors : null };
    } else if (type === "MATCHING") {
      const filled = pairs.filter((p) => p.left.trim() && p.right.trim());
      if (filled.length < 2) return alert("Cần ít nhất 2 cặp nối hoàn chỉnh");
      body = { ...body, gaps: undefined, content: null,
        questions: filled.map((p) => ({ id: p.id, left: p.left.trim(), right: p.right.trim() })) };
    } else {
      if (mcQuestions.length === 0) return alert("Cần ít nhất 1 câu hỏi");
      for (let i = 0; i < mcQuestions.length; i++) {
        const q = mcQuestions[i];
        if (!q.content.trim()) return alert(`Câu ${i + 1} chưa có nội dung`);
        if (q.options.filter((o) => o.trim()).length < 2) return alert(`Câu ${i + 1} cần ít nhất 2 lựa chọn`);
        if (!q.options[q.correctIndex]?.trim()) return alert(`Câu ${i + 1}: đáp án đúng đang để trống`);
      }
      body = { ...body, gaps: undefined, content: null,
        questions: mcQuestions.map((q) => ({ id: q.id, content: q.content, options: q.options.filter((o) => o.trim()), correctAnswer: LETTERS[q.correctIndex] })) };
    }

    setSaving(true);
    const res = await api.put(`/interactive/${id}`, body);
    setSaving(false);
    if (res.success) router.push("/bai-tap");
    else alert(res.message || "Lỗi cập nhật");
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  if (error) return (
    <div className="mx-auto max-w-[700px]">
      <Link href="/bai-tap" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal"><ArrowLeft size={15} />Quay lại danh sách</Link>
      <div className="card text-sm text-red-600">{error}</div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[800px]">
      <Link href="/bai-tap" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal"><ArrowLeft size={15} />Quay lại danh sách</Link>
      <h2 className="mb-6 font-display text-2xl font-bold text-royal">✏️ Sửa bài tập <span className="text-base font-normal text-muted">({type})</span></h2>

      <ExerciseMeta meta={meta} onChange={setMeta} />

      {isGap && (
        <div className="card">
          <div className="mb-1 text-sm font-bold text-royal">Nội dung bài</div>
          <p className="mb-3 text-xs text-muted">
            {isHtmlGap ? "Bài HTML (LearnClick) — bôi đen rồi ⌘G để tạo chỗ trống. Bấm chip để sửa đáp án." : "Bôi đen từ rồi bấm nút để tạo/sửa chỗ trống. Bấm vào chip để sửa đáp án."}
          </p>
          {gapInitial && (isHtmlGap
            ? <HtmlGapEditor initial={gapInitial} onChange={setGapData} />
            : <GapEditor initial={gapInitial} onChange={setGapData} />)}
          <div className="mt-3 text-xs text-muted">Đang có <b>{Object.keys(gapData.gaps).length}</b> chỗ trống{hasDrag ? " · có kéo-thả" : ""}.</div>
          {hasDrag && (
            <div className="mt-4">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Từ nhiễu cho kéo-thả (tuỳ chọn)</label>
              <input type="text" value={distractorsRaw} onChange={(e) => setDistractorsRaw(e.target.value)} placeholder="VD: cat, dog, fish" className="input-field" />
            </div>
          )}
        </div>
      )}

      {!isGap && type === "MATCHING" && (
        <div className="card">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-royal"><ArrowLeftRight size={16} />Các cặp nối</div>
          <div className="space-y-2">
            {pairs.map((p, i) => (
              <div key={p.id} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                <input type="text" value={p.left} onChange={(e) => updatePair(i, "left", e.target.value)} placeholder="VD: Dog" className="input-field" />
                <ArrowLeftRight size={14} className="text-muted" />
                <input type="text" value={p.right} onChange={(e) => updatePair(i, "right", e.target.value)} placeholder="VD: Chó" className="input-field" />
                {pairs.length > 2 ? <button onClick={() => removePair(i)} className="text-muted hover:text-red-500"><Trash2 size={15} /></button> : <span className="w-[15px]" />}
              </div>
            ))}
          </div>
          <button onClick={addPair} className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gold-dim hover:underline"><Plus size={14} />Thêm cặp</button>
        </div>
      )}

      {!isGap && type !== "MATCHING" && (
        <div className="space-y-4">
          {mcQuestions.map((q, qi) => (
            <div key={q.id} className="card">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-royal">Câu {qi + 1}</span>
                {mcQuestions.length > 1 && <button onClick={() => removeQuestion(qi)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>}
              </div>
              <input type="text" value={q.content} onChange={(e) => updateQ(qi, (x) => ({ ...x, content: e.target.value }))} placeholder="Nội dung câu hỏi..." className="input-field mb-3" />
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isCorrect = q.correctIndex === oi;
                  return (
                    <div key={oi} className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQ(qi, (x) => ({ ...x, correctIndex: oi }))}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${isCorrect ? "border-green-500 bg-green-500 text-white" : "border-silver/40 text-muted hover:border-green-400"}`}>
                        {isCorrect ? <Check size={14} /> : LETTERS[oi]}
                      </button>
                      <input type="text" value={opt} onChange={(e) => setOption(qi, oi, e.target.value)} placeholder={`Lựa chọn ${LETTERS[oi]}`}
                        className={`input-field flex-1 ${isCorrect ? "border-green-400 bg-green-50" : ""}`} />
                      {q.options.length > 2 && <button onClick={() => removeOption(qi, oi)} className="text-muted hover:text-red-500"><Trash2 size={14} /></button>}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => addOption(qi)} className="mt-2 text-xs font-medium text-gold-dim hover:underline">+ Thêm lựa chọn</button>
            </div>
          ))}
          <button onClick={addQuestion} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gold/40 py-3 text-sm font-medium text-gold-dim hover:bg-gold/5"><Plus size={16} />Thêm câu hỏi</button>
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-silver/20 pt-6">
        <Link href="/bai-tap" className="btn-secondary">Huỷ</Link>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Lưu thay đổi
        </button>
      </div>
    </div>
  );
}