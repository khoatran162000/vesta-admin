// FILE: src/app/(protected)/ngan-hang-de/de-thi/[examId]/cau-hoi/[qid]/page.tsx — Sua cau hoi (co media)
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X, Loader2, ImagePlus, Headphones } from "lucide-react";
import Link from "next/link";
import { api, getImageUrl } from "@/lib/api";

export default function EditQuestionPage() {
  const params = useParams();
  const examId = params.examId as string;
  const qid = params.qid as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("MULTIPLE_CHOICE");
  const [content, setContent] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState<any>("");
  const [explanation, setExplanation] = useState("");
  const [score, setScore] = useState("1");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"none" | "image" | "audio">("none");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get(`/questions/${qid}`);
        if (data.success) {
          const q = data.data;
          setType(q.type); setContent(q.content); setExplanation(q.explanation || ""); setScore(String(q.score));
          if (q.mediaUrl) {
            setMediaUrl(q.mediaUrl);
            setMediaType(q.mediaUrl.match(/\.(mp3|wav|ogg|m4a|aac)$/i) ? "audio" : "image");
          }
          if (q.type === "MULTIPLE_CHOICE" && Array.isArray(q.options)) {
            setOptions(q.options);
            setCorrectAnswer(typeof q.correctAnswer === "string" ? q.correctAnswer : JSON.stringify(q.correctAnswer));
          } else {
            setCorrectAnswer(typeof q.correctAnswer === "string" ? q.correctAnswer : JSON.stringify(q.correctAnswer));
          }
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, [qid]);

  function updateOption(i: number, val: string) { const o = [...options]; o[i] = val; setOptions(o); }
  function addOption() { setOptions([...options, ""]); }
  function removeOption(i: number) { setOptions(options.filter((_, idx) => idx !== i)); }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isAudio = file.type.startsWith("audio/");
    const formData = new FormData();
    formData.append("thumbnail", file);
    try {
      const data = await api.post("/posts/upload-image", formData);
      if (data.success) { setMediaUrl(data.data.url); setMediaType(isAudio ? "audio" : "image"); }
    } catch { setError("Lỗi upload media"); }
    e.target.value = "";
  }

  function removeMedia() { setMediaUrl(""); setMediaType("none"); }

  async function handleSave() {
    if (!content) return; setSaving(true); setError("");
    try {
      const body: any = { type, content, explanation, score: parseFloat(score), mediaUrl: mediaUrl || null };
      if (type === "MULTIPLE_CHOICE") { body.options = options.filter(Boolean); body.correctAnswer = correctAnswer; }
      else if (type === "FILL_IN_BLANK") { body.correctAnswer = correctAnswer; }
      else if (type === "ESSAY") { body.correctAnswer = { type: "manual" }; }
      else { body.correctAnswer = correctAnswer; }
      const data = await api.put(`/questions/${qid}`, body);
      if (data.success) router.push(`/ngan-hang-de/de-thi/${examId}/cau-hoi`);
      else setError(data.message);
    } catch { setError("Lỗi server"); } finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;

  return (
    <div className="mx-auto max-w-[800px]">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/ngan-hang-de/de-thi/${examId}/cau-hoi`} className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <h2 className="font-display text-2xl font-bold text-royal">Sửa câu hỏi</h2>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="space-y-5">
        <div className="card grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-royal">Loại câu hỏi</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input-field"><option value="MULTIPLE_CHOICE">Trắc nghiệm</option><option value="FILL_IN_BLANK">Điền từ</option><option value="MATCHING">Nối câu</option><option value="ESSAY">Tự luận</option></select></div>
          <div><label className="mb-1 block text-sm font-medium text-royal">Điểm</label><input type="number" value={score} onChange={(e) => setScore(e.target.value)} className="input-field" step="0.5" /></div>
        </div>

        <div className="card"><label className="mb-1 block text-sm font-medium text-royal">Nội dung câu hỏi *</label><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="input-field" /></div>

        {/* Media */}
        <div className="card">
          <label className="mb-2 block text-sm font-medium text-royal">File đính kèm</label>
          {mediaUrl ? (
            <div className="relative">
              {mediaType === "image" && <img src={getImageUrl(mediaUrl)} alt="Media" className="h-40 rounded-lg object-cover" />}
              {mediaType === "audio" && (
                <div className="flex items-center gap-3 rounded-lg bg-cream p-4">
                  <Headphones size={24} className="text-royal" />
                  <audio controls src={getImageUrl(mediaUrl)} className="mt-1" />
                </div>
              )}
              <button onClick={removeMedia} className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:scale-110"><X size={14} /></button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => { mediaInputRef.current?.setAttribute("accept", "image/*"); mediaInputRef.current?.click(); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-silver/40 bg-cream py-6 hover:border-gold/40 hover:bg-gold/5">
                <ImagePlus size={20} className="text-muted" /><span className="text-sm text-muted">Thêm ảnh</span>
              </button>
              <button onClick={() => { mediaInputRef.current?.setAttribute("accept", "audio/*"); mediaInputRef.current?.click(); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-silver/40 bg-cream py-6 hover:border-gold/40 hover:bg-gold/5">
                <Headphones size={20} className="text-muted" /><span className="text-sm text-muted">Thêm audio</span>
              </button>
            </div>
          )}
          <input ref={mediaInputRef} type="file" className="hidden" onChange={handleMediaUpload} />
        </div>

        {type === "MULTIPLE_CHOICE" && (
          <div className="card space-y-3">
            <label className="block text-sm font-medium text-royal">Các đáp án</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correct" checked={correctAnswer === opt} onChange={() => setCorrectAnswer(opt)} className="h-4 w-4 accent-gold" />
                <input value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Đáp án ${String.fromCharCode(65 + i)}`} className="input-field" />
                {options.length > 2 && <button onClick={() => removeOption(i)} className="p-1 text-muted hover:text-red-500"><X size={14} /></button>}
              </div>
            ))}
            <button onClick={addOption} className="flex items-center gap-1 text-xs font-medium text-gold"><Plus size={13} />Thêm đáp án</button>
          </div>
        )}

        {type === "FILL_IN_BLANK" && (
          <div className="card"><label className="mb-1 block text-sm font-medium text-royal">Đáp án đúng</label><input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} className="input-field" /></div>
        )}

        <div className="card"><label className="mb-1 block text-sm font-medium text-royal">Giải thích</label><textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className="input-field" /></div>

        <div className="flex justify-end"><button onClick={handleSave} disabled={saving || !content} className="btn-primary"><Save size={15} />{saving ? "Đang lưu..." : "Cập nhật"}</button></div>
      </div>
    </div>
  );
}