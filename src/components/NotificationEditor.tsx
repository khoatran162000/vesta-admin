// FILE: src/components/NotificationEditor.tsx — Editor thông báo (giữ nguyên HTML/CSS/font).
// Nguyên tắc chống đơ: iframe nạp HTML 1 LẦN khi mở tab Soạn; trong lúc gõ React KHÔNG đụng iframe.
// Chỉ đọc nội dung ra (onChange) khi RỜI tab Soạn hoặc bấm nút format.
"use client";
import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Link2, RemoveFormatting, Code, Eye, PencilLine,
} from "lucide-react";

type Tab = "write" | "code" | "preview";

function ensureDoc(html: string): string {
  const s = (html || "").trim();
  if (/<html[\s>]/i.test(s) || /<!doctype/i.test(s)) return s;
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<style>body{font-family:Inter,system-ui,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a2e;margin:12px;}</style>
</head><body>${s}</body></html>`;
}

export default function NotificationEditor({ value, onChange, flushRef }: {
  value: string; onChange: (html: string) => void;
  flushRef?: React.MutableRefObject<(() => string) | null>;
}) {
  const [tab, setTabState] = useState<Tab>("code"); // mở mặc định ở Mã HTML để dán nhanh; qua Soạn để gõ
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Cho trang cha đọc nội dung mới nhất từ iframe (khi bấm Gửi mà chưa đổi tab)
  useEffect(() => {
    if (!flushRef) return;
    flushRef.current = () => {
      if (tab === "write") {
        const html = readFrame();
        if (html != null) { onChangeRef.current(html); return html; }
      }
      return valueRef.current;
    };
    return () => { if (flushRef) flushRef.current = null; };
  });

  // Đọc HTML hiện tại trong iframe (không set contentEditable off/on để tránh nháy)
  function readFrame(): string | null {
    const doc = frameRef.current?.contentDocument;
    if (!doc || !doc.documentElement) return null;
    return (doc.doctype ? "<!doctype html>\n" : "") + doc.documentElement.outerHTML;
  }
  // Nạp HTML vào iframe + bật sửa (gọi khi MỞ tab Soạn)
  function loadFrame(html: string) {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(ensureDoc(html));
    doc.close();
    const body = doc.body;
    if (body) {
      body.setAttribute("contenteditable", "true");
      (body.style as any).outline = "none";
    }
  }

  // Chuyển tab: nếu ĐANG rời tab Soạn → đọc nội dung iframe ra trước.
  // Nếu ĐANG vào tab Soạn → nạp value hiện tại vào iframe.
  function setTab(next: Tab) {
    if (tab === "write" && next !== "write") {
      const html = readFrame();
      if (html != null) onChangeRef.current(html);
    }
    setTabState(next);
  }

  // Khi ở tab Soạn: nạp iframe 1 lần lúc vào tab. KHÔNG phụ thuộc value → gõ không bị đụng.
  useEffect(() => {
    if (tab !== "write") return;
    loadFrame(valueRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Nút format: thao tác trên iframe rồi đọc lại ra ngoài (không nạp lại iframe)
  function cmd(command: string, val?: string) {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    (doc.body as HTMLElement)?.focus();
    try {
      if (command === "foreColor") doc.execCommand("styleWithCSS", false, "true");
      doc.execCommand(command, false, val);
    } catch {}
    const html = readFrame();
    if (html != null) onChangeRef.current(html);
  }
  function addLink() { const u = prompt("Nhập link (https://...):"); if (u) cmd("createLink", u); }

  const b = "flex items-center justify-center rounded p-1.5 text-gray-600 hover:bg-gray-200";
  const tbn = (t: Tab, icon: React.ReactNode, label: string) => (
    <button type="button" onClick={() => setTab(t)}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === t ? "bg-royal text-white" : "bg-cream text-muted hover:text-royal"}`}>{icon}{label}</button>
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {tbn("write", <PencilLine size={13} />, "Soạn")}
        {tbn("code", <Code size={13} />, "Mã HTML")}
        {tbn("preview", <Eye size={13} />, "Xem trước")}
      </div>

      {/* iframe LUÔN mount, chỉ ẩn/hiện — không bị dựng lại */}
      <div style={{ display: tab === "write" ? "block" : "none" }}>
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
        <p className="mt-1 text-[0.7rem] text-muted">Gõ trong ô này, hoặc dán HTML ở tab <b>Mã HTML</b> rồi qua đây chỉnh chữ. Khi gửi/đổi tab, nội dung tự lưu.</p>
      </div>

      {tab === "code" && (
        <textarea value={value} onChange={(e)=>onChange(e.target.value)} rows={12} spellCheck={false}
          placeholder="Dán mã HTML (giữ nguyên style/font). Xong sang tab Soạn để chỉnh chữ."
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