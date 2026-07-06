// FILE: src/components/teacher/TeacherForm.tsx — Form tạo/sửa giáo viên (dùng chung)
"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, Trash2, ImagePlus, X } from "lucide-react";
import { getImageUrl } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
function getToken() { return localStorage.getItem("accessToken") || ""; }

// 10 loại icon — key phải khớp ICON_MAP bên landing
export const ICON_OPTIONS = [
  { value: "podium", label: "Bục giảng / giám khảo" },
  { value: "landmark", label: "Trường / đại học" },
  { value: "cap", label: "Tốt nghiệp / học vấn" },
  { value: "users", label: "Đội nhóm / huấn luyện" },
  { value: "scale", label: "Cân / lý luận / luật" },
  { value: "briefcase", label: "Cặp / kinh doanh / kinh nghiệm" },
  { value: "book", label: "Sách / tác giả" },
  { value: "star", label: "Sao / điểm số" },
  { value: "target", label: "Đích / phương pháp" },
  { value: "award", label: "Huy chương / cảm hứng" },
];

interface Badge { num: string; label: string; }
interface Cred { icon: string; text: string; }
export interface TeacherData {
  id?: string;
  name: string; ma: string; subtitle: string;
  photoUrl: string | null;
  badges: Badge[];
  credentials: Cred[];
  orderIndex: number;
  isPublished: boolean;
}

export function emptyTeacher(): TeacherData {
  return {
    name: "", ma: "", subtitle: "", photoUrl: null,
    badges: [{ num: "", label: "" }, { num: "", label: "" }, { num: "", label: "" }],
    credentials: [{ icon: "podium", text: "" }],
    orderIndex: 0, isPublished: true,
  };
}

export function TeacherForm({ initial, mode }: { initial: TeacherData; mode: "create" | "edit" }) {
  const router = useRouter();
  const [t, setT] = useState<TeacherData>(initial);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initial.photoUrl ? getImageUrl(initial.photoUrl) : "");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof TeacherData>(k: K, v: TeacherData[K]) { setT((p) => ({ ...p, [k]: v })); }

  // Badges
  function setBadge(i: number, field: keyof Badge, v: string) {
    setT((p) => ({ ...p, badges: p.badges.map((b, x) => x === i ? { ...b, [field]: v } : b) }));
  }
  function addBadge() { setT((p) => ({ ...p, badges: [...p.badges, { num: "", label: "" }] })); }
  function removeBadge(i: number) { setT((p) => ({ ...p, badges: p.badges.filter((_, x) => x !== i) })); }

  // Credentials
  function setCred(i: number, field: keyof Cred, v: string) {
    setT((p) => ({ ...p, credentials: p.credentials.map((c, x) => x === i ? { ...c, [field]: v } : c) }));
  }
  function addCred() { setT((p) => ({ ...p, credentials: [...p.credentials, { icon: "star", text: "" }] })); }
  function removeCred(i: number) { setT((p) => ({ ...p, credentials: p.credentials.filter((_, x) => x !== i) })); }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file); setRemovePhoto(false);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }
  function clearPhoto() { setPhotoFile(null); setPhotoPreview(""); setRemovePhoto(true); }

  async function handleSave() {
    if (!t.name.trim()) return setError("Vui lòng nhập tên giáo viên");
    if (!t.subtitle.trim()) return setError("Vui lòng nhập dòng mô tả");
    const badges = t.badges.filter((b) => b.num.trim() && b.label.trim());
    const credentials = t.credentials.filter((c) => c.text.trim());
    if (credentials.length === 0) return setError("Cần ít nhất 1 dòng thành tích");

    setSaving(true); setError("");
    try {
      const fd = new FormData();
      fd.append("name", t.name.trim());
      fd.append("ma", t.ma.trim());
      fd.append("subtitle", t.subtitle.trim());
      fd.append("badges", JSON.stringify(badges));
      fd.append("credentials", JSON.stringify(credentials));
      fd.append("orderIndex", String(t.orderIndex));
      fd.append("isPublished", t.isPublished ? "true" : "false");
      if (photoFile) fd.append("thumbnail", photoFile);
      else if (removePhoto) fd.append("photoUrl", "");

      const url = mode === "create" ? `${API_URL}/teachers` : `${API_URL}/teachers/${t.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) router.push("/giao-vien");
      else setError(data.message || "Lỗi lưu giáo viên");
    } catch {
      setError("Lỗi kết nối server");
    } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-[820px]">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/giao-vien" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <h2 className="font-display text-2xl font-bold text-royal">{mode === "create" ? "Thêm giáo viên" : "Sửa giáo viên"}</h2>
      </div>
      {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {/* Thông tin cơ bản */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_140px]">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Tên (sau chữ IELTS) <span className="text-red-500">*</span></label>
            <input type="text" value={t.name} onChange={(e) => set("name", e.target.value)} placeholder="Ms. Ly Le" className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Học vị</label>
            <input type="text" value={t.ma} onChange={(e) => set("ma", e.target.value)} placeholder="(M.A.)" className="input-field" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-royal">Dòng mô tả <span className="text-red-500">*</span></label>
          <input type="text" value={t.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Dạy cả online và offline..." className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Thứ tự hiển thị</label>
            <input type="number" value={t.orderIndex} onChange={(e) => set("orderIndex", parseInt(e.target.value) || 0)} className="input-field" />
          </div>
          <label className="flex items-end gap-2 pb-3 text-sm text-[#1a1a2e]">
            <input type="checkbox" checked={t.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="h-4 w-4" />
            Hiển thị trên landing
          </label>
        </div>
      </div>

      {/* Ảnh */}
      <div className="card mt-5">
        <label className="mb-3 block text-sm font-medium text-royal">Ảnh chân dung (nên tách nền, PNG)</label>
        {photoPreview ? (
          <div className="relative inline-block">
            <img src={photoPreview} alt="preview" className="h-48 rounded-lg object-contain bg-cream shadow-sm" />
            <button onClick={clearPhoto} className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:scale-110"><X size={14} /></button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed border-silver/40 bg-cream hover:border-gold/40 hover:bg-gold/5">
            <div className="text-center"><ImagePlus size={30} className="mx-auto mb-2 text-muted" /><p className="text-sm text-muted">Bấm chọn ảnh (bỏ trống = hiện placeholder)</p></div>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
      </div>

      {/* Badges */}
      <div className="card mt-5">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-medium text-royal">Chỉ số nổi bật (badge)</label>
          <button onClick={addBadge} className="flex items-center gap-1 text-xs font-medium text-gold-dim hover:underline"><Plus size={14} />Thêm</button>
        </div>
        <div className="space-y-2">
          {t.badges.map((b, i) => (
            <div key={i} className="grid grid-cols-[100px_1fr_auto] items-center gap-2">
              <input type="text" value={b.num} onChange={(e) => setBadge(i, "num", e.target.value)} placeholder="16" className="input-field" />
              <input type="text" value={b.label} onChange={(e) => setBadge(i, "label", e.target.value)} placeholder="Năm KN" className="input-field" />
              <button onClick={() => removeBadge(i)} className="text-muted hover:text-red-500"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Badge để trống (cả 2 ô) sẽ bị bỏ khi lưu. Nên để 3 badge cho cân.</p>
      </div>

      {/* Credentials */}
      <div className="card mt-5">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-medium text-royal">Thành tích / chuyên môn (mỗi dòng 1 icon)</label>
          <button onClick={addCred} className="flex items-center gap-1 text-xs font-medium text-gold-dim hover:underline"><Plus size={14} />Thêm dòng</button>
        </div>
        <div className="space-y-2">
          {t.credentials.map((c, i) => (
            <div key={i} className="grid grid-cols-[190px_1fr_auto] items-start gap-2">
              <select value={c.icon} onChange={(e) => setCred(i, "icon", e.target.value)} className="input-field">
                {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <textarea value={c.text} onChange={(e) => setCred(i, "text", e.target.value)} rows={2} placeholder="Nội dung thành tích..." className="input-field resize-none" />
              <button onClick={() => removeCred(i)} className="pt-2 text-muted hover:text-red-500"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-silver/20 pt-6">
        <Link href="/giao-vien" className="btn-secondary">Huỷ</Link>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Lưu
        </button>
      </div>
    </div>
  );
}