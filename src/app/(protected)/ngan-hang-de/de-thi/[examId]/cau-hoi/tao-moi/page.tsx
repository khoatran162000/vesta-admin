// FILE: src/app/(protected)/ngan-hang-de/de-thi/[examId]/cau-hoi/tao-moi/page.tsx — Them cau hoi (co media)
"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X, ImagePlus, Headphones } from "lucide-react";
import Link from "next/link";
import { api, getImageUrl } from "@/lib/api";

export default function CreateQuestionPage() {
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
  const mediaInputRef = useRef<HTMLInputElement>(null);

  function updateOption(i: number, val: string) { const o = [...options]; o[i] = val; setOptions(o); }
  function addOption() { setOptions([...options, ""]); }
  function removeOption(i: number) { setOptions(options.filter((_, idx) => idx !== i)); }

  // Upload media (image or audio)
  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect type
    const isAudio = file.type.startsWith("audio/");
    const isImage = file.type.startsWith("image/");
    if (!isAudio && !isImage) { setError("Chỉ hỗ trợ file ảnh hoặc audio"); return; }

    const formData = new FormData();
    formData.append("thumbnail", file);

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
    if (!content) return;
    setSaving(true); setError("");
    try {
      const body: any = { examId, type, content, explanation, score: parseFloat(score), mediaUrl: mediaUrl || null };
      if (type === "MULTIPLE_CHOICE") { body.options = options.filter(Boolean); body.correctAnswer = correctAnswer; }
      else if (type === "FILL_IN_BLANK") { body.correctAnswer = correctAnswer; }
      else if (type === "ESSAY") { body.correctAnswer = { type: "manual" }; }
      else { body.correctAnswer = correctAnswer; }

      const data = await api.post("/questions", body);
      if (data.success) {
        if (addAnother) {
          setContent(""); setOptions(["", "", "", ""]); setCorrectAnswer(""); setExplanation("");
          setMediaUrl(""); setMediaPreview(""); setMediaType("none");
        } else { router.push(`/ngan-hang-de/de-thi/${examId}/cau-hoi`); }
      } else { setError(data.message); }
    } catch { setError("Lỗi server"); } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-[800px]">
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

        {/* Content */}
        <div className="card">
          <label className="mb-1 block text-sm font-medium text-royal">Nội dung câu hỏi *</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Nhập nội dung câu hỏi..." className="input-field" />
        </div>

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

        {/* Fill in blank */}
        {type === "FILL_IN_BLANK" && (
          <div className="card">
            <label className="mb-1 block text-sm font-medium text-royal">Đáp án đúng</label>
            <input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Nhập đáp án đúng..." className="input-field" />
            <p className="mt-1 text-xs text-muted">Nhiều đáp án cách nhau bằng dấu | (ví dụ: has been|has already been)</p>
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
          <button onClick={handleSave} disabled={saving || !content} className="btn-primary"><Save size={15} />{saving ? "Đang lưu..." : "Lưu câu hỏi"}</button>
        </div>
      </div>
    </div>
  );
}