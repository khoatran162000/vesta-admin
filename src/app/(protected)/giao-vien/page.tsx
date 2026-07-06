// FILE: src/app/(protected)/giao-vien/page.tsx — Danh sách giáo viên (landing)
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Loader2, Eye, EyeOff, PenTool } from "lucide-react";
import { api, getImageUrl } from "@/lib/api";

export default function TeacherListPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadData(); }, []);
  async function loadData() {
    setLoading(true);
    const json = await api.get("/teachers");
    setTeachers(json.data || []);
    setLoading(false);
  }
  async function togglePublish(t: any) {
    await api.put(`/teachers/${t.id}`, { isPublished: !t.isPublished });
    loadData();
  }
  async function handleDelete(id: string) {
    if (!confirm("Xác nhận xoá giáo viên này?")) return;
    await api.delete(`/teachers/${id}`);
    loadData();
  }
  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">👩‍🏫 Đội Ngũ Giáo Viên</h2>
          <p className="mt-1 text-sm text-muted">{teachers.length} giáo viên hiển thị trên landing</p>
        </div>
        <Link href="/giao-vien/tao-moi" className="btn-primary"><Plus size={16} />Thêm giáo viên</Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-silver/30 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
        ) : teachers.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">Chưa có giáo viên nào.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">Thứ tự</th>
              <th className="px-4 py-3 font-semibold text-royal">Giáo viên</th>
              <th className="px-4 py-3 font-semibold text-royal">Số dòng TC</th>
              <th className="px-4 py-3 font-semibold text-royal">Trạng thái</th>
              <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
            </tr></thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-4 py-3 text-muted">{t.orderIndex}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-silver/40 bg-cream">
                        {t.photoUrl
                          ? <img src={getImageUrl(t.photoUrl)} alt={t.name} className="h-full w-full object-cover" />
                          : <div className="flex h-full w-full items-center justify-center text-[0.6rem] text-muted">Ảnh</div>}
                      </div>
                      <div>
                        <div className="font-medium text-[#1a1a2e]">{t.name} {t.ma}</div>
                        <div className="max-w-[340px] truncate text-xs text-muted">{t.subtitle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{Array.isArray(t.credentials) ? t.credentials.length : 0}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish(t)}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.isPublished ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {t.isPublished ? <><Eye size={11} />Hiện</> : <><EyeOff size={11} />Ẩn</>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/giao-vien/${t.id}/sua`} title="Sửa" className="mr-1 inline-flex rounded p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><PenTool size={14} /></Link>
                    <button onClick={() => handleDelete(t.id)} title="Xoá" className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
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