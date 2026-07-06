// FILE: src/app/(protected)/khoa-hoc/page.tsx — Danh sách khoá học (landing)
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Loader2, Eye, EyeOff, PenTool } from "lucide-react";
import { api } from "@/lib/api";

const TYPE_LABEL: Record<string, string> = {
  FULL: "Full (rộng)", HALF: "Half (nửa)", SUPPORT: "Hỗ trợ",
};

export default function CourseListPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadData(); }, []);
  async function loadData() {
    setLoading(true);
    const json = await api.get("/courses");
    setCourses(json.data || []);
    setLoading(false);
  }
  async function togglePublish(c: any) {
    await api.put(`/courses/${c.id}`, { isPublished: !c.isPublished });
    loadData();
  }
  async function handleDelete(id: string) {
    if (!confirm("Xác nhận xoá khoá học này?")) return;
    await api.delete(`/courses/${id}`);
    loadData();
  }
  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">📚 Các Khoá Học</h2>
          <p className="mt-1 text-sm text-muted">{courses.length} khoá hiển thị trên landing</p>
        </div>
        <Link href="/khoa-hoc/tao-moi" className="btn-primary"><Plus size={16} />Thêm khoá học</Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-silver/30 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
        ) : courses.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">Chưa có khoá học nào.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">TT</th>
              <th className="px-4 py-3 font-semibold text-royal">Khoá học</th>
              <th className="px-4 py-3 font-semibold text-royal">Dạng</th>
              <th className="px-4 py-3 font-semibold text-royal">Học phí</th>
              <th className="px-4 py-3 font-semibold text-royal">Trạng thái</th>
              <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
            </tr></thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-4 py-3 text-muted">{c.orderIndex}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#1a1a2e]">{c.title}</div>
                    {c.badge && <div className="text-xs text-muted">{c.badge}{c.isSpecial ? " · nổi bật" : ""}</div>}
                  </td>
                  <td className="px-4 py-3"><span className="rounded bg-cream px-2 py-0.5 text-xs text-muted">{TYPE_LABEL[c.cardType] || c.cardType}</span></td>
                  <td className="px-4 py-3 text-xs text-muted">{c.price || c.specialPrice || c.cta || "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish(c)}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.isPublished ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.isPublished ? <><Eye size={11} />Hiện</> : <><EyeOff size={11} />Ẩn</>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/khoa-hoc/${c.id}/sua`} title="Sửa" className="mr-1 inline-flex rounded p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><PenTool size={14} /></Link>
                    <button onClick={() => handleDelete(c.id)} title="Xoá" className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}