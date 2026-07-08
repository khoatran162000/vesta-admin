// FILE: src/components/report/HtmlReportEditor.tsx
// Ô dán HTML/CSS cho báo cáo cuối khóa + preview + nút copy link chia sẻ
"use client";
import { useState } from "react";
import { Copy, Check, ExternalLink, Eye, Code } from "lucide-react";

interface Props {
  html: string;
  onChange: (html: string) => void;
  shareUrl?: string | null; // có sau khi đã lưu & là report HTML
}

export default function HtmlReportEditor({ html, onChange, shareUrl }: Props) {
  const [tab, setTab] = useState<"code" | "preview">("code");
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback: chọn text thủ công
      window.prompt("Copy link chia sẻ:", shareUrl);
    }
  }

  return (
    <div>
      <div className="mb-3 rounded-lg border border-gold/30 bg-gold/5 p-3 text-xs text-muted">
        Dán <b>toàn bộ</b> mã HTML của report (kể cả <code>&lt;style&gt;</code>, ảnh, ...) vào ô bên dưới —
        giống hệt file chị vẫn đẩy lên Netlify. Học sinh và phụ huynh sẽ thấy đúng giao diện này.
      </div>

      {/* Tabs Code / Preview */}
      <div className="mb-2 flex gap-1">
        <button type="button" onClick={() => setTab("code")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === "code" ? "bg-royal text-white" : "bg-cream text-muted hover:text-royal"}`}>
          <Code size={13} />Mã HTML
        </button>
        <button type="button" onClick={() => setTab("preview")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === "preview" ? "bg-royal text-white" : "bg-cream text-muted hover:text-royal"}`}>
          <Eye size={13} />Xem trước
        </button>
      </div>

      {tab === "code" ? (
        <textarea
          value={html}
          onChange={(e) => onChange(e.target.value)}
          rows={20}
          spellCheck={false}
          placeholder="<!doctype html>&#10;<html>&#10;  ... dán mã report vào đây ..."
          className="w-full resize-y rounded-lg border border-silver/40 bg-[#0F1B3D] p-3 font-mono text-xs leading-relaxed text-emerald-100 outline-none focus:border-gold"
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-silver/40">
          {html.trim() ? (
            <iframe
              title="preview"
              srcDoc={html}
              sandbox="allow-same-origin"
              className="h-[600px] w-full bg-white"
            />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted">
              Chưa có mã HTML để xem trước.
            </div>
          )}
        </div>
      )}

      {/* Link chia sẻ (chỉ hiện sau khi đã lưu report HTML) */}
      {shareUrl && (
        <div className="mt-4 rounded-lg border border-royal/20 bg-royal/5 p-3">
          <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-royal">Link chia sẻ cho phụ huynh</div>
          <div className="flex flex-wrap items-center gap-2">
            <input readOnly value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg border border-silver/40 bg-white px-3 py-2 text-xs text-royal" />
            <button type="button" onClick={copyLink} className="btn-secondary">
              {copied ? <><Check size={14} />Đã copy</> : <><Copy size={14} />Copy</>}
            </button>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <ExternalLink size={14} />Mở thử
            </a>
          </div>
          <p className="mt-2 text-[0.7rem] text-muted">
            Link chỉ hoạt động khi báo cáo ở trạng thái <b>Đã xuất bản</b>. Gửi thẳng cho phụ huynh, không cần đăng nhập.
          </p>
        </div>
      )}
    </div>
  );
}