"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, Loader2, Eye } from "lucide-react";
import { api } from "@/lib/api";

interface Exam {
  id: string; title: string; status: string; duration: number; totalScore: number;
  category: { id: string; name: string }; _count: { questions: number; examAttempts: number }; createdAt: string;
}

export default function ExamListPage() {
  const [exams, setExams] = useState<Exam[]>([]); const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); const [search, setSearch] = useState("");
  const [page, setPage] = useState(1); const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const data = await api.get(`/exams?${params}`);
      if (data.success) { setExams(data.data); setTotal(data.meta.total); }
    } catch {} finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => { const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400); return () => clearTimeout(t); }, [searchInput]);

  async function handleDelete(id: string) {
    const data = await api.delete(`/exams/${id}`);
    if (data.success) { setDeleteId(null); fetchExams(); } else { alert(data.message); setDeleteId(null); }
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-5 flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-royal">Đề thi</h2><p className="text-sm text-muted">{total} đề thi</p></div>
        <Link href="/ngan-hang-de/de-thi/tao-moi" className="btn-primary"><Plus size={15} />Tạo đề thi</Link>
      </div>
      <div className="relative mb-5"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Tìm theo tên đề thi..." className="input-field pl-9" /></div>
      <div className="card !p-0 overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gold" /></div> : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-silver/20 bg-cream"><th className="px-5 py-3 font-semibold text-royal">Đề thi</th><th className="px-5 py-3 font-semibold text-royal">Danh mục</th><th className="px-5 py-3 font-semibold text-royal">Câu hỏi</th><th className="px-5 py-3 font-semibold text-royal">Thời gian</th><th className="px-5 py-3 font-semibold text-royal">Trạng thái</th><th className="px-5 py-3 text-right font-semibold text-royal">Thao tác</th></tr></thead>
            <tbody>{exams.map((exam) => (
              <tr key={exam.id} className="border-b border-silver/10 hover:bg-cream/50">
                <td className="px-5 py-3 font-medium text-[#1a1a2e]">{exam.title}</td>
                <td className="px-5 py-3 text-muted">{exam.category.name}</td>
                <td className="px-5 py-3 text-muted">{exam._count.questions} câu</td>
                <td className="px-5 py-3 text-muted">{exam.duration} phút</td>
                <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${exam.status === "PUBLISHED" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{exam.status === "PUBLISHED" ? "Published" : "Draft"}</span></td>
                <td className="px-5 py-3 text-right"><div className="flex items-center justify-end gap-1">
                  <Link href={`/ngan-hang-de/de-thi/${exam.id}/cau-hoi`} title="Câu hỏi" className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Eye size={15} /></Link>
                  <Link href={`/ngan-hang-de/de-thi/${exam.id}`} title="Sửa" className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Pencil size={15} /></Link>
                  <button onClick={() => setDeleteId(exam.id)} title="Xoá" className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {!loading && exams.length === 0 && <p className="py-12 text-center text-muted">Chưa có đề thi nào.</p>}
      </div>
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
          <div className="w-full max-w-sm card space-y-4">
            <h3 className="font-display text-xl font-bold text-royal">Xoá đề thi?</h3>
            <p className="text-sm text-muted">Không thể xoá đề thi đã có lượt làm bài.</p>
            <div className="flex justify-end gap-3"><button onClick={() => setDeleteId(null)} className="btn-secondary">Huỷ</button><button onClick={() => handleDelete(deleteId)} className="btn-danger">Xoá</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
