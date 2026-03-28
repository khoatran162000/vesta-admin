"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function CreateExamPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [title, setTitle] = useState(""); const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState(""); const [duration, setDuration] = useState("60");
  const [totalScore, setTotalScore] = useState("100"); const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api.get("/categories/flat").then((d) => { if (d.success) setCategories(d.data); }); }, []);

  async function handleSave() {
    if (!title || !categoryId) return; setSaving(true); setError("");
    try {
      const data = await api.post("/exams", { title, categoryId, description, duration, totalScore });
      if (data.success) router.push(`/ngan-hang-de/de-thi/${data.data.id}/cau-hoi`);
      else setError(data.message);
    } catch { setError("Lỗi server"); } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-[700px]">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/ngan-hang-de/de-thi" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <h2 className="font-display text-2xl font-bold text-royal">Tạo đề thi mới</h2>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="card space-y-5">
        <div><label className="mb-1 block text-sm font-medium text-royal">Tên đề thi *</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="VD: IELTS Listening Practice Test 1" /></div>
        <div><label className="mb-1 block text-sm font-medium text-royal">Danh mục *</label><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field"><option value="">— Chọn danh mục —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="mb-1 block text-sm font-medium text-royal">Mô tả</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field" placeholder="Mô tả đề thi (tuỳ chọn)" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-royal">Thời gian (phút) *</label><input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="input-field" /></div>
          <div><label className="mb-1 block text-sm font-medium text-royal">Tổng điểm *</label><input type="number" value={totalScore} onChange={(e) => setTotalScore(e.target.value)} className="input-field" /></div>
        </div>
        <button onClick={handleSave} disabled={saving || !title || !categoryId} className="btn-primary"><Save size={15} />{saving ? "Đang lưu..." : "Tạo đề thi & thêm câu hỏi →"}</button>
      </div>
    </div>
  );
}
