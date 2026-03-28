"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Eye, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface Student { id: string; email: string; fullName: string; isActive: boolean; createdAt: string; }

export default function TrackingPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: "STUDENT", page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const data = await api.get(`/users?${params}`);
      if (data.success) { setStudents(data.data); setTotal(data.meta.total); }
    } catch {} finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-bold text-royal">Theo dõi học viên</h2>
        <p className="text-sm text-muted">{total} học viên</p>
      </div>
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo tên hoặc email..." className="input-field pl-9" />
      </div>
      <div className="card !p-0 overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gold" /></div> : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-silver/20 bg-cream">
              <th className="px-5 py-3 font-semibold text-royal">Họ tên</th>
              <th className="px-5 py-3 font-semibold text-royal">Email</th>
              <th className="px-5 py-3 font-semibold text-royal">Trạng thái</th>
              <th className="px-5 py-3 text-right font-semibold text-royal">Xem chi tiết</th>
            </tr></thead>
            <tbody>{students.map((s) => (
              <tr key={s.id} className="border-b border-silver/10 hover:bg-cream/50">
                <td className="px-5 py-3 font-medium text-[#1a1a2e]">{s.fullName}</td>
                <td className="px-5 py-3 text-muted">{s.email}</td>
                <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{s.isActive ? "Hoạt động" : "Đã khoá"}</span></td>
                <td className="px-5 py-3 text-right"><Link href={`/theo-doi/${s.id}`} className="btn-secondary text-xs"><Eye size={13} />Chi tiết</Link></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {!loading && students.length === 0 && <p className="py-12 text-center text-muted">Chưa có học viên nào.</p>}
      </div>
    </div>
  );
}
