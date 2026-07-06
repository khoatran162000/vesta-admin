// FILE: src/app/(protected)/sach/page.tsx — Danh sách sách/giáo trình
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Loader2, Eye, EyeOff, PenTool, Star } from "lucide-react";
import { api } from "@/lib/api";

export default function BookListPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadData(); }, []);
  async function loadData() {
    setLoading(true);
    const json = await api.get("/books");
    setBooks(json.data || []);
    setLoading(false);
  }
  async function togglePublish(b: any) {
    await api.put(`/books/${b.id}`, { isPublished: !b.isPublished });
    loadData();
  }
  async function handleDelete(id: string) {
    if (!confirm("Xác nhận xoá sách này?")) return;
    await api.delete(`/books/${id}`);
    loadData();
  }
  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">📖 Sách & Giáo Trình</h2>
          <p className="mt-1 text-sm text-muted">{books.length} đầu sách hiển thị trên landing</p>
        </div>
        <Link href="/sach/tao-moi" className="btn-primary"><Plus size={16} />Thêm sách</Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-silver/30 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
        ) : books.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">Chưa có sách nào.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">TT</th>
              <th className="px-4 py-3 font-semibold text-royal">Tên sách</th>
              <th className="px-4 py-3 font-semibold text-royal">Giá</th>
              <th className="px-4 py-3 font-semibold text-royal">Nổi bật</th>
              <th className="px-4 py-3 font-semibold text-royal">Trạng thái</th>
              <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
            </tr></thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-4 py-3 text-muted">{b.orderIndex}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a2e]">{b.title}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: "#C93040" }}>{b.price}</td>
                  <td className="px-4 py-3">{b.highlight ? <Star size={15} className="text-gold" fill="#C9A84C" /> : <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish(b)}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${b.isPublished ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {b.isPublished ? <><Eye size={11} />Hiện</> : <><EyeOff size={11} />Ẩn</>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/sach/${b.id}/sua`} title="Sửa" className="mr-1 inline-flex rounded p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><PenTool size={14} /></Link>
                    <button onClick={() => handleDelete(b.id)} title="Xoá" className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
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