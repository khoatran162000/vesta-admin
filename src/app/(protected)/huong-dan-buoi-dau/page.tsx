// FILE: src/app/(protected)/huong-dan-buoi-dau/page.tsx — Sửa trang Hướng dẫn nhập học buổi đầu (key co dinh: guide_first_day)
"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Eye, Code, PencilLine, Bold, Italic, Underline, List, ListOrdered, Link2, RemoveFormatting } from "lucide-react";
import { api } from "@/lib/api";

type Tab = "code" | "edit" | "preview";
const KEY = "guide_first_day";

export default function EditFirstDayGuidePage() {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<Tab>("code");
  const [dirty, setDirty] = useState(false);
  const previewRef = useRef<HTMLIFrameElement | null>(null);
  const editRef = useRef<HTMLIFrameElement | null>(null);
  const loadedRef = useRef<string>("\u0000");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await api.get(`/site-content/${KEY}`);
      if (res.success && res.data?.data?.html) setHtml(res.data.data.html);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (tab === "preview" && previewRef.current) previewRef.current.srcdoc = html;
  }, [tab, html]);

  useEffect(() => {
    if (tab !== "edit") return;
    const frame = editRef.current;
    const doc = frame?.contentDocument;
    if (!doc) return;
    if (loadedRef.current === html && doc.body) return;
    doc.open();
    doc.write(html || "<p>Chưa có nội dung.</p>");
    doc.close();
    loadedRef.current = html;
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
  }, [tab, html]);

  function commitEdits() {
    const doc = editRef.current?.contentDocument;
    if (!doc) return;
    doc.body?.removeAttribute("contenteditable");
    const out = (doc.doctype ? "<!doctype html>\n" : "") + (doc.documentElement?.outerHTML || "");
    doc.body?.setAttribute("contenteditable", "true");
    loadedRef.current = out;
    setHtml(out);
    setDirty(false);
    setMsg("Đã áp chỉnh sửa vào HTML — nhớ bấm Lưu.");
  }
  // Định dạng trực tiếp trên vùng đang sửa (bôi đen chữ rồi bấm nút)
  function exec(cmd: string, val?: string) {
    const doc = editRef.current?.contentDocument;
    if (!doc) return;
    editRef.current?.contentWindow?.focus();
    doc.execCommand(cmd, false, val);
    setDirty(true);
  }

  async function save() {
    let toSave = html;
    if (tab === "edit") {
      const doc = editRef.current?.contentDocument;
      if (doc) {
        doc.body?.removeAttribute("contenteditable");
        toSave = (doc.doctype ? "<!doctype html>\n" : "") + (doc.documentElement?.outerHTML || "");
        doc.body?.setAttribute("contenteditable", "true");
        setHtml(toSave); loadedRef.current = toSave; setDirty(false);
      }
    }
    setSaving(true); setMsg("");
    const res = await api.put(`/site-content/${KEY}`, {
      label: "Hướng dẫn nhập học buổi đầu",
      data: JSON.stringify({ html: toSave }),
    });
    setSaving(false);
    if (res.success) setMsg("Đã lưu. Học viên đã đóng phí sẽ thấy ngay.");
    else setMsg(res.message || "Lỗi lưu");
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;

  const tabBtn = (t: Tab, icon: React.ReactNode, text: string) => (
    <button onClick={() => setTab(t)}
      className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium ${tab === t ? "bg-royal text-white" : "text-muted hover:bg-cream-dark"}`}>
      {icon}{text}
    </button>
  );

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/dashboard" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">Hướng dẫn nhập học buổi đầu</h2>
          <p className="text-xs text-muted">Chỉ học viên đã đóng phí xem được. Sửa mã HTML, hoặc &quot;Sửa trực tiếp&quot; để chỉnh chữ. &quot;Xem trước&quot; rồi Lưu.</p>
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-silver/30 bg-white p-1">
          {tabBtn("code", <Code size={15} />, "Sửa HTML")}
          {tabBtn("edit", <PencilLine size={15} />, "Sửa trực tiếp")}
          {tabBtn("preview", <Eye size={15} />, "Xem trước")}
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-xs font-semibold text-green-600">{msg}</span>}
          <button onClick={save} disabled={saving} className="btn-primary"><Save size={15} />{saving ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </div>

      {tab === "code" && (
        <>
          <textarea value={html} onChange={(e) => setHtml(e.target.value)} spellCheck={false}
            className="h-[70vh] w-full rounded-lg border border-silver/40 p-3 font-mono text-xs leading-relaxed outline-none focus:border-gold"
            placeholder="Dán toàn bộ HTML của trang hướng dẫn buổi đầu vào đây..." />
          <p className="mt-1 text-xs text-muted">{(html.length / 1024).toFixed(0)} KB · Dán HTML đầy đủ (cả &lt;head&gt;, &lt;style&gt;) — hiển thị nguyên vẹn cho học viên.</p>
        </>
      )}

      {tab === "edit" && (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-silver/30 bg-cream/40 p-2">
            <span className="text-xs text-muted">Bấm vào <b>chữ</b> trong trang rồi gõ đè. Chỉ sửa chữ/số — ảnh, bố cục giữ nguyên. Đổi màu/thêm khối thì dùng tab <b>Sửa HTML</b>.</span>
            <div className="ml-auto flex items-center gap-2">
              {dirty && <span className="text-[0.7rem] font-semibold text-amber-600">● Có thay đổi chưa áp</span>}
              <button type="button" onClick={commitEdits} disabled={!dirty}
                className="inline-flex items-center gap-1 rounded bg-royal px-3 py-1 text-xs font-bold text-white hover:bg-royal/90 disabled:opacity-40">
                <Save size={13} />Áp chỉnh sửa
              </button>
            </div>
          </div>
          {/* Thanh định dạng cho Sửa trực tiếp */}
          <div className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border border-silver/30 bg-white p-1.5">
            <button type="button" title="Đậm" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} className="rounded p-1.5 text-muted hover:bg-cream hover:text-royal"><Bold size={15} /></button>
            <button type="button" title="Nghiêng" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} className="rounded p-1.5 text-muted hover:bg-cream hover:text-royal"><Italic size={15} /></button>
            <button type="button" title="Gạch chân" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} className="rounded p-1.5 text-muted hover:bg-cream hover:text-royal"><Underline size={15} /></button>
            <span className="mx-1 h-5 w-px bg-silver/30" />
            <button type="button" title="Tiêu đề lớn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("formatBlock", "H2")} className="rounded px-2 py-1 text-xs font-bold text-muted hover:bg-cream hover:text-royal">H2</button>
            <button type="button" title="Tiêu đề nhỏ" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("formatBlock", "H3")} className="rounded px-2 py-1 text-xs font-bold text-muted hover:bg-cream hover:text-royal">H3</button>
            <button type="button" title="Đoạn thường" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("formatBlock", "P")} className="rounded px-2 py-1 text-xs font-medium text-muted hover:bg-cream hover:text-royal">P</button>
            <span className="mx-1 h-5 w-px bg-silver/30" />
            <button type="button" title="Danh sách chấm" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} className="rounded p-1.5 text-muted hover:bg-cream hover:text-royal"><List size={15} /></button>
            <button type="button" title="Danh sách số" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertOrderedList")} className="rounded p-1.5 text-muted hover:bg-cream hover:text-royal"><ListOrdered size={15} /></button>
            <button type="button" title="Chèn link" onMouseDown={(e) => e.preventDefault()} onClick={() => { const url = window.prompt("Nhập link:"); if (url) exec("createLink", url); }} className="rounded p-1.5 text-muted hover:bg-cream hover:text-royal"><Link2 size={15} /></button>
            <span className="mx-1 h-5 w-px bg-silver/30" />
            <button type="button" title="Xoá định dạng" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("removeFormat")} className="rounded p-1.5 text-muted hover:bg-cream hover:text-royal"><RemoveFormatting size={15} /></button>
          </div>
          <div className="overflow-hidden rounded-lg border-2 border-dashed border-royal/30">
            {html.trim()
              ? <iframe ref={editRef} title="Sửa trực tiếp" sandbox="allow-same-origin" className="h-[70vh] w-full border-0 bg-white" />
              : <div className="flex h-[300px] items-center justify-center text-sm text-muted">Chưa có HTML. Dán ở tab <b className="mx-1">Sửa HTML</b> trước.</div>}
          </div>
          <p className="mt-1 text-xs text-muted">Sửa xong bấm <b>Áp chỉnh sửa</b> rồi <b>Lưu</b> (bấm Lưu cũng tự áp nếu bạn quên).</p>
        </>
      )}

      {tab === "preview" && (
        <div className="overflow-hidden rounded-lg border border-silver/40">
          <iframe ref={previewRef} title="Xem trước" className="h-[70vh] w-full border-0 bg-white" />
        </div>
      )}
    </div>
  );
}
