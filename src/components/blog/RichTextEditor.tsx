// FILE: src/components/blog/RichTextEditor.tsx
// TipTap Editor + HTML Source Editor + CSS Panel

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Youtube from "@tiptap/extension-youtube";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useState, useCallback, useEffect, useRef } from "react";

/* ────────────────────────── Types ────────────────────────── */
interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

type ViewMode = "visual" | "html" | "css";

/* ────────────────────────── CSS extract/inject ────────────────────────── */
function extractCSS(html: string): { css: string; body: string } {
  const m = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return { css: m ? m[1].trim() : "", body: html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim() };
}
function injectCSS(body: string, css: string): string {
  return css.trim() ? `<style>${css}</style>\n${body}` : body;
}

/* ────────────────────────── Toolbar components ────────────────────────── */
function Btn({ active, onClick, title, children, disabled }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <div className="group relative">
      <button type="button" onClick={onClick} disabled={disabled}
        className={`flex h-8 min-w-[32px] items-center justify-center rounded px-1.5 text-[0.78rem] transition-colors ${active ? "bg-[#0F1B3D] text-white" : "text-[#1a1a2e] hover:bg-[#0F1B3D]/10"} ${disabled ? "cursor-not-allowed opacity-30" : ""}`}>
        {children}
      </button>
      <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0F1B3D] px-2.5 py-1.5 text-[0.68rem] leading-tight text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {title}
        <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#0F1B3D]" />
      </div>
    </div>
  );
}
function Sep() { return <div className="mx-1 h-5 w-px bg-gray-300" />; }
function Tab({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <div className="group relative">
      <button type="button" onClick={onClick}
        className={`rounded-t-md px-4 py-1.5 text-[0.75rem] font-bold tracking-wide transition-colors ${active ? "bg-white text-[#0F1B3D] shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
        {children}
      </button>
      {title && (
        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0F1B3D] px-2.5 py-1.5 text-[0.68rem] leading-tight text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
          {title}
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#0F1B3D]" />
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export function RichTextEditor({ content = "", onChange, placeholder = "Bắt đầu viết bài..." }: RichTextEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("visual");
  const [showGuide, setShowGuide] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [htmlSource, setHtmlSource] = useState("");
  const [cssSource, setCssSource] = useState("");
  const skipSync = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, codeBlock: { HTMLAttributes: { class: "code-block" } } }),
      Image.configure({ HTMLAttributes: { class: "editor-image" } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "editor-link" } }),
      Placeholder.configure({ placeholder }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      Youtube.configure({ width: 640, height: 360 }),
      Table.configure({ resizable: false }),
      TableRow, TableCell, TableHeader,
    ],
    content: extractCSS(content).body,
    editorProps: { attributes: { class: "vesta-editor-content" } },
    onUpdate: ({ editor: e }) => {
      if (skipSync.current) return;
      onChange?.(injectCSS(e.getHTML(), cssSource));
    },
  });

  useEffect(() => { const { css, body } = extractCSS(content); setCssSource(css); setHtmlSource(body); }, []);
  useEffect(() => {
    if (editor && content && !skipSync.current) {
      const { body } = extractCSS(content);
      if (editor.getHTML() !== body) editor.commands.setContent(body);
    }
  }, [content, editor]);

  /* ── Switch mode ── */
  const switchMode = (mode: ViewMode) => {
    if (mode === viewMode) return;
    if (viewMode === "visual" && editor) setHtmlSource(editor.getHTML());
    if (viewMode === "html" && editor) {
      skipSync.current = true;
      editor.commands.setContent(htmlSource);
      skipSync.current = false;
      onChange?.(injectCSS(htmlSource, cssSource));
    }
    if (viewMode === "css") {
      const body = editor ? editor.getHTML() : htmlSource;
      onChange?.(injectCSS(body, cssSource));
    }
    setViewMode(mode);
  };

  const onHtml = (v: string) => { setHtmlSource(v); onChange?.(injectCSS(v, cssSource)); };
  const onCss = (v: string) => { setCssSource(v); onChange?.(injectCSS(editor ? editor.getHTML() : htmlSource, v)); };

  /* ── Media actions ── */
  const addImage = useCallback(() => { const u = prompt("Nhập URL ảnh:"); if (u && editor) editor.chain().focus().setImage({ src: u }).run(); }, [editor]);
  const addImageUpload = useCallback(() => {
    const input = document.createElement("input"); input.type = "file"; input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file || !editor) return;
      const fd = new FormData(); fd.append("image", file);
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const tk = localStorage.getItem("accessToken");
        const r = await fetch(`${API}/upload/blog`, { method: "POST", headers: tk ? { Authorization: `Bearer ${tk}` } : {}, body: fd });
        if (r.ok) { const d = await r.json(); editor.chain().focus().setImage({ src: d.data?.url || d.url }).run(); }
        else alert("Lỗi upload ảnh.");
      } catch { alert("Lỗi kết nối server."); }
    }; input.click();
  }, [editor]);
  const addYoutube = useCallback(() => { const u = prompt("Nhập link YouTube:"); if (u && editor) editor.commands.setYoutubeVideo({ src: u }); }, [editor]);
  const setLink = useCallback(() => {
    if (!editor) return;
    if (showLinkInput) { if (linkUrl) editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run(); setShowLinkInput(false); setLinkUrl(""); }
    else { setLinkUrl(editor.getAttributes("link").href || ""); setShowLinkInput(true); }
  }, [editor, showLinkInput, linkUrl]);
  const addTable = useCallback(() => { editor?.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run(); }, [editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* ═══════ VIEW MODE TABS ═══════ */}
      <div className="flex items-end gap-1 border-b border-gray-200 bg-gray-50 px-2 pt-2">
        <Tab active={viewMode === "visual"} onClick={() => switchMode("visual")} title="Soạn thảo trực quan — kéo thả, click để định dạng">✏️ Visual</Tab>
        <Tab active={viewMode === "html"} onClick={() => switchMode("html")} title="Chỉnh sửa mã HTML trực tiếp — hỗ trợ inline CSS (style=&quot;...&quot;)">{"<>"} HTML</Tab>
        <Tab active={viewMode === "css"} onClick={() => switchMode("css")} title="Viết CSS class riêng cho bài viết — dùng class trong tab HTML">🎨 CSS</Tab>
        <div className="ml-auto pb-1.5 pr-1">
          <Btn active={showGuide} onClick={() => setShowGuide(!showGuide)} title="Mở hướng dẫn sử dụng các công cụ theo chuẩn design VESTA">📖 Hướng dẫn</Btn>
        </div>
      </div>

      {/* ═══════ VISUAL TOOLBAR ═══════ */}
      {viewMode === "visual" && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
          <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="In đậm — Ctrl+B"><strong>B</strong></Btn>
          <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="In nghiêng — Ctrl+I"><em>I</em></Btn>
          <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Gạch chân — Ctrl+U"><span className="underline">U</span></Btn>
          <Btn active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Tô vàng highlight cho từ khoá"><span className="rounded bg-yellow-200 px-0.5">H</span></Btn>
          <Sep />
          <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Tiêu đề lớn — dùng cho mỗi dạng bài/section chính">H2</Btn>
          <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Tiêu đề phụ — dùng cho chiến thuật, ví dụ">H3</Btn>
          <Btn active={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} title="Nhãn nhỏ — chữ in hoa, dùng cho label">H4</Btn>
          <Sep />
          <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Danh sách gạch đầu dòng — chấm tròn vàng">• List</Btn>
          <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Danh sách đánh số — số trong vòng tròn navy">1. List</Btn>
          <Sep />
          <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Khung thông tin — viền trái navy, nền xanh nhạt">❝ Quote</Btn>
          <Btn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Thanh đáp án — nền navy đậm, chữ vàng gold">{"</>"}</Btn>
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Đường kẻ ngang — dashes vàng gold ngăn cách section">─</Btn>
          <Sep />
          <Btn onClick={addTable} title="Chèn bảng — header navy, dùng cho bảng tổng hợp">▦</Btn>
          <Sep />
          <Btn onClick={addImageUpload} title="Tải ảnh lên từ máy tính">📷</Btn>
          <Btn onClick={addImage} title="Chèn ảnh từ đường link URL">🖼</Btn>
          <Btn onClick={addYoutube} title="Nhúng video YouTube vào bài viết">▶</Btn>
          <Sep />
          <Btn active={editor.isActive("link")} onClick={setLink} title="Chèn hoặc sửa đường link">🔗</Btn>
          {editor.isActive("link") && <Btn onClick={() => editor.chain().focus().unsetLink().run()} title="Xoá đường link khỏi text đang chọn">✕</Btn>}
          <Sep />
          <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Hoàn tác thao tác trước — Ctrl+Z">↩</Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Làm lại thao tác đã hoàn tác — Ctrl+Shift+Z">↪</Btn>
        </div>
      )}

      {/* Link input */}
      {showLinkInput && viewMode === "visual" && (
        <div className="flex items-center gap-2 border-b border-gray-200 bg-blue-50 px-3 py-2">
          <span className="text-xs text-gray-500">URL:</span>
          <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..."
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm" onKeyDown={(e) => e.key === "Enter" && setLink()} autoFocus />
          <button type="button" onClick={setLink} className="rounded bg-[#0F1B3D] px-3 py-1 text-xs text-white">OK</button>
          <button type="button" onClick={() => { setShowLinkInput(false); setLinkUrl(""); }} className="text-xs text-gray-500">Huỷ</button>
        </div>
      )}

      {/* ═══════ GUIDE PANEL ═══════ */}
      {showGuide && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <h4 className="mb-2 text-sm font-bold text-amber-800">📖 Hướng dẫn Design VESTA</h4>
          <div className="grid gap-2 text-[0.72rem] text-amber-900 sm:grid-cols-2">
            <div className="rounded bg-white/60 px-3 py-2"><p className="font-bold">H2 — Section chính</p><p className="text-amber-700">Font lớn + đường kẻ vàng dưới</p></div>
            <div className="rounded bg-white/60 px-3 py-2"><p className="font-bold">❝ Blockquote — Card info</p><p className="text-amber-700">Viền trái navy, nền xanh nhạt</p></div>
            <div className="rounded bg-white/60 px-3 py-2"><p className="font-bold">{"</>"} Code Block — Answer bar</p><p className="text-amber-700">Nền navy + text vàng</p></div>
            <div className="rounded bg-white/60 px-3 py-2"><p className="font-bold">🎨 CSS — Custom class</p><p className="text-amber-700">Viết CSS ở tab CSS, dùng class trong tab HTML</p></div>
            <div className="rounded bg-white/60 px-3 py-2"><p className="font-bold">{"<>"} HTML — Inline style</p><p className="text-amber-700">{`<p style="color:red">...</p>`}</p></div>
            <div className="rounded bg-white/60 px-3 py-2"><p className="font-bold">▦ Bảng</p><p className="text-amber-700">Header navy, rows xen kẽ</p></div>
          </div>
        </div>
      )}

      {/* ═══════ VISUAL EDITOR ═══════ */}
      {viewMode === "visual" && (
        <div className="vesta-editor-wrapper"><EditorContent editor={editor} /></div>
      )}

      {/* ═══════ HTML SOURCE ═══════ */}
      {viewMode === "html" && (
        <div>
          <div className="flex items-center border-b border-gray-700 bg-[#1e1e2e] px-3 py-2">
            <span className="text-[0.7rem] text-gray-400">HTML + Inline CSS — chỉnh trực tiếp source code</span>
            <button type="button" onClick={() => { const f = htmlSource.replace(/></g, ">\n<"); setHtmlSource(f); onHtml(f); }}
              className="ml-auto rounded bg-gray-700 px-2 py-0.5 text-[0.65rem] text-gray-300 hover:bg-gray-600">Format</button>
          </div>
          <textarea value={htmlSource} onChange={(e) => onHtml(e.target.value)} spellCheck={false}
            className="min-h-[500px] w-full resize-y bg-[#1e1e2e] p-4 font-mono text-[0.82rem] leading-[1.7] text-green-300 outline-none"
            placeholder={'<h2>Tiêu đề</h2>\n<p style="color: #C93040; font-weight: bold;">Text đỏ</p>\n<div class="custom-box">Dùng class từ tab CSS</div>'} />
        </div>
      )}

      {/* ═══════ CSS PANEL ═══════ */}
      {viewMode === "css" && (
        <div>
          <div className="border-b border-gray-700 bg-[#1e1e2e] px-3 py-2">
            <span className="text-[0.7rem] text-gray-400">CSS — viết class rời, áp dụng cho bài viết này</span>
          </div>
          <div className="border-b border-gray-700 bg-[#252535] px-4 py-2 text-[0.7rem]">
            <p className="mb-1 font-bold text-gray-300">💡 Ví dụ:</p>
            <pre className="text-blue-300">{`.highlight-box {\n  background: #FFF9E6;\n  border-left: 4px solid #C9A84C;\n  padding: 1rem; border-radius: 0 8px 8px 0;\n}\n.two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }`}</pre>
            <p className="mt-1 text-gray-500">Dùng trong tab HTML: <code className="text-gray-400">{`<div class="highlight-box">...</div>`}</code></p>
          </div>
          <textarea value={cssSource} onChange={(e) => onCss(e.target.value)} spellCheck={false}
            className="min-h-[400px] w-full resize-y bg-[#1e1e2e] p-4 font-mono text-[0.82rem] leading-[1.7] text-purple-300 outline-none"
            placeholder={"/* CSS cho bài viết */\n\n.custom-box {\n  background: #f8f9fc;\n  border: 1px solid #ddd;\n  padding: 1.5rem;\n  border-radius: 12px;\n}"} />
          {cssSource.trim() && (
            <div className="border-t border-gray-700 bg-[#252535] px-4 py-2">
              <p className="text-[0.7rem] text-green-400">✓ CSS được lưu cùng bài viết</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════ EDITOR STYLES ═══════ */}
      <style jsx global>{`
        .vesta-editor-wrapper { min-height: 500px; }
        .vesta-editor-wrapper .ProseMirror { min-height: 500px; padding: 1.5rem; outline: none; font-family: "Georgia", serif; font-size: 0.92rem; line-height: 1.9; color: #1a1a2e; }
        .vesta-editor-wrapper .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #aaa; pointer-events: none; height: 0; }
        .vesta-editor-wrapper .ProseMirror h2 { font-family: "Georgia", serif; font-size: 1.5rem; font-weight: 700; color: #0f1b3d; margin: 1.5rem 0 0.8rem; padding-bottom: 0.4rem; border-bottom: 2px solid #c9a84c; }
        .vesta-editor-wrapper .ProseMirror h3 { font-family: "Georgia", serif; font-size: 1.2rem; font-weight: 700; color: #0f1b3d; margin: 1.2rem 0 0.6rem; }
        .vesta-editor-wrapper .ProseMirror h4 { font-size: 1rem; font-weight: 700; color: #0f1b3d; text-transform: uppercase; letter-spacing: 0.05em; margin: 1rem 0 0.5rem; }
        .vesta-editor-wrapper .ProseMirror strong { font-weight: 700; color: #0f1b3d; }
        .vesta-editor-wrapper .ProseMirror blockquote { margin: 1rem 0; padding: 1rem 1.2rem; border-left: 4px solid #0f1b3d; background: #f0f2f8; border-radius: 0 8px 8px 0; }
        .vesta-editor-wrapper .ProseMirror pre { margin: 1rem 0; padding: 0.8rem 1.2rem; background: #0f1b3d; border-radius: 8px; color: #c9a84c; font-family: monospace; font-size: 0.85rem; }
        .vesta-editor-wrapper .ProseMirror pre code { color: #c9a84c; background: none; }
        .vesta-editor-wrapper .ProseMirror code { background: #f0ece3; color: #c93040; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.85em; }
        .vesta-editor-wrapper .ProseMirror ul { padding-left: 1.5rem; list-style: disc; }
        .vesta-editor-wrapper .ProseMirror ol { padding-left: 1.5rem; list-style: decimal; }
        .vesta-editor-wrapper .ProseMirror li { margin-bottom: 0.3rem; }
        .vesta-editor-wrapper .ProseMirror hr { border: none; margin: 1.5rem 0; height: 2px; background: repeating-linear-gradient(90deg, #c9a84c 0px, #c9a84c 14px, transparent 14px, transparent 20px); }
        .vesta-editor-wrapper .ProseMirror table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.85rem; }
        .vesta-editor-wrapper .ProseMirror th { background: #0f1b3d; color: #c9a84c; font-weight: 700; padding: 0.6rem 0.8rem; text-align: left; }
        .vesta-editor-wrapper .ProseMirror td { padding: 0.5rem 0.8rem; border: 1px solid #e0ddd5; }
        .vesta-editor-wrapper .ProseMirror tr:nth-child(even) td { background: #faf9f6; }
        .vesta-editor-wrapper .ProseMirror img { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
        .vesta-editor-wrapper .ProseMirror a { color: #c9a84c; text-decoration: underline; }
        .vesta-editor-wrapper .ProseMirror mark { background: #e8d48b60; padding: 0 2px; }
        .vesta-editor-wrapper .ProseMirror iframe { width: 100%; aspect-ratio: 16/9; border-radius: 8px; margin: 1rem 0; border: none; }
        .vesta-editor-wrapper .ProseMirror .ProseMirror-selectednode { outline: 2px solid #c9a84c; border-radius: 4px; }
      `}</style>
    </div>
  );
}

export default RichTextEditor;