// FILE: src/components/NotificationEditor.tsx — Editor thông báo:
// Soạn trực tiếp trên iframe (giữ NGUYÊN HTML/CSS/font) + thanh format như blog + Dán HTML + Xem trước.
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Link2, RemoveFormatting, Code, Eye, PencilLine,
} from "lucide-react";

type Tab = "write" | "code" | "preview";

// HTML rời (không có <html>) → bọc thành tài liệu tối thiểu để soạn/hiển thị nhất quán.
function ensureDoc(html: string): string {
  const s = (html || "").trim();
  if (/<html[\s>]/i.test(s) || /<!doctype/i.test(s)) return s;
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<style>body{font-family:Inter,system-ui,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a2e;margin:12px;}</style>
</head><body>${s}</body></html>`;
}

export default function NotificationEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [tab, setTab] = useState<Tab>("write");
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const loadedRef = useRef<string>("\u0000"); // giá trị đã nạp vào iframe (tránh nạp đè khi đang gõ)

  const serialize = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    doc.body?.removeAttribute("contenteditable");
    const out = (doc.doctype ? "<!doctype html>\n" : "") + (doc.documentElement?.outerHTML || "");
    doc.body?.setAttribute("contenteditable", "true");
    loadedRef.current = out;   // đánh dấu đã đồng bộ → không reload (giữ con trỏ)
    onChange(out);
  }, [onChange]);

  // Nạp value vào iframe khi vào tab Soạn hoặc value đổi từ ngoài (dán ở tab Mã HTML).
  useEffect(() => {
    if (tab !== "write") return;
    const frame = frameRef.current;
    if (!frame) return;
    if (loadedRef.current === value && frame.contentDocument?.body) return;
    const doc = frame.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(ensureDoc(value));
    doc.close();
    loadedRef.current = value;
    const body = doc.body;
    if (body) {
      body.setAttribute("contenteditable", "true");
      (body.style as any).outline = "none";
      body.addEventListener("input", serialize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, value]);

  function cmd(command: string, val?: string) {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    (doc.body as HTMLElement)?.focus();
    try {
      if (command === "foreColor") doc.execCommand("styleWithCSS", false, "true");
      doc.execCommand(command, false, val);
    } catch {}
    serialize();
  }
  function addLink() { const u = prompt("Nhập link (https://...):"); if (u) cmd("createLink", u); }

  const b = "flex items-center justify-center rounded p-1.5 text-gray-600 hover:bg-gray-200";
  const tb = (t: Tab, icon: React.ReactNode, label: string) => (
    <button type="button" onClick={() => setTab(t)}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === t ? "bg-royal text-white" : "bg-cream text-muted hover:text-royal"}`}>{icon}{label}</button>
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {tb("write", <PencilLine size={13} />, "Soạn")}
        {tb("code", <Code size={13} />, "Mã HTML")}
        {tb("preview", <Eye size={13} />, "Xem trước")}
      </div>

      {tab === "write" && (
        <div className="rounded-lg border border-silver/40">
          <div className="flex flex-wrap items-center gap-1 border-b border-silver/30 bg-gray-50 p-1.5">
            <button type="button" title="Đậm" onMouseDown={(e)=>e.preventDefault()} onClick={()=>cmd("bold")} className={`${b} font-bold`}><Bold size={15}/></button>
            <button type="button" title="Nghiêng" onMouseDown={(e)=>e.preventDefault()} onClick={()=>cmd("italic")} className={b}><Italic size={15}/></button>
            <button type="button" title="Gạch chân" onMouseDown={(e)=>e.preventDefault()} onClick={()=>cmd("underline")} className={b}><Underline size={15}/></button>
            <span className="mx-0.5 h-5 w-px bg-gray-300"/>
            <select title="Cỡ chữ" defaultValue="" onMouseDown={(e)=>e.stopPropagation()} onChange={(e)=>{ if(e.target.value) cmd("fontSize", e.target.value); e.currentTarget.value=""; }} className="rounded border border-gray-300 px-1.5 py-1 text-xs text-gray-600">
              <option value="">Cỡ</option><option value="2">Nhỏ</option><option value="3">Thường</option><option value="5">Lớn</option><option value="6">Rất lớn</option>
            </select>
            <label title="Màu chữ" className={`${b} relative cursor-pointer`}><span className="text-xs font-bold" style={{borderBottom:"3px solid #dc2626"}}>A</span>
              <input type="color" onChange={(e)=>cmd("foreColor", e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0"/></label>
            <span className="mx-0.5 h-5 w-px bg-gray-300"/>
            <button type="button" title="Canh trái" onMouseDown={(e)=>e.preventDefault()} onClick={()=>cmd("justifyLeft")} className={b}><AlignLeft size={15}/></button>
            <button type="button" title="Canh giữa" onMouseDown={(e)=>e.preventDefault()} onClick={()=>cmd("justifyCenter")} className={b}><AlignCenter size={15}/></button>
            <button type="button" title="Canh phải" onMouseDown={(e)=>e.preventDefault()} onClick={()=>cmd("justifyRight")} className={b}><AlignRight size={15}/></button>
            <span className="mx-0.5 h-5 w-px bg-gray-300"/>
            <button type="button" title="Danh sách chấm" onMouseDown={(e)=>e.preventDefault()} onClick={()=>cmd("insertUnorderedList")} className={b}><List size={15}/></button>
            <button type="button" title="Danh sách số" onMouseDown={(e)=>e.preventDefault()} onClick={()=>cmd("insertOrderedList")} className={b}><ListOrdered size={15}/></button>
            <span className="mx-0.5 h-5 w-px bg-gray-300"/>
            <button type="button" title="Chèn link" onMouseDown={(e)=>e.preventDefault()} onClick={addLink} className={b}><Link2 size={15}/></button>
            <button type="button" title="Xoá định dạng" onMouseDown={(e)=>e.preventDefault()} onClick={()=>cmd("removeFormat")} className={b}><RemoveFormatting size={15}/></button>
          </div>
          <iframe ref={frameRef} title="soan-thong-bao" className="h-[300px] w-full rounded-b-lg bg-white"/>
        </div>
      )}

      {tab === "code" && (
        <textarea value={value} onChange={(e)=>onChange(e.target.value)} rows={12} spellCheck={false}
          placeholder="Dán mã HTML (giữ nguyên style/font). Xong sang tab Soạn để chỉnh chữ + định dạng."
          className="w-full resize-y rounded-lg border border-silver/40 bg-white p-3 font-mono text-xs leading-relaxed outline-none focus:border-gold"/>
      )}

      {tab === "preview" && (
        value.trim()
          ? <iframe title="xem-truoc-thong-bao" srcDoc={ensureDoc(value)} sandbox="allow-same-origin" className="h-[360px] w-full rounded-lg border border-silver/40 bg-white"/>
          : <div className="min-h-[180px] rounded-lg border border-silver/40 bg-white p-3 text-sm text-muted">Chưa có nội dung để xem trước.</div>
      )}
    </div>
  );
}