// FILE: src/app/(protected)/ngan-hang-de/de-thi/[examId]/page.tsx — Sua de thi
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function EditExamPage() {
  const params = useParams();
  const examId = params.examId as string;
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [title, setTitle] = useState(""); const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState(""); const [duration, setDuration] = useState("");
  const [totalScore, setTotalScore] = useState(""); const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [examData, catData] = await Promise.all([api.get(`/exams/${examId}`), api.get("/categories/flat")]);
        if (catData.success) setCategories(catData.data);
        if (examData.success) {
          const e = examData.data;
          setTitle(e.title); setCategoryId(e.categoryId); setDescription(e.description || "");
          setDuration(String(e.duration)); setTotalScore(String(e.totalScore)); setStatus(e.status);
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, [examId]);

  async function handleSave() {
    setSaving(true); setError("");
    try {
      const data = await api.put(`/exams/${examId}`, { title, categoryId, description, duration, totalScore, status });
      if (data.success) router.push("/ngan-hang-de/de-thi"); else setError(data.message);
    } catch { setError("Lỗi server"); } finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;

  return (
    <div className="mx-auto max-w-[700px]">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/ngan-hang-de/de-thi" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <h2 className="font-display text-2xl font-bold text-royal">Chỉnh sửa đề thi</h2>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="card space-y-5">
        <div><label className="mb-1 block text-sm font-medium text-royal">Tên đề thi *</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" /></div>
        <div><label className="mb-1 block text-sm font-medium text-royal">Danh mục *</label><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field"><option value="">— Chọn —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="mb-1 block text-sm font-medium text-royal">Mô tả</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field" /></div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-royal">Thời gian (phút)</label><input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="input-field" /></div>
          <div><label className="mb-1 block text-sm font-medium text-royal">Tổng điểm</label><input type="number" value={totalScore} onChange={(e) => setTotalScore(e.target.value)} className="input-field" /></div>
          <div><label className="mb-1 block text-sm font-medium text-royal">Trạng thái</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></div>
        </div>
        <div className="flex items-center justify-between">
          <Link href={`/ngan-hang-de/de-thi/${examId}/cau-hoi`} className="btn-secondary">Quản lý câu hỏi →</Link>
          <button onClick={handleSave} disabled={saving || !title || !categoryId} className="btn-primary"><Save size={15} />{saving ? "Đang lưu..." : "Cập nhật"}</button>
        </div>
      </div>
    </div>
  );
}