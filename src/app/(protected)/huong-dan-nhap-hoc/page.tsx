// FILE: src/app/(protected)/huong-dan-nhap-hoc/page.tsx — Hub trang hướng dẫn nhập học (động, tự thêm/xoá)
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ChevronRight, Plus, Trash2, Loader2, X } from "lucide-react";
import { api } from "@/lib/api";

interface Guide { key: string; label: string; slug: string }

// Sinh slug từ tên: "IELTS 8+" → "ielts8plus", "789 Intensive" → "789intensive"
function toSlug(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 40);
}

export default function EnrollGuideHubPage() {
  const router = useRouter();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const [delKey, setDelKey] = useState<string | null>(null);

  async function loadGuides() {
    setLoading(true);
    const res = await api.get(`/site-content`);
    if (res.success && Array.isArray(res.data)) {
      const list: Guide[] = res.data
        .filter((x: any) => typeof x.key === "string" && x.key.startsWith("enroll_"))
        .map((x: any) => ({
          key: x.key,
          slug: x.data?.slug || x.key.replace(/^enroll_/, ""),
          label: (x.label || "").replace(/^Hướng dẫn nhập học\s*/i, "") || x.key.replace(/^enroll_/, ""),
        }));
      setGuides(list);
    }
    setLoading(false);
  }
  useEffect(() => { loadGuides(); }, []);

  // Tên đổi → tự cập nhật slug (trừ khi người dùng đã sửa slug tay)
  function onNameChange(v: string) {
    setNewName(v);
    if (!slugTouched) setNewSlug(toSlug(v));
  }

  async function create() {
    setErr("");
    const name = newName.trim();
    const slug = (newSlug.trim() || toSlug(name));
    if (!name) { setErr("Nhập tên khoá"); return; }
    if (!slug) { setErr("Slug không hợp lệ"); return; }
    if (guides.some((g) => g.slug === slug)) { setErr("Slug đã tồn tại, đổi tên khác"); return; }
    setCreating(true);
    const key = `enroll_${slug}`;
    const res = await api.put(`/site-content/${key}`, {
      label: `Hướng dẫn nhập học ${name}`,
      data: JSON.stringify({ html: "", slug }),
    });
    setCreating(false);
    if (!res.success) { setErr(res.message || "Lỗi tạo trang"); return; }
    setShowAdd(false); setNewName(""); setNewSlug(""); setSlugTouched(false);
    // Vào luôn trang sửa để dán nội dung
    router.push(`/huong-dan-nhap-hoc/${slug}`);
  }

  async function doDelete(key: string) {
    const res = await api.delete(`/site-content/${key}`);
    setDelKey(null);
    if (res.success) loadGuides();
    else alert(res.message || "Lỗi xoá");
  }

  return (
    <div className="mx-auto max-w-[820px]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">📋 Hướng Dẫn Nhập Học</h2>
          <p className="mt-1 text-sm text-muted">
            Nội dung trang &quot;Chi tiết &amp; Hướng dẫn nhập học&quot; cho từng khoá (HS xem khi bấm nút trên thẻ lớp). Bấm để sửa.
          </p>
        </div>
        <button onClick={() => { setShowAdd(true); setErr(""); }} className="btn-primary shrink-0"><Plus size={16} />Thêm trang mới</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
      ) : guides.length === 0 ? (
        <div className="card py-12 text-center text-muted">Chưa có trang hướng dẫn nào. Bấm &quot;Thêm trang mới&quot;.</div>
      ) : (
        <div className="space-y-3">
          {guides.map((g) => (
            <div key={g.key}
              className="flex items-center gap-4 rounded-xl border border-silver/30 bg-white px-5 py-4 shadow-sm hover:border-gold/50 hover:bg-cream/40">
              <button onClick={() => router.push(`/huong-dan-nhap-hoc/${g.slug}`)} className="flex flex-1 items-center gap-4 text-left">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-royal/10 text-royal"><GraduationCap size={20} /></span>
                <div className="flex-1">
                  <div className="font-medium text-[#1a1a2e]">{g.label}</div>
                  <div className="text-xs text-muted">/nhap-hoc/{g.slug}</div>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </button>
              <button onClick={() => setDelKey(g.key)} title="Xoá trang"
                className="shrink-0 rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Modal thêm trang */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-royal">Thêm trang hướng dẫn</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted hover:text-royal"><X size={20} /></button>
            </div>
            <label className="mb-1 block text-xs font-bold text-muted">Tên khoá</label>
            <input value={newName} onChange={(e) => onNameChange(e.target.value)} placeholder="VD: IELTS 8+"
              className="input-field mb-3" autoFocus />
            <label className="mb-1 block text-xs font-bold text-muted">Đường dẫn (tự sinh, sửa được)</label>
            <div className="mb-1 flex items-center gap-1">
              <span className="text-sm text-muted">/nhap-hoc/</span>
              <input value={newSlug} onChange={(e) => { setSlugTouched(true); setNewSlug(toSlug(e.target.value)); }}
                placeholder="ielts8plus" className="input-field flex-1" />
            </div>
            <p className="mb-3 text-[0.7rem] text-muted">Chỉ chữ thường + số, không dấu cách. Sau khi tạo, nhớ vào Khoá học đặt Link CTA = <b>/nhap-hoc/{newSlug || "slug"}</b></p>
            {err && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="btn-secondary">Huỷ</button>
              <button onClick={create} disabled={creating} className="btn-primary">{creating ? "Đang tạo..." : "Tạo & sửa nội dung"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Xác nhận xoá */}
      {delKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setDelKey(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 font-display text-xl font-bold text-royal">Xoá trang hướng dẫn?</h3>
            <p className="mb-4 text-sm text-muted">Nội dung trang này sẽ bị xoá vĩnh viễn. Không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDelKey(null)} className="btn-secondary">Huỷ</button>
              <button onClick={() => doDelete(delKey)} className="btn-danger">Xoá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}