// FILE: src/app/(protected)/huong-dan-nhap-hoc/[slug]/page.tsx — Sửa 1 trang hướng dẫn nhập học (HTML thô + sửa trực tiếp + xem trước)
"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Eye, Code, PencilLine } from "lucide-react";
import { api } from "@/lib/api";

type Tab = "code" | "edit" | "preview";

export default function EditEnrollGuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const key = `enroll_${slug}`;
  const [html, setHtml] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<Tab>("code");
  const [dirty, setDirty] = useState(false);          // đã sửa trực tiếp chưa lưu vào ô HTML
  const previewRef = useRef<HTMLIFrameElement | null>(null);
  const editRef = useRef<HTMLIFrameElement | null>(null);
  const loadedRef = useRef<string>("\u0000");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await api.get(`/site-content/${key}`);
      if (res.success) {
        if (res.data?.data?.html) setHtml(res.data.data.html);
        if (res.data?.label) setLabel(String(res.data.label).replace(/^Hướng dẫn nhập học\s*/i, ""));
      }
      setLoading(false);
    })();
  }, [key]);

  // Xem trước: đổ HTML vào iframe cách ly
  useEffect(() => {
    if (tab === "preview" && previewRef.current) previewRef.current.srcdoc = html;
  }, [tab, html]);

  // Sửa trực tiếp: nạp HTML vào iframe rồi bật contentEditable (chỉ nạp lại khi html nguồn đổi / mới vào tab)
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
      // Chặn Enter tạo thẻ lộn xộn + khoá kéo-thả để không vỡ layout / xoá nhầm QR
      body.addEventListener("keydown", (e: any) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doc.execCommand("insertLineBreak"); }
      });
      body.addEventListener("dragstart", (e: any) => e.preventDefault());
      body.addEventListener("drop", (e: any) => e.preventDefault());
    }
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, html]);

  // Ghi nội dung đã sửa trực tiếp về ô HTML
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

  async function save() {
    // Nếu đang ở tab sửa trực tiếp và có thay đổi chưa áp → áp trước khi lưu
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
    const res = await api.put(`/site-content/${key}`, {
      label: `Hướng dẫn nhập học ${label || slug}`,
      data: JSON.stringify({ html: toSave, slug }),
    });
    setSaving(false);
    if (res.success) { setMsg("Đã lưu. Xem tại /nhap-hoc/" + slug); }
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
        <Link href="/huong-dan-nhap-hoc" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">Sửa hướng dẫn nhập học — {label || slug}</h2>
          <p className="text-xs text-muted">Sửa mã HTML, hoặc bấm &quot;Sửa trực tiếp&quot; để chỉnh chữ ngay trên trang. &quot;Xem trước&quot; để kiểm tra rồi Lưu.</p>
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
          <a href={`https://vestaedu.online/nhap-hoc/${slug}`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-muted underline hover:text-royal">Mở trang thật ↗</a>
          <button onClick={save} disabled={saving} className="btn-primary"><Save size={15} />{saving ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </div>

      {tab === "code" && (
        <>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            spellCheck={false}
            className="h-[70vh] w-full rounded-lg border border-silver/40 p-3 font-mono text-xs leading-relaxed outline-none focus:border-gold"
            placeholder="Dán toàn bộ HTML của trang hướng dẫn nhập học vào đây..."
          />
          <p className="mt-1 text-xs text-muted">{(html.length / 1024).toFixed(0)} KB · Dán HTML đầy đủ (cả &lt;head&gt;, &lt;style&gt;) — sẽ hiển thị nguyên vẹn cho học viên.</p>
        </>
      )}

      {tab === "edit" && (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-silver/30 bg-cream/40 p-2">
            <span className="text-xs text-muted">Bấm vào <b>chữ</b> trong trang rồi gõ đè. Chỉ sửa chữ/số — ảnh, QR, bố cục giữ nguyên. Đổi màu/thêm khối thì dùng tab <b>Sửa HTML</b>.</span>
            <div className="ml-auto flex items-center gap-2">
              {dirty && <span className="text-[0.7rem] font-semibold text-amber-600">● Có thay đổi chưa áp</span>}
              <button type="button" onClick={commitEdits} disabled={!dirty}
                className="inline-flex items-center gap-1 rounded bg-royal px-3 py-1 text-xs font-bold text-white hover:bg-royal/90 disabled:opacity-40">
                <Save size={13} />Áp chỉnh sửa
              </button>
            </div>
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