// FILE: src/components/exam/QuestionContentEditor.tsx
// Ô nhập nội dung câu hỏi + xem trước HTML. Dùng chung cho trang thêm & sửa câu hỏi.
"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function QuestionContentEditor({ value, onChange }: Props) {
  const [preview, setPreview] = useState(false);
  const isHtml = /<[a-z][\s\S]*>/i.test(value);

  return (
    <div className="card">
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-sm font-medium text-royal">Nội dung câu hỏi *</label>
        <button type="button" onClick={() => setPreview((p) => !p)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-royal">
          {preview ? <EyeOff size={13} /> : <Eye size={13} />}{preview ? "Ẩn xem trước" : "Xem trước"}
        </button>
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={8}
        placeholder="Nhập nội dung câu hỏi, hoặc dán HTML (bảng, màu, ảnh...) — bấm Xem trước để kiểm tra."
        className={`input-field ${isHtml ? "font-mono text-xs" : ""}`} />
      <p className="mt-1 text-xs text-muted">
        Ô này nhận cả <b>chữ thường</b> lẫn <b>mã HTML</b>. Dán HTML từ LearnClick/Word là học viên thấy đúng định dạng đó.
      </p>

      {preview && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Học viên sẽ thấy</p>
          <div className="overflow-x-auto rounded-lg border border-silver/30 bg-white p-4">
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
  );
}