// FILE: src/app/(protected)/ngan-hang-de/de-thi/[examId]/cau-hoi/tao-moi/page.tsx — Them cau hoi (co media)
"use client";
import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X, ImagePlus, Headphones } from "lucide-react";
import Link from "next/link";
import { api, getImageUrl } from "@/lib/api";
import QuestionContentEditor from "@/components/exam/QuestionContentEditor";
import HtmlGapEditor, { GapData, HtmlGapEditorHandle } from "@/components/exercise/HtmlGapEditor";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";

export default function CreateQuestionPage() {
  useRequireAdmin("/ngan-hang-de/de-thi");
  const params = useParams();
  const examId = params.examId as string;
  const router = useRouter();
  const [type, setType] = useState("MULTIPLE_CHOICE");
  const [content, setContent] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState<any>("");
  const [explanation, setExplanation] = useState("");
  const [score, setScore] = useState("1");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaType, setMediaType] = useState<"none" | "image" | "audio">("none");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [addAnother, setAddAnother] = useState(true);
  // FILL_IN_BLANK: "single" = 1 ô như cũ | "multi" = nhiều gap (dán HTML LearnClick)
  const [fillMode, setFillMode] = useState<"single" | "multi">("single");
  const [gapData, setGapData] = useState<GapData>({ content: "", gaps: {} });
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const gapEditorRef = useRef<HtmlGapEditorHandle>(null);

  function updateOption(i: number, val: string) { const o = [...options]; o[i] = val; setOptions(o); }
  function addOption() { setOptions([...options, ""]); }
  function removeOption(i: number) { setOptions(options.filter((_, idx) => idx !== i)); }

  // Câu FILL nhiều gap đang bật?
  const isMultiGap = type === "FILL_IN_BLANK" && fillMode === "multi";
  const gapCount = Object.keys(gapData.gaps || {}).length;

  // Upload media (image or audio)
  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Detect type
    const isAudio = file.type.startsWith("audio/");
    const isImage = file.type.startsWith("image/");
    if (!isAudio && !isImage) { setError("Chỉ hỗ trợ file ảnh hoặc audio"); return; }
    const formData = new FormData();
    formData.append("image", file);
    try {
      const data = await api.post("/posts/upload-image", formData);
      if (data.success) {
        setMediaUrl(data.data.url);
        setMediaPreview(isImage ? getImageUrl(data.data.url) : "");
        setMediaType(isAudio ? "audio" : "image");
      }
    } catch { setError("Lỗi upload media"); }
    e.target.value = "";
  }
  function removeMedia() { setMediaUrl(""); setMediaPreview(""); setMediaType("none"); }

  async function handleSave() {
    // Câu nhiều gap: đọc THẲNG từ DOM editor qua ref (state gapData có thể lệch sau chèn/xoá ảnh)
    const liveGap = isMultiGap ? (gapEditorRef.current?.getData() ?? gapData) : gapData;
    const finalContent = isMultiGap ? liveGap.content : content;
    if (!finalContent) { setError(isMultiGap ? "Chưa có nội dung bài (dán HTML hoặc tạo chỗ trống)" : "Vui lòng nhập nội dung câu hỏi"); return; }

    // Chặn sớm: thiếu đáp án thì báo rõ, đừng để backend trả lỗi chung
    if (type === "MULTIPLE_CHOICE") {
      const validOptions = options.filter(Boolean);
      if (validOptions.length < 2) { setError("Cần ít nhất 2 đáp án cho câu trắc nghiệm"); return; }
      if (!String(correctAnswer ?? "").trim()) { setError("Chọn radio để đánh dấu đáp án đúng"); return; }
    } else if (isMultiGap) {
      if (Object.keys(liveGap.gaps || {}).length < 1) { setError("Bài chưa có chỗ trống nào — bôi đen + ⌘G hoặc dán HTML LearnClick"); return; }
    } else if (type !== "ESSAY") {
      if (!String(correctAnswer ?? "").trim()) { setError("Vui lòng nhập đáp án đúng"); return; }
    }

    setSaving(true); setError("");
    try {
      const body: any = { examId, type, content: finalContent, explanation, score: parseFloat(score), mediaUrl: mediaUrl || null };
      if (type === "MULTIPLE_CHOICE") { body.options = options.filter(Boolean); body.correctAnswer = correctAnswer; }
      else if (type === "FILL_IN_BLANK") {
        if (isMultiGap) { body.gaps = gapData.gaps; body.correctAnswer = {}; }  // đáp án nằm trong gaps
        else { body.correctAnswer = correctAnswer; }
      }
      else if (type === "ESSAY") { body.correctAnswer = { type: "manual" }; }
      else { body.correctAnswer = correctAnswer; }
      const data = await api.post("/questions", body);
      if (data.success) {
        if (addAnother) {
          setContent(""); setOptions(["", "", "", ""]); setCorrectAnswer(""); setExplanation("");
          setMediaUrl(""); setMediaPreview(""); setMediaType("none");
          setGapData({ content: "", gaps: {} });
        } else { router.push(`/ngan-hang-de/de-thi/${examId}/cau-hoi`); }
      } else { setError(data.message); }
    } catch { setError("Lỗi server"); } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/ngan-hang-de/de-thi/${examId}/cau-hoi`} className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <h2 className="font-display text-2xl font-bold text-royal">Thêm câu hỏi</h2>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="space-y-5">
        {/* Type + Score */}
        <div className="card grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-royal">Loại câu hỏi</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
              <option value="MULTIPLE_CHOICE">Trắc nghiệm (Multiple Choice)</option>
              <option value="FILL_IN_BLANK">Điền từ (Fill in Blank)</option>
              <option value="MATCHING">Nối câu (Matching)</option>
              <option value="ESSAY">Tự luận (Essay)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-royal">Điểm</label>
            <input type="number" value={score} onChange={(e) => setScore(e.target.value)} className="input-field" step="0.5" />
          </div>
        </div>

        {/* Chọn chế độ cho FILL_IN_BLANK */}
        {type === "FILL_IN_BLANK" && (
          <div className="card">
            <label className="mb-2 block text-sm font-medium text-royal">Kiểu điền từ</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFillMode("single")}
                className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${fillMode === "single" ? "border-gold bg-gold/10 text-royal" : "border-silver/40 text-muted hover:border-gold/40"}`}>
                1 ô đơn giản
              </button>
              <button type="button" onClick={() => setFillMode("multi")}
                className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${fillMode === "multi" ? "border-gold bg-gold/10 text-royal" : "border-silver/40 text-muted hover:border-gold/40"}`}>
                Nhiều chỗ trống / dán HTML LearnClick
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">
              {fillMode === "single"
                ? "Một chỗ trống, một ô đáp án (nhiều cách viết ngăn bằng |)."
                : "Nhiều chỗ trống trong một đoạn — dán HTML từ LearnClick hoặc tự bôi đen tạo chỗ trống. Chấm điểm theo từng ô."}
            </p>
          </div>
        )}

        {/* Content — câu thường dùng QuestionContentEditor; câu nhiều gap dùng HtmlGapEditor */}
        {isMultiGap ? (
          <div className="card">
            <label className="mb-2 block text-sm font-medium text-royal">Nội dung bài (chỗ trống)</label>
            <HtmlGapEditor ref={gapEditorRef} initial={gapData} onChange={setGapData} />
          </div>
        ) : (
          <QuestionContentEditor value={content} onChange={setContent} />
        )}

        {/* Media upload (audio/image) */}
        <div className="card">
          <label className="mb-2 block text-sm font-medium text-royal">File đính kèm (ảnh hoặc audio — tuỳ chọn)</label>
          {mediaUrl ? (
            <div className="relative">
              {mediaType === "image" && mediaPreview && (
                <img src={mediaPreview} alt="Media" className="h-40 rounded-lg object-cover" />
              )}
              {mediaType === "audio" && (
                <div className="flex items-center gap-3 rounded-lg bg-cream p-4">
                  <Headphones size={24} className="text-royal" />
                  <div>
                    <p className="text-sm font-medium text-[#1a1a2e]">Audio đã upload</p>
                    <audio controls src={getImageUrl(mediaUrl)} className="mt-2" />
                  </div>
                </div>
              )}
              <button onClick={removeMedia}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:scale-110"><X size={14} /></button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => { mediaInputRef.current?.setAttribute("accept", "image/*"); mediaInputRef.current?.click(); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-silver/40 bg-cream py-6 transition-colors hover:border-gold/40 hover:bg-gold/5">
                <ImagePlus size={20} className="text-muted" />
                <span className="text-sm text-muted">Thêm ảnh</span>
              </button>
              <button onClick={() => { mediaInputRef.current?.setAttribute("accept", "audio/*"); mediaInputRef.current?.click(); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-silver/40 bg-cream py-6 transition-colors hover:border-gold/40 hover:bg-gold/5">
                <Headphones size={20} className="text-muted" />
                <span className="text-sm text-muted">Thêm audio</span>
              </button>
            </div>
          )}
          <input ref={mediaInputRef} type="file" className="hidden" onChange={handleMediaUpload} />
          <p className="mt-2 text-xs text-muted">Ảnh cho bài Writing/Reading · Audio cho bài Listening</p>
        </div>

        {/* Options — MC */}
        {type === "MULTIPLE_CHOICE" && (
          <div className="card space-y-3">
            <label className="block text-sm font-medium text-royal">Các đáp án</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correct" value={opt} checked={correctAnswer === opt}
                  onChange={() => setCorrectAnswer(opt)} className="h-4 w-4 accent-gold" />
                <input value={opt} onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Đáp án ${String.fromCharCode(65 + i)}`} className="input-field" />
                {options.length > 2 && <button onClick={() => removeOption(i)} className="p-1 text-muted hover:text-red-500"><X size={14} /></button>}
              </div>
            ))}
            <button onClick={addOption} className="flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-light"><Plus size={13} />Thêm đáp án</button>
            <p className="text-xs text-muted">Chọn radio để đánh dấu đáp án đúng</p>
          </div>
        )}

        {/* Fill in blank — chỉ hiện ô đáp án khi là chế độ 1 ô */}
        {type === "FILL_IN_BLANK" && fillMode === "single" && (
          <div className="card">
            <label className="mb-1 block text-sm font-medium text-royal">Đáp án đúng</label>
            <input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Nhập đáp án đúng..." className="input-field" />
            <p className="mt-1 text-xs text-muted">Nhiều đáp án cách nhau bằng dấu | (ví dụ: has been|has already been)</p>
          </div>
        )}

        {/* Matching */}
        {type === "MATCHING" && (
          <div className="card">
            <label className="mb-1 block text-sm font-medium text-royal">Đáp án đúng</label>
            <input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Nhập đáp án đúng..." className="input-field" />
          </div>
        )}

        {type === "ESSAY" && <div className="card"><p className="text-sm text-muted">Câu tự luận sẽ được giáo viên chấm thủ công.</p></div>}

        {/* Explanation */}
        <div className="card">
          <label className="mb-1 block text-sm font-medium text-royal">Giải thích (tuỳ chọn)</label>
          <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} placeholder="Giải thích đáp án đúng..." className="input-field" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={addAnother} onChange={(e) => setAddAnother(e.target.checked)} className="h-4 w-4 rounded accent-gold" />
            Thêm câu hỏi tiếp
          </label>
          <button onClick={handleSave} disabled={saving} className="btn-primary"><Save size={15} />{saving ? "Đang lưu..." : "Lưu câu hỏi"}</button>
        </div>
      </div>
    </div>
  );
}