// FILE: src/app/(protected)/bai-tap/page.tsx — Danh sách bài tập tương tác
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Loader2, Eye, EyeOff, PenTool } from "lucide-react";
import { api } from "@/lib/api";

const VIS_LABELS: Record<string, { label: string; color: string }> = {
  PUBLIC: { label: "Công khai", color: "bg-green-50 text-green-700" },
  STUDENT: { label: "Học viên", color: "bg-blue-50 text-blue-700" },
  TEACHER: { label: "Giáo viên", color: "bg-purple-50 text-purple-700" },
  CLASS: { label: "Theo lớp", color: "bg-amber-50 text-amber-700" },
};

export default function ExerciseListPage() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const json = await api.get("/interactive");
    setExercises(json.data || []);
    setLoading(false);
  }

  async function togglePublish(ex: any) {
    await api.put(`/interactive/${ex.id}`, { isPublished: !ex.isPublished });
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xác nhận xoá bài tập này?")) return;
    await api.delete(`/interactive/${id}`);
    loadData();
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">🎯 Bài Tập Tương Tác</h2>
          <p className="mt-1 text-sm text-muted">{exercises.length} bài tập · Quiz, Fill blank, Matching, Vocab</p>
        </div>
        <Link href="/bai-tap/tao-moi" className="btn-primary">
          <Plus size={16} />Tạo bài tập
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-silver/30 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
        ) : exercises.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">Chưa có bài tập nào. Tạo bài đầu tiên!</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">Tiêu đề</th>
              <th className="px-4 py-3 font-semibold text-royal">Loại</th>
              <th className="px-4 py-3 font-semibold text-royal">Số câu</th>
              <th className="px-4 py-3 font-semibold text-royal">Phân quyền</th>
              <th className="px-4 py-3 font-semibold text-royal">Trạng thái</th>
              <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
            </tr></thead>
            <tbody>
              {exercises.map((ex) => {
                const qs = typeof ex.questions === "string" ? JSON.parse(ex.questions) : ex.questions;
                const vis = VIS_LABELS[ex.visibility] || VIS_LABELS.PUBLIC;
                return (
                  <tr key={ex.id} className="border-b border-silver/10 hover:bg-cream/50">
                    <td className="px-4 py-3 font-medium text-[#1a1a2e]">{ex.title}</td>
                    <td className="px-4 py-3"><span className="rounded bg-cream px-2 py-0.5 text-xs text-muted">{ex.type}</span></td>
                    <td className="px-4 py-3 text-muted">{Array.isArray(qs) ? qs.length : 0}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${vis.color}`}>{vis.label}</span>
                      {ex.visibility === "CLASS" && ex.visibleTo && <span className="ml-1 text-xs text-muted">({ex.visibleTo})</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => togglePublish(ex)}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ex.isPublished ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {ex.isPublished ? <><Eye size={11} />Đã đăng</> : <><EyeOff size={11} />Nháp</>}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/bai-tap/${ex.id}`} className="mr-1 inline-flex rounded p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><PenTool size={14} /></Link>
                      <button onClick={() => handleDelete(ex.id)} className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
