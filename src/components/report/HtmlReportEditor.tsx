// FILE: src/components/report/HtmlReportEditor.tsx
// Ô dán HTML/CSS cho báo cáo (cuối khóa + định kỳ) + preview + SỬA TRỰC TIẾP + nút copy link chia sẻ
"use client";
import { useState, useRef, useEffect } from "react";
import { Copy, Check, ExternalLink, Eye, Code, Pencil, Save, Undo2 } from "lucide-react";

interface Props {
  html: string;
  onChange: (html: string) => void;
  shareUrl?: string | null; // có sau khi đã lưu & là report HTML
}

type Tab = "code" | "preview" | "edit";

export default function HtmlReportEditor({ html, onChange, shareUrl }: Props) {
  const [tab, setTab] = useState<Tab>("code");
  const [copied, setCopied] = useState(false);
  const [dirty, setDirty] = useState(false);           // đã sửa trực tiếp nhưng chưa "Lưu chỉnh sửa"
  const editFrameRef = useRef<HTMLIFrameElement | null>(null);
  const loadedHtmlRef = useRef<string>("");            // HTML đang nạp trong khung sửa (để so đổi)

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy link chia sẻ:", shareUrl);
    }
  }

  // Nạp HTML vào iframe sửa + bật contentEditable trên <body>.
  // Chỉ nạp lại khi vào tab edit hoặc html nguồn đổi (không nạp đè khi đang gõ).
  useEffect(() => {
    if (tab !== "edit") return;
    const frame = editFrameRef.current;
    if (!frame) return;
    if (loadedHtmlRef.current === html && frame.contentDocument?.body) return; // đã nạp rồi, giữ nguyên
    const doc = frame.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html || "<p>Chưa có nội dung.</p>");
    doc.close();
    loadedHtmlRef.current = html;
    // Bật sửa chữ/số, KHÓA kéo-thả để không vỡ layout
    const body = doc.body;
    if (body) {
      body.setAttribute("contenteditable", "true");
      (body.style as any).outline = "none";
      body.addEventListener("input", () => setDirty(true));
      // Chặn Enter tạo thẻ mới lung tung — cho xuống dòng mềm thôi
      body.addEventListener("keydown", (e: any) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          doc.execCommand("insertLineBreak");
        }
      });
      // Chặn kéo-thả (dễ xáo trộn cấu trúc)
      body.addEventListener("dragstart", (e: any) => e.preventDefault());
      body.addEventListener("drop", (e: any) => e.preventDefault());
    }
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, html]);

  // Ghi HTML đã sửa trong iframe ngược về form
  function saveEdits() {
    const doc = editFrameRef.current?.contentDocument;
    if (!doc) return;
    // Gỡ contenteditable trước khi lấy HTML để bản lưu sạch
    doc.body?.removeAttribute("contenteditable");
    const dt = doc.doctype ? "<!doctype html>\n" : "";
    const out = dt + (doc.documentElement?.outerHTML || "");
    doc.body?.setAttribute("contenteditable", "true"); // bật lại cho sửa tiếp
    onChange(out);
    loadedHtmlRef.current = out;
    setDirty(false);
  }

  // Bỏ chỉnh sửa trực tiếp, nạp lại từ HTML nguồn hiện tại
  function resetEdits() {
    if (!confirm("Bỏ các chỉnh sửa trực tiếp chưa lưu và nạp lại từ mã HTML hiện tại?")) return;
    loadedHtmlRef.current = "___force_reload___";
    setTab("code");
    setTimeout(() => setTab("edit"), 0);
  }

  const tabBtn = (t: Tab, icon: React.ReactNode, label: string) => (
    <button type="button" onClick={() => setTab(t)}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === t ? "bg-royal text-white" : "bg-cream text-muted hover:text-royal"}`}>
      {icon}{label}
    </button>
  );

  return (
    <div>
      <div className="mb-3 rounded-lg border border-gold/30 bg-gold/5 p-3 text-xs text-muted">
        Dán <b>toàn bộ</b> mã HTML của report (kể cả <code>&lt;style&gt;</code>, ảnh, ...) vào tab <b>Mã HTML</b>.
        Muốn chỉnh điểm/nhận xét nhanh mà không đụng code, sang tab <b>Sửa trực tiếp</b> rồi bấm ngay vào chữ/số để gõ đè.
      </div>

      {/* Tabs */}
      <div className="mb-2 flex flex-wrap gap-1">
        {tabBtn("code", <Code size={13} />, "Mã HTML")}
        {tabBtn("edit", <Pencil size={13} />, "Sửa trực tiếp")}
        {tabBtn("preview", <Eye size={13} />, "Xem trước")}
      </div>

      {tab === "code" && (
        <textarea
          value={html}
          onChange={(e) => onChange(e.target.value)}
          rows={20}
          spellCheck={false}
          placeholder="<!doctype html>&#10;<html>&#10;  ... dán mã report vào đây ..."
          className="w-full resize-y rounded-lg border border-silver/40 bg-[#0F1B3D] p-3 font-mono text-xs leading-relaxed text-emerald-100 outline-none focus:border-gold"
        />
      )}

      {tab === "edit" && (
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-silver/30 bg-cream/40 p-2">
            <span className="text-xs text-muted">Bấm vào <b>số điểm</b> hoặc <b>đoạn nhận xét</b> trong report rồi gõ đè. Chỉ sửa chữ/số — không kéo-thả để khỏi vỡ layout.</span>
            <div className="ml-auto flex items-center gap-2">
              {dirty && <span className="text-[0.7rem] font-semibold text-amber-600">● Có thay đổi chưa lưu</span>}
              <button type="button" onClick={resetEdits} className="inline-flex items-center gap-1 rounded border border-silver/40 px-2.5 py-1 text-xs text-muted hover:text-royal" title="Bỏ chỉnh sửa, nạp lại từ mã HTML">
                <Undo2 size={13} />Nạp lại
              </button>
              <button type="button" onClick={saveEdits} disabled={!dirty}
                className="inline-flex items-center gap-1 rounded bg-royal px-3 py-1 text-xs font-bold text-white hover:bg-royal/90 disabled:opacity-40">
                <Save size={13} />Lưu chỉnh sửa
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border-2 border-dashed border-royal/30">
            {html.trim() ? (
              <iframe
                ref={editFrameRef}
                title="edit"
                sandbox="allow-same-origin"
                className="h-[600px] w-full bg-white"
              />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted">
                Chưa có mã HTML. Dán report ở tab <b className="mx-1">Mã HTML</b> trước.
              </div>
            )}
          </div>
          <p className="mt-2 text-[0.7rem] text-muted">
            Sửa xong nhớ bấm <b>Lưu chỉnh sửa</b> để đưa thay đổi vào báo cáo, rồi <b>Lưu &amp; Xuất bản</b> ở cuối trang như thường.
          </p>
        </div>
      )}

      {tab === "preview" && (
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