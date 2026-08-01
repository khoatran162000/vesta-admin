// FILE: src/app/(protected)/tai-lieu/page.tsx — Quản lý tài liệu bán (free/paid): upload, giá, publish
"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Loader2, X, Upload, FileText, Eye, EyeOff, Pencil } from "lucide-react";
import { api, getImageUrl } from "@/lib/api";

interface Item {
  id: string; title: string; description: string | null; type: string; price: number;
  fileUrl: string | null; thumbnailUrl: string | null; category: string | null;
  published: boolean; sortOrder: number; downloadCount: number;
}
const fmtVND = (n: number) => n.toLocaleString("vi-VN") + "₫";

export default function TaiLieuPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null | "new">(null);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const res = await api.get(`/materials?all=1`);
    if (res.success) setItems(res.data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 2500); }

  async function del(id: string) {
    if (!confirm("Xoá tài liệu này?")) return;
    const res = await api.delete(`/materials/${id}`);
    if (res.success) { load(); flash("Đã xoá"); } else alert(res.message);
  }
  async function togglePublish(it: Item) {
    const fd = new FormData();
    fd.append("published", String(!it.published));
    const res = await api.put(`/materials/${it.id}`, fd);
    if (res.success) load();
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">📚 Tài liệu (bán)</h2>
          <p className="mt-1 text-sm text-muted">Tài liệu miễn phí (tải luôn) và trả phí (HS chuyển khoản, admin duyệt đơn ở mục Đơn hàng).</p>
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary shrink-0"><Plus size={16} />Thêm tài liệu</button>
      </div>
      {msg && <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">{msg}</div>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
      ) : items.length === 0 ? (
        <div className="card py-12 text-center text-muted">Chưa có tài liệu. Bấm &quot;Thêm tài liệu&quot;.</div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-4 rounded-xl border border-silver/30 bg-white px-4 py-3 shadow-sm">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-royal/10 text-royal">
                {it.thumbnailUrl ? <img src={getImageUrl(it.thumbnailUrl)} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <FileText size={22} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#1a1a2e]">{it.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${it.type === "PAID" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{it.type === "PAID" ? fmtVND(it.price) : "Miễn phí"}</span>
                  {!it.published && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Ẩn</span>}
                </div>
                <div className="truncate text-xs text-muted">{it.category ? `${it.category} · ` : ""}{it.fileUrl ? "Đã có file" : "Chưa có file"} · Tải: {it.downloadCount}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => togglePublish(it)} title={it.published ? "Ẩn" : "Hiện"} className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal">{it.published ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                <button onClick={() => setEditing(it)} className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><Pencil size={16} /></button>
                <button onClick={() => del(it.id)} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <ItemEditor item={editing === "new" ? null : editing} close={() => setEditing(null)} saved={() => { setEditing(null); load(); flash("Đã lưu"); }} />}
    </div>
  );
}

function ItemEditor({ item, close, saved }: { item: Item | null; close: () => void; saved: () => void }) {
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [type, setType] = useState(item?.type || "FREE");
  const [price, setPrice] = useState(item?.price ? String(item.price) : "");
  const [category, setCategory] = useState(item?.category || "");
  const [published, setPublished] = useState(item?.published ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!title.trim()) return setErr("Nhập tiêu đề");
    if (type === "PAID" && (!price || Number(price) <= 0)) return setErr("Nhập giá cho tài liệu trả phí");
    if (!item && !file && type === "PAID") return setErr("Tải file tài liệu lên");
    setSaving(true); setErr("");
    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("description", description);
    fd.append("type", type);
    fd.append("price", type === "PAID" ? price : "0");
    fd.append("category", category);
    fd.append("published", String(published));
    if (file) fd.append("file", file);
    const res = item ? await api.put(`/materials/${item.id}`, fd) : await api.post(`/materials`, fd);
    setSaving(false);
    if (!res.success) return setErr(res.message || "Lỗi lưu");
    saved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-royal">{item ? "Sửa tài liệu" : "Thêm tài liệu"}</h3>
          <button onClick={close} className="text-muted hover:text-royal"><X size={20} /></button>
        </div>
        <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-muted">Tiêu đề</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="VD: Bộ đề IELTS Writing Task 2" /></label>
        <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-muted">Mô tả</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input-field" placeholder="Mô tả ngắn..." /></label>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <label><span className="mb-1 block text-xs font-bold text-muted">Loại</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
              <option value="FREE">Miễn phí</option>
              <option value="PAID">Trả phí</option>
            </select></label>
          {type === "PAID" && (
            <label><span className="mb-1 block text-xs font-bold text-muted">Giá (VND)</span>
              <input type="number" min="0" step="1000" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field" placeholder="50000" /></label>
          )}
        </div>
        <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-muted">Nhóm (tuỳ chọn)</span>
          <input value={category} onChange={(e) => setCategory(e.target.value)} className="input-field" placeholder="VD: IELTS Writing" /></label>
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-bold text-muted">File tài liệu {item && "(để trống nếu giữ file cũ)"}</span>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-silver/40 bg-cream px-4 py-3 text-sm text-muted hover:border-gold/40">
            <Upload size={16} />{file ? file.name : item?.fileUrl ? "Đã có file — chọn để thay" : "Chọn file (PDF/Word/PPT/Excel/ZIP)"}
          </button>
        </label>
        <label className="mb-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4" />
          <span className="text-muted">Hiển thị công khai</span>
        </label>
        {err && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-3">
          <button onClick={close} className="btn-secondary">Huỷ</button>
          <button onClick={submit} disabled={saving} className="btn-primary">{saving ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </div>
    </div>
  );
}