// FILE: src/components/HtmlPasteBox.tsx
// Ô dán HTML + tab xem trước (iframe cách ly). Dùng cho nhật ký / tài liệu / chấm bài.
"use client";
import { useState } from "react";
import { Code, Eye } from "lucide-react";
import HtmlFrame from "./HtmlFrame";

interface Props {
  value: string;
  onChange: (v: string) => void;
  label: string;
  hint?: string;
  rows?: number;
}

export default function HtmlPasteBox({ value, onChange, label, hint, rows = 8 }: Props) {
  const [tab, setTab] = useState<"code" | "preview">("code");
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-xs font-bold text-muted">{label}</label>
        <div className="flex gap-1">
          <button type="button" onClick={() => setTab("code")}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[0.7rem] font-semibold ${tab === "code" ? "bg-royal text-white" : "bg-cream text-muted hover:text-royal"}`}>
            <Code size={11} />Mã HTML
          </button>
          <button type="button" onClick={() => setTab("preview")}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[0.7rem] font-semibold ${tab === "preview" ? "bg-royal text-white" : "bg-cream text-muted hover:text-royal"}`}>
            <Eye size={11} />Xem trước
          </button>
        </div>
      </div>
      {tab === "code" ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} spellCheck={false}
          placeholder="<!doctype html> ... hoặc <div>...</div>"
          className="input-field font-mono text-xs" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-silver/40 bg-white">
          {value.trim()
            ? <HtmlFrame html={value} />
            : <p className="py-10 text-center text-sm text-muted">Chưa có mã HTML để xem trước.</p>}
        </div>
      )}
      {hint && <p className="mt-1 text-[0.7rem] text-muted">{hint}</p>}
    </div>
  );
}