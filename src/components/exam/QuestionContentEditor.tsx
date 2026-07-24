// FILE: src/components/exam/QuestionContentEditor.tsx
// Ô nhập nội dung câu hỏi + xem trước HTML. Dùng chung cho trang thêm & sửa câu hỏi.
"use client";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Maximize2, Minimize2 } from "lucide-react";
interface Props {
  value: string;
  onChange: (v: string) => void;
}
export default function QuestionContentEditor({ value, onChange }: Props) {
  const [preview, setPreview] = useState(false);
  const [full, setFull] = useState(false);
  const isHtml = /<[a-z][\s\S]*>/i.test(value);
  // Esc để thoát toàn màn hình
  useEffect(() => {
    if (!full) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setFull(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [full]);
  const body = (
    <>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-sm font-medium text-royal">Nội dung câu hỏi *</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setPreview((p) => !p)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-royal">
            {preview ? <EyeOff size={13} /> : <Eye size={13} />}{preview ? "Ẩn xem trước" : "Xem trước"}
          </button>
          <button type="button" onClick={() => setFull((f) => !f)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-royal hover:underline">
            {full ? <Minimize2 size={13} /> : <Maximize2 size={13} />}{full ? "Thu nhỏ (Esc)" : "Mở rộng toàn màn hình"}
          </button>
        </div>
      </div>
      <div className={full && preview ? "grid gap-4 lg:grid-cols-2" : ""}>
        <textarea value={value} onChange={(e) => onChange(e.target.value)}
          rows={full ? 30 : 14}
          placeholder="Nhập nội dung câu hỏi, hoặc dán HTML (bảng, màu, ảnh...) — bấm Xem trước để kiểm tra."
          className={`input-field resize-y ${isHtml ? "font-mono text-xs" : ""} ${full ? "!h-[70vh]" : ""}`} />
        {preview && (
          <div className={full ? "" : "mt-3"}>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Học viên sẽ thấy</p>
            <div className={`overflow-auto rounded-lg border border-silver/30 bg-white p-4 ${full ? "h-[70vh]" : ""}`}>
              {value.trim() ? (
                <>
                  <style>{`
                    .q-preview table { width: 100% !important; max-width: 100% !important; }
                    .q-preview td, .q-preview th { overflow-wrap: anywhere; }
                    .q-preview img, .q-preview iframe { max-width: 100%; }
                  `}</style>
                  <div className="q-preview text-sm text-[#1a1a2e]" dangerouslySetInnerHTML={{ __html: value }} />
                </>
              ) : (
                <p className="text-sm text-muted">Chưa có nội dung.</p>
              )}
            </div>
          </div>
        )}
      </div>
      {!full && (
        <p className="mt-1 text-xs text-muted">
          Ô này nhận cả <b>chữ thường</b> lẫn <b>mã HTML</b>. Dán HTML từ LearnClick/Word là học viên thấy đúng định dạng đó.
          Mã dài thì bấm <b>Mở rộng toàn màn hình</b> cho dễ soát.
        </p>
      )}
    </>
  );
  if (full) {
    return (
      <div className="fixed inset-0 z-50 overflow-auto bg-cream p-6">
        <div className="mx-auto max-w-[1400px] rounded-xl bg-white p-5 shadow-2xl">{body}</div>
      </div>
    );
  }
  return <div className="card">{body}</div>;
}