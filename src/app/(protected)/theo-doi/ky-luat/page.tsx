// FILE: src/app/(protected)/theo-doi/ky-luat/page.tsx — Theo dõi kỷ luật học tập
"use client";
import { useState, useEffect, useCallback } from "react";
import { Loader2, Flag, Lock, Unlock, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

interface FlaggedStudent {
  id: string; fullName: string; email: string;
  studyFlag: boolean; lockedAt: string | null;
}
interface NoWorkRow {
  id: string; fullName: string; email: string; openedNoWork: number;
  studyFlag: boolean; lockedAt: string | null;
}
const OPEN_NO_WORK_LIMIT = 5;

export default function DisciplinePage() {
  const [flagged, setFlagged] = useState<FlaggedStudent[]>([]);
  const [noWork, setNoWork] = useState<NoWorkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // HS bị cắm cờ/khoá: lấy từ /users rồi lọc client-side
      const usersRes = await api.get(`/users?role=STUDENT&page=1&limit=500`);
      if (usersRes.success) {
        const list = (usersRes.data as FlaggedStudent[]).filter((s) => s.studyFlag || s.lockedAt);
        setFlagged(list);
      }
      // Mở-không-làm hôm nay
      const statsRes = await api.get(`/interactive/open-no-work-stats`);
      if (statsRes.success) setNoWork(statsRes.data || []);
    } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleUnlock(id: string, name: string) {
    if (!confirm(`Gỡ cờ / mở khoá cho ${name}?`)) return;
    setActing(id);
    try {
      const res = await api.patch(`/users/${id}/unlock`);
      if (res.success) await load();
      else alert(res.message || "Lỗi mở khoá");
    } catch { alert("Lỗi kết nối"); } finally { setActing(null); }
  }

  function fmtDate(d: string | null) {
    if (!d) return "—";
    try { return new Date(d).toLocaleString("vi-VN"); } catch { return "—"; }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;

  return (
    <div className="mx-auto max-w-[900px] space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-royal">Theo dõi kỷ luật học tập</h2>
        <p className="text-sm text-muted">Học viên bị nhắc/khoá và tình trạng mở bài không làm</p>
      </div>

      {/* ─── Phần A: HS bị cắm cờ / khoá ─── */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-royal">
          <Flag size={18} className="text-amber-500" /> Học viên cần chú ý ({flagged.length})
        </h3>
        <div className="card !p-0 overflow-hidden">
          {flagged.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Không có học viên nào bị nhắc hoặc khoá. 👍</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-silver/20 bg-cream">
                <th className="px-5 py-3 font-semibold text-royal">Họ tên</th>
                <th className="px-5 py-3 font-semibold text-royal">Trạng thái</th>
                <th className="px-5 py-3 font-semibold text-royal">Thời điểm khoá</th>
                <th className="px-5 py-3 text-right font-semibold text-royal">Thao tác</th>
              </tr></thead>
              <tbody>{flagged.map((s) => (
                <tr key={s.id} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-[#1a1a2e]">{s.fullName}</div>
                    <div className="text-xs text-muted">{s.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    {s.lockedAt ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600"><Lock size={11} />Đã khoá học</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700"><Flag size={11} />Bị nhắc nhở</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted">{fmtDate(s.lockedAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleUnlock(s.id, s.fullName)} disabled={acting === s.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                      {acting === s.id ? <Loader2 size={12} className="animate-spin" /> : <Unlock size={12} />}
                      Gỡ / Mở khoá
                    </button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </section>

      {/* ─── Phần B: Mở-không-làm hôm nay ─── */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-royal">
          <AlertTriangle size={18} className="text-red-500" /> Mở bài không làm hôm nay
        </h3>
        <p className="mb-3 text-xs text-muted">Học viên mở từ {OPEN_NO_WORK_LIMIT} bài khác nhau trở lên mà không làm sẽ bị hệ thống tự nhắc/khoá vào cuối ngày.</p>
        <div className="card !p-0 overflow-hidden">
          {noWork.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Hôm nay chưa có học viên nào mở bài mà không làm.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-silver/20 bg-cream">
                <th className="px-5 py-3 font-semibold text-royal">Họ tên</th>
                <th className="px-5 py-3 font-semibold text-royal">Số bài mở, không làm</th>
                <th className="px-5 py-3 font-semibold text-royal">Trạng thái</th>
              </tr></thead>
              <tbody>{noWork.map((s) => {
                const danger = s.openedNoWork >= OPEN_NO_WORK_LIMIT;
                return (
                  <tr key={s.id} className="border-b border-silver/10 hover:bg-cream/50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-[#1a1a2e]">{s.fullName}</div>
                      <div className="text-xs text-muted">{s.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-bold ${danger ? "text-red-600" : "text-amber-600"}`}>{s.openedNoWork} bài</span>
                      {danger && <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[0.6rem] font-semibold text-red-600">quá ngưỡng</span>}
                    </td>
                    <td className="px-5 py-3">
                      {s.lockedAt ? <span className="text-xs text-red-600">Đã khoá</span>
                        : s.studyFlag ? <span className="text-xs text-amber-700">Đã nhắc</span>
                        : <span className="text-xs text-muted">Chưa xử lý</span>}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}