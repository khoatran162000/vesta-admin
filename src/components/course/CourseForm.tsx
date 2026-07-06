// FILE: src/components/course/CourseForm.tsx — Form tạo/sửa khoá học
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface Feature { icon: string; text: string; }
export interface CourseData {
  id?: string;
  cardType: string;
  title: string; badge: string;
  isSpecial: boolean; badgeOutline: boolean;
  features: Feature[];
  commitment: string; scheduleLabel: string; schedule: string;
  price: string; onlinePrice: string; cta: string;
  specialPrice: string; originalPrice: string;
  orderIndex: number; isPublished: boolean;
}

export function emptyCourse(): CourseData {
  return {
    cardType: "FULL", title: "", badge: "",
    isSpecial: false, badgeOutline: false,
    features: [{ icon: "🎯", text: "" }],
    commitment: "", scheduleLabel: "THỜI LƯỢNG", schedule: "",
    price: "", onlinePrice: "", cta: "",
    specialPrice: "", originalPrice: "",
    orderIndex: 0, isPublished: true,
  };
}

const ICON_SUGGEST = ["🎯", "📚", "✏️", "💡", "🧠", "📝", "💎", "👩‍🏫", "📊", "🖥️", "🎁", "🧑", "🚀"];

export function CourseForm({ initial, mode }: { initial: CourseData; mode: "create" | "edit" }) {
  const router = useRouter();
  const [c, setC] = useState<CourseData>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof CourseData>(k: K, v: CourseData[K]) { setC((p) => ({ ...p, [k]: v })); }
  function setFeat(i: number, field: keyof Feature, v: string) {
    setC((p) => ({ ...p, features: p.features.map((f, x) => x === i ? { ...f, [field]: v } : f) }));
  }
  function addFeat() { setC((p) => ({ ...p, features: [...p.features, { icon: "💡", text: "" }] })); }
  function removeFeat(i: number) { setC((p) => ({ ...p, features: p.features.filter((_, x) => x !== i) })); }

  const isSupport = c.cardType === "SUPPORT";

  async function handleSave() {
    if (!c.title.trim()) return setError("Vui lòng nhập tên khoá học");
    const features = c.features.filter((f) => f.text.trim());
    if (features.length === 0) return setError("Cần ít nhất 1 dòng đặc điểm");
    setSaving(true); setError("");
    const body = { ...c, features, orderIndex: Number(c.orderIndex) || 0 };
    const res = mode === "create"
      ? await api.post("/courses", body)
      : await api.put(`/courses/${c.id}`, body);
    setSaving(false);
    if (res.success) router.push("/khoa-hoc");
    else setError(res.message || "Lỗi lưu khoá học");
  }

  return (
    <div className="mx-auto max-w-[820px]">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/khoa-hoc" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <h2 className="font-display text-2xl font-bold text-royal">{mode === "create" ? "Thêm khoá học" : "Sửa khoá học"}</h2>
      </div>
      {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {/* Cơ bản */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Tên khoá học <span className="text-red-500">*</span></label>
            <input type="text" value={c.title} onChange={(e) => set("title", e.target.value)} placeholder="IELTS 6+" className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Dạng thẻ</label>
            <select value={c.cardType} onChange={(e) => set("cardType", e.target.value)} className="input-field">
              <option value="FULL">Full — thẻ rộng</option>
              <option value="HALF">Half — thẻ nửa (2 cột)</option>
              <option value="SUPPORT">Hỗ trợ — thẻ vàng</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_140px]">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Nhãn (badge)</label>
            <input type="text" value={c.badge} onChange={(e) => set("badge", e.target.value)} placeholder="12 TUẦN / LỚP 7-9 / ƯU ĐÃI" className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Thứ tự</label>
            <input type="number" value={c.orderIndex} onChange={(e) => set("orderIndex", parseInt(e.target.value) || 0)} className="input-field" />
          </div>
        </div>
        <div className="flex flex-wrap gap-5">
          {!isSupport && (
            <label className="flex items-center gap-2 text-sm text-[#1a1a2e]">
              <input type="checkbox" checked={c.isSpecial} onChange={(e) => set("isSpecial", e.target.checked)} className="h-4 w-4" />
              Khoá nổi bật (header đỏ đô)
            </label>
          )}
          <label className="flex items-center gap-2 text-sm text-[#1a1a2e]">
            <input type="checkbox" checked={c.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="h-4 w-4" />
            Hiển thị trên landing
          </label>
        </div>
      </div>

      {/* Đặc điểm (features) */}
      <div className="card mt-5">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-medium text-royal">Đặc điểm khoá học</label>
          <button onClick={addFeat} className="flex items-center gap-1 text-xs font-medium text-gold-dim hover:underline"><Plus size={14} />Thêm dòng</button>
        </div>
        <div className="space-y-2">
          {c.features.map((f, i) => (
            <div key={i} className="grid grid-cols-[70px_1fr_auto] items-start gap-2">
              <input type="text" value={f.icon} onChange={(e) => setFeat(i, "icon", e.target.value)} placeholder="🎯" className="input-field text-center" list="icon-suggest" />
              <textarea value={f.text} onChange={(e) => setFeat(i, "text", e.target.value)} rows={2} placeholder="Nội dung đặc điểm..." className="input-field resize-none" />
              <button onClick={() => removeFeat(i)} className="pt-2 text-muted hover:text-red-500"><Trash2 size={15} /></button>
            </div>
          ))}
          <datalist id="icon-suggest">{ICON_SUGGEST.map((e) => <option key={e} value={e} />)}</datalist>
        </div>
        <p className="mt-2 text-xs text-muted">Icon là emoji, gõ trực tiếp hoặc chọn gợi ý. Gợi ý: {ICON_SUGGEST.join(" ")}</p>
      </div>

      {/* Trường riêng theo dạng */}
      {!isSupport ? (
        <div className="card mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Dòng cam kết (tuỳ chọn)</label>
            <input type="text" value={c.commitment} onChange={(e) => set("commitment", e.target.value)} placeholder="Cam kết chuẩn đầu ra 6.0+" className="input-field" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-royal">Nhãn lịch/thời lượng</label>
              <input type="text" value={c.scheduleLabel} onChange={(e) => set("scheduleLabel", e.target.value)} placeholder="THỜI LƯỢNG / LỊCH HỌC" className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-royal">Nội dung lịch/thời lượng</label>
              <input type="text" value={c.schedule} onChange={(e) => set("schedule", e.target.value)} placeholder="36 buổi | 20:00–22:00 T2,4,6" className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-royal">Học phí</label>
              <input type="text" value={c.price} onChange={(e) => set("price", e.target.value)} placeholder="12.000.000 VND" className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-royal">Giá online (tuỳ chọn)</label>
              <input type="text" value={c.onlinePrice} onChange={(e) => set("onlinePrice", e.target.value)} placeholder="Online: 11.400.000" className="input-field" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Dòng CTA (dùng cho khoá "Liên hệ", tuỳ chọn)</label>
            <input type="text" value={c.cta} onChange={(e) => set("cta", e.target.value)} placeholder="💰 Liên hệ để được tư vấn phù hợp" className="input-field" />
          </div>
        </div>
      ) : (
        <div className="card mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Giá ưu đãi</label>
            <input type="text" value={c.specialPrice} onChange={(e) => set("specialPrice", e.target.value)} placeholder="Lệ phí ưu đãi: 4.550.000 VND" className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Giá gốc (gạch tham chiếu)</label>
            <input type="text" value={c.originalPrice} onChange={(e) => set("originalPrice", e.target.value)} placeholder="Giá gốc: 4.664.000" className="input-field" />
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-silver/20 pt-6">
        <Link href="/khoa-hoc" className="btn-secondary">Huỷ</Link>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Lưu
        </button>
      </div>
    </div>
  );
}