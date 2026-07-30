// FILE: src/app/(protected)/huong-dan-nhap-hoc/[slug]/page.tsx — Sửa 1 trang hướng dẫn nhập học (HTML thô + xem trước)
"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Eye, Code } from "lucide-react";
import { api } from "@/lib/api";
export default function EditEnrollGuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const key = `enroll_${slug}`;
  const [html, setHtml] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"code" | "preview">("code");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
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
  // Đổ HTML vào iframe khi xem trước (srcdoc cô lập hoàn toàn CSS)
  useEffect(() => {
    if (tab === "preview" && iframeRef.current) {
      iframeRef.current.srcdoc = html;
    }
  }, [tab, html]);
  async function save() {
    setSaving(true); setMsg("");
    const res = await api.put(`/site-content/${key}`, {
      label: `Hướng dẫn nhập học ${label || slug}`,
      data: JSON.stringify({ html, slug }),
    });
    setSaving(false);
    if (res.success) { setMsg("Đã lưu. Xem tại /nhap-hoc/" + slug); }
    else setMsg(res.message || "Lỗi lưu");
  }
  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/huong-dan-nhap-hoc" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">Sửa hướng dẫn nhập học — {label || slug}</h2>
          <p className="text-xs text-muted">Sửa HTML trực tiếp hoặc dán bản mới. Bấm &quot;Xem trước&quot; để kiểm tra rồi Lưu.</p>
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-silver/30 bg-white p-1">
          <button onClick={() => setTab("code")}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium ${tab === "code" ? "bg-royal text-white" : "text-muted hover:bg-cream-dark"}`}>
            <Code size={15} />Sửa HTML
          </button>
          <button onClick={() => setTab("preview")}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium ${tab === "preview" ? "bg-royal text-white" : "text-muted hover:bg-cream-dark"}`}>
            <Eye size={15} />Xem trước
          </button>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-xs font-semibold text-green-600">{msg}</span>}
          <a href={`https://vestaedu.online/nhap-hoc/${slug}`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-muted underline hover:text-royal">Mở trang thật ↗</a>
          <button onClick={save} disabled={saving} className="btn-primary"><Save size={15} />{saving ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </div>
      {tab === "code" ? (
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
      ) : (
        <div className="overflow-hidden rounded-lg border border-silver/40">
          <iframe ref={iframeRef} title="Xem trước" className="h-[70vh] w-full border-0 bg-white" />
        </div>
      )}
    </div>
  );
}