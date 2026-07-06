// FILE: src/components/book/BookForm.tsx — Form tạo/sửa sách
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export interface BookData {
  id?: string;
  title: string; price: string;
  highlight: boolean; orderIndex: number; isPublished: boolean;
}
export function emptyBook(): BookData {
  return { title: "", price: "", highlight: false, orderIndex: 0, isPublished: true };
}

export function BookForm({ initial, mode }: { initial: BookData; mode: "create" | "edit" }) {
  const router = useRouter();
  const [b, setB] = useState<BookData>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function set<K extends keyof BookData>(k: K, v: BookData[K]) { setB((p) => ({ ...p, [k]: v })); }

  async function handleSave() {
    if (!b.title.trim()) return setError("Vui lòng nhập tên sách");
    if (!b.price.trim()) return setError("Vui lòng nhập giá");
    setSaving(true); setError("");
    const body = { ...b, orderIndex: Number(b.orderIndex) || 0 };
    const res = mode === "create" ? await api.post("/books", body) : await api.put(`/books/${b.id}`, body);
    setSaving(false);
    if (res.success) router.push("/sach");
    else setError(res.message || "Lỗi lưu sách");
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/sach" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <h2 className="font-display text-2xl font-bold text-royal">{mode === "create" ? "Thêm sách" : "Sửa sách"}</h2>
      </div>
      {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="card space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-royal">Tên sách <span className="text-red-500">*</span></label>
          <input type="text" value={b.title} onChange={(e) => set("title", e.target.value)} placeholder="Giáo trình 6+" className="input-field" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_120px]">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Giá <span className="text-red-500">*</span></label>
            <input type="text" value={b.price} onChange={(e) => set("price", e.target.value)} placeholder="289.000đ" className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Thứ tự</label>
            <input type="number" value={b.orderIndex} onChange={(e) => set("orderIndex", parseInt(e.target.value) || 0)} className="input-field" />
          </div>
        </div>
        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm text-[#1a1a2e]">
            <input type="checkbox" checked={b.highlight} onChange={(e) => set("highlight", e.target.checked)} className="h-4 w-4" />
            Nổi bật (viền đỏ, dùng cho Combo)
          </label>
          <label className="flex items-center gap-2 text-sm text-[#1a1a2e]">
            <input type="checkbox" checked={b.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="h-4 w-4" />
            Hiển thị trên landing
          </label>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-silver/20 pt-6">
        <Link href="/sach" className="btn-secondary">Huỷ</Link>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Lưu
        </button>
      </div>
    </div>
  );
}