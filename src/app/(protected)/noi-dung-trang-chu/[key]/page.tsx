// FILE: src/app/(protected)/noi-dung-trang-chu/[key]/page.tsx — Sửa 1 khối nội dung
"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, Trash2, ImagePlus, X } from "lucide-react";
import { api, getImageUrl } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
function getToken() { return localStorage.getItem("accessToken") || ""; }

const LABELS: Record<string, string> = {
  hero: "Hero (banner đầu trang)",
  philosophy: "Phong cách dạy & Nội quy",
  tuition: "Thông tin học phí",
  books_spark: "Mô tả SPARK",
};

export default function EditSiteContentPage() {
  const { key } = useParams<{ key: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState("");
  const qrRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const res = await api.get(`/site-content/${key}`);
      if (res.success) {
        setData(res.data.data || {});
        if (key === "tuition" && res.data.data?.bank?.qrUrl) setQrPreview(getImageUrl(res.data.data.bank.qrUrl));
      } else {
        setData({}); // chưa có → khối rỗng, sẽ tạo khi lưu
      }
    })();
  }, [key]);

  function handleQr(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setQrFile(f);
    const r = new FileReader(); r.onload = () => setQrPreview(r.result as string); r.readAsDataURL(f);
    e.target.value = "";
  }

  async function handleSave() {
    setSaving(true); setError("");
    try {
      // Nếu có upload QR (chỉ khối tuition) → gửi FormData
      if (key === "tuition" && qrFile) {
        const fd = new FormData();
        fd.append("label", LABELS[key] || key);
        fd.append("data", JSON.stringify(data));
        fd.append("thumbnail", qrFile);
        const res = await fetch(`${API_URL}/site-content/${key}`, { method: "PUT", headers: { Authorization: `Bearer ${getToken()}` }, body: fd });
        const j = await res.json();
        if (!j.success) throw new Error(j.message);
      } else {
        const res = await api.put(`/site-content/${key}`, { label: LABELS[key] || key, data: JSON.stringify(data) });
        if (!res.success) throw new Error(res.message);
      }
      router.push("/noi-dung-trang-chu");
    } catch (e: any) {
      setError(e.message || "Lỗi lưu nội dung");
    } finally { setSaving(false); }
  }

  if (!data) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;

  return (
    <div className="mx-auto max-w-[780px]">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/noi-dung-trang-chu" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <h2 className="font-display text-2xl font-bold text-royal">Sửa: {LABELS[key] || key}</h2>
      </div>
      {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {/* ===== HERO ===== */}
      {key === "hero" && (
        <div className="card space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Tiêu đề</label>
            <input type="text" value={data.title || ""} onChange={(e) => setData({ ...data, title: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Slogan</label>
            <input type="text" value={data.subtitle || ""} onChange={(e) => setData({ ...data, subtitle: e.target.value })} className="input-field" />
          </div>
        </div>
      )}

      {/* ===== PHILOSOPHY ===== */}
      {key === "philosophy" && (
        <ItemsHtmlEditor
          items={data.items || []}
          onChange={(items) => setData({ ...data, items })}
          label="Các đoạn nội quy (mỗi ô 1 đoạn, hỗ trợ HTML)"
        />
      )}

      {/* ===== BOOKS_SPARK ===== */}
      {key === "books_spark" && (
        <div className="card">
          <label className="mb-1.5 block text-sm font-medium text-royal">Đoạn mô tả SPARK (hỗ trợ HTML)</label>
          <textarea value={data.html || ""} onChange={(e) => setData({ ...data, html: e.target.value })} rows={5} className="input-field resize-none font-mono text-xs" />
          <HtmlHint />
        </div>
      )}

      {/* ===== TUITION ===== */}
      {key === "tuition" && (
        <div className="space-y-5">
          <ItemsHtmlEditor
            items={(data.notes || []).map((n: any) => ({ html: n.html, style: n.style, sub: n.sub }))}
            onChange={(notes) => setData({ ...data, notes })}
            label="Các ghi chú học phí"
            withStyle
          />
          {/* Bank */}
          <div className="card space-y-4">
            <div className="text-sm font-bold text-royal">Thông tin chuyển khoản</div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Nhãn</label>
              <input type="text" value={data.bank?.label || ""} onChange={(e) => setData({ ...data, bank: { ...data.bank, label: e.target.value } })} className="input-field" placeholder="Chuyển khoản đến" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Tên/Số tài khoản</label>
              <input type="text" value={data.bank?.name || ""} onChange={(e) => setData({ ...data, bank: { ...data.bank, name: e.target.value } })} className="input-field" placeholder="VESTA UNI — TECHCOMBANK ..." />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Nội dung chuyển khoản</label>
              <input type="text" value={data.bank?.note || ""} onChange={(e) => setData({ ...data, bank: { ...data.bank, note: e.target.value } })} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Ảnh QR</label>
              {qrPreview ? (
                <div className="relative inline-block">
                  <img src={qrPreview} alt="QR" className="h-40 w-40 rounded-lg border object-contain bg-white p-1" />
                  <button onClick={() => { setQrFile(null); setQrPreview(""); }} className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => qrRef.current?.click()} className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-silver/40 bg-cream hover:border-gold/40"><ImagePlus size={26} className="text-muted" /></button>
              )}
              <input ref={qrRef} type="file" accept="image/*" className="hidden" onChange={handleQr} />
              <p className="mt-1 text-xs text-muted">Bỏ trống = giữ QR hiện tại.</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-silver/20 pt-6">
        <Link href="/noi-dung-trang-chu" className="btn-secondary">Huỷ</Link>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Lưu
        </button>
      </div>
    </div>
  );
}

function HtmlHint() {
  return <p className="mt-1.5 text-xs text-muted">Có thể dùng: <code>&lt;strong&gt;in đậm&lt;/strong&gt;</code>, <code>&lt;a href="..."&gt;link&lt;/a&gt;</code>. Emoji gõ trực tiếp.</p>;
}

function ItemsHtmlEditor({ items, onChange, label, withStyle }: { items: any[]; onChange: (v: any[]) => void; label: string; withStyle?: boolean }) {
  function setItem(i: number, patch: any) { onChange(items.map((it, x) => x === i ? { ...it, ...patch } : it)); }
  function add() { onChange([...items, withStyle ? { html: "", style: "normal" } : { html: "" }]); }
  function remove(i: number) { onChange(items.filter((_, x) => x !== i)); }
  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-medium text-royal">{label}</label>
        <button onClick={add} className="flex items-center gap-1 text-xs font-medium text-gold-dim hover:underline"><Plus size={14} />Thêm đoạn</button>
      </div>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-lg border border-silver/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">Đoạn {i + 1}</span>
              <button onClick={() => remove(i)} className="text-muted hover:text-red-500"><Trash2 size={14} /></button>
            </div>
            {withStyle && (
              <select value={it.style || "normal"} onChange={(e) => setItem(i, { style: e.target.value })} className="input-field mb-2">
                <option value="normal">Thường (viền đỏ)</option>
                <option value="highlight">Nổi bật (nền vàng)</option>
              </select>
            )}
            <textarea value={it.html || ""} onChange={(e) => setItem(i, { html: e.target.value })} rows={3} className="input-field resize-none font-mono text-xs" placeholder="Nội dung (hỗ trợ HTML)..." />
            {withStyle && it.style === "highlight" && (
              <input type="text" value={it.sub || ""} onChange={(e) => setItem(i, { sub: e.target.value })} className="input-field mt-2" placeholder="Dòng phụ (chỉ khối nổi bật)" />
            )}
          </div>
        ))}
      </div>
      <HtmlHint />
    </div>
  );
}