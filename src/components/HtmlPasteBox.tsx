// FILE: src/components/HtmlPasteBox.tsx
// Ô dán HTML + Sửa trực tiếp (có thanh định dạng) + Xem trước. Dùng cho nhật ký / tài liệu / chấm bài.
"use client";
import { useState, useRef, useEffect } from "react";
import { Code, Eye, PencilLine, Save, Bold, Italic, Underline, List, ListOrdered, Link2, RemoveFormatting } from "lucide-react";
import HtmlFrame from "./HtmlFrame";

interface Props {
  value: string;
  onChange: (v: string) => void;
  label: string;
  hint?: string;
  rows?: number;
}

type Tab = "code" | "edit" | "preview";

export default function HtmlPasteBox({ value, onChange, label, hint, rows = 8 }: Props) {
  const [tab, setTab] = useState<Tab>("code");
  const [dirty, setDirty] = useState(false);
  const editRef = useRef<HTMLIFrameElement | null>(null);
  const loadedRef = useRef<string>("\u0000");

  useEffect(() => {
    if (tab !== "edit") return;
    const doc = editRef.current?.contentDocument;
    if (!doc) return;
    if (loadedRef.current === value && doc.body) return;
    doc.open();
    doc.write(value || "<p>Chưa có nội dung.</p>");
    doc.close();
    loadedRef.current = value;
    const body = doc.body;
    if (body) {
      body.setAttribute("contenteditable", "true");
      (body.style as any).outline = "none";
      body.addEventListener("input", () => setDirty(true));
      body.addEventListener("keydown", (e: any) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doc.execCommand("insertLineBreak"); }
      });
      body.addEventListener("dragstart", (e: any) => e.preventDefault());
      body.addEventListener("drop", (e: any) => e.preventDefault());
    }
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, value]);

  function readFrame(): string | null {
    const doc = editRef.current?.contentDocument;
    if (!doc || !doc.documentElement) return null;
    doc.body?.removeAttribute("contenteditable");
    const out = (doc.doctype ? "<!doctype html>\n" : "") + (doc.documentElement.outerHTML || "");
    doc.body?.setAttribute("contenteditable", "true");
    return out;
  }
  function commitEdits() {
    const out = readFrame();
    if (out == null) return;
    loadedRef.current = out;
    onChange(out);
    setDirty(false);
  }
  function switchTab(next: Tab) {
    if (tab === "edit" && next !== "edit") {
      const out = readFrame();
      if (out != null) { loadedRef.current = out; onChange(out); setDirty(false); }
    }
    setTab(next);
  }
  // Định dạng trực tiếp (bôi đen chữ rồi bấm nút)
  function exec(cmd: string, val?: string) {
    const doc = editRef.current?.contentDocument;
    if (!doc) return;
    editRef.current?.contentWindow?.focus();
    doc.execCommand(cmd, false, val);
    setDirty(true);
  }

  const TabBtn = ({ t, icon, text }: { t: Tab; icon: React.ReactNode; text: string }) => (
    <button type="button" onClick={() => switchTab(t)}
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[0.7rem] font-semibold ${tab === t ? "bg-royal text-white" : "bg-cream text-muted hover:text-royal"}`}>
      {icon}{text}
    </button>
  );
  const FmtBtn = ({ title, onDo, children }: { title: string; onDo: () => void; children: React.ReactNode }) => (
    <button type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={onDo}
      className="rounded p-1.5 text-muted hover:bg-cream hover:text-royal">{children}</button>
  );

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-xs font-bold text-muted">{label}</label>
        <div className="flex gap-1">
          <TabBtn t="code" icon={<Code size={11} />} text="Mã HTML" />
          <TabBtn t="edit" icon={<PencilLine size={11} />} text="Sửa trực tiếp" />
          <TabBtn t="preview" icon={<Eye size={11} />} text="Xem trước" />
        </div>
      </div>

      {tab === "code" ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} spellCheck={false}
          placeholder="<!doctype html> ... hoặc <div>...</div>"
          className="input-field font-mono text-xs" />
      ) : tab === "edit" ? (
        <div>
          {/* Thanh định dạng */}
          <div className="mb-1 flex flex-wrap items-center gap-1 rounded-lg border border-silver/30 bg-white p-1.5">
            <FmtBtn title="Đậm" onDo={() => exec("bold")}><Bold size={14} /></FmtBtn>
            <FmtBtn title="Nghiêng" onDo={() => exec("italic")}><Italic size={14} /></FmtBtn>
            <FmtBtn title="Gạch chân" onDo={() => exec("underline")}><Underline size={14} /></FmtBtn>
            <span className="mx-1 h-4 w-px bg-silver/30" />
            <button type="button" title="Tiêu đề lớn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("formatBlock", "H2")} className="rounded px-2 py-1 text-[0.7rem] font-bold text-muted hover:bg-cream hover:text-royal">H2</button>
            <button type="button" title="Tiêu đề nhỏ" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("formatBlock", "H3")} className="rounded px-2 py-1 text-[0.7rem] font-bold text-muted hover:bg-cream hover:text-royal">H3</button>
            <button type="button" title="Đoạn thường" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("formatBlock", "P")} className="rounded px-2 py-1 text-[0.7rem] font-medium text-muted hover:bg-cream hover:text-royal">P</button>
            <span className="mx-1 h-4 w-px bg-silver/30" />
            <FmtBtn title="Danh sách chấm" onDo={() => exec("insertUnorderedList")}><List size={14} /></FmtBtn>
            <FmtBtn title="Danh sách số" onDo={() => exec("insertOrderedList")}><ListOrdered size={14} /></FmtBtn>
            <FmtBtn title="Chèn link" onDo={() => { const url = window.prompt("Nhập link:"); if (url) exec("createLink", url); }}><Link2 size={14} /></FmtBtn>
            <span className="mx-1 h-4 w-px bg-silver/30" />
            <FmtBtn title="Xoá định dạng" onDo={() => exec("removeFormat")}><RemoveFormatting size={14} /></FmtBtn>
            <div className="ml-auto flex items-center gap-2">
              {dirty && <span className="text-[0.65rem] font-semibold text-amber-600">● chưa áp</span>}
              <button type="button" onClick={commitEdits} disabled={!dirty}
                className="inline-flex items-center gap-1 rounded bg-royal px-2.5 py-1 text-[0.7rem] font-bold text-white hover:bg-royal/90 disabled:opacity-40">
                <Save size={12} />Áp chỉnh sửa
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border-2 border-dashed border-royal/30 bg-white">
            {value.trim()
              ? <iframe ref={editRef} title="Sửa trực tiếp" sandbox="allow-same-origin" className="h-[50vh] w-full border-0 bg-white" />
              : <p className="py-10 text-center text-sm text-muted">Chưa có mã HTML. Dán ở tab <b>Mã HTML</b> trước.</p>}
          </div>
          <p className="mt-1 text-[0.7rem] text-muted">Bôi đen chữ rồi bấm nút định dạng. Sửa xong bấm <b>Áp chỉnh sửa</b> (đổi tab cũng tự áp), rồi <b>Lưu</b>.</p>
        </div>
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
