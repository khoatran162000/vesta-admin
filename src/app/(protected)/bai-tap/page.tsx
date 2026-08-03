// FILE: src/app/(protected)/bai-tap/page.tsx — Danh sách bài tập tương tác
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Eye, EyeOff, PenTool, BarChart3, Copy } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { canEditContent } from "@/lib/permissions";
const VIS_LABELS: Record<string, { label: string; color: string }> = {
  PUBLIC: { label: "Công khai", color: "bg-green-50 text-green-700" },
  STUDENT: { label: "Học viên", color: "bg-blue-50 text-blue-700" },
  TEACHER: { label: "Giáo viên", color: "bg-purple-50 text-purple-700" },
  CLASS: { label: "Theo lớp", color: "bg-amber-50 text-amber-700" },
};
export default function ExerciseListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = canEditContent(user?.role);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dupId, setDupId] = useState<string | null>(null);
  useEffect(() => { loadData(); }, []);
  async function loadData() {
    setLoading(true);
    const json = await api.get("/interactive");
    setExercises(json.data || []);
    setLoading(false);
  }
  async function togglePublish(ex: any) {
    const res = await api.put(`/interactive/${ex.id}`, { isPublished: !ex.isPublished });
    if (!res.success) { alert(res.message || "Không có quyền thực hiện"); return; }
    loadData();
  }
  async function handleDelete(id: string) {
    if (!confirm("Xác nhận xoá bài tập này?")) return;
    const res = await api.delete(`/interactive/${id}`);
    if (!res.success) { alert(res.message || "Không có quyền thực hiện"); return; }
    loadData();
  }
  async function handleDuplicate(id: string) {
    setDupId(id);
    const res = await api.post(`/interactive/${id}/duplicate`, {});
    setDupId(null);
    if (res.success && res.data?.id) router.push(`/bai-tap/${res.data.id}/sua`);
    else alert(res.message || "Không có quyền thực hiện / lỗi nhân bản");
  }
  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">🎯 Bài Tập Tương Tác</h2>
          <p className="mt-1 text-sm text-muted">{exercises.length} bài tập · Quiz, Fill blank, Matching, Vocab</p>
        </div>
        {canEdit && (
          <Link href="/bai-tap/tao-moi" className="btn-primary">
            <Plus size={16} />Tạo bài tập
          </Link>
        )}
      </div>
      {!canEdit && user && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-2.5 text-xs text-blue-800">
          Bạn có quyền <b>xem bài tập + đáp án</b> và theo dõi kết quả học viên. Việc tạo/sửa nội dung do quản trị viên thực hiện.
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-silver/30 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
        ) : exercises.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">Chưa có bài tập nào.{canEdit ? " Tạo bài đầu tiên!" : ""}</div>
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
                const count = typeof ex.questionCount === "number" ? ex.questionCount : (Array.isArray(qs) ? qs.length : 0);
                const vis = VIS_LABELS[ex.visibility] || VIS_LABELS.PUBLIC;
                return (
                  <tr key={ex.id} className="border-b border-silver/10 hover:bg-cream/50">
                    <td className="px-4 py-3 font-medium text-[#1a1a2e]">
                      {/* Bấm tiêu đề → xem như học sinh (làm thử) */}
                      <Link href={`/bai-tap/${ex.id}/xem`} className="hover:text-royal hover:underline" title="Xem như học sinh (làm thử)">
                        {ex.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><span className="rounded bg-cream px-2 py-0.5 text-xs text-muted">{ex.type}</span></td>
                    <td className="px-4 py-3 text-muted">{count}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${vis.color}`}>{vis.label}</span>
                      {ex.visibility === "CLASS" && ex.visibleTo && <span className="ml-1 text-xs text-muted">({ex.visibleTo})</span>}
                    </td>
                    <td className="px-4 py-3">
                      {/* GV: badge chỉ để xem — PUT /interactive là ADMIN-only, bấm sẽ 403 */}
                      {canEdit ? (
                        <button onClick={() => togglePublish(ex)}
                          className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ex.isPublished ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {ex.isPublished ? <><Eye size={11} />Đã đăng</> : <><EyeOff size={11} />Nháp</>}
                        </button>
                      ) : (
                        <span className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ex.isPublished ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {ex.isPublished ? <><Eye size={11} />Đã đăng</> : <><EyeOff size={11} />Nháp</>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* Xem như học sinh — mọi vai đều thấy */}
                      <Link href={`/bai-tap/${ex.id}/xem`} title="Xem như học sinh (làm thử)" className="mr-1 inline-flex rounded p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Eye size={14} /></Link>
                      <Link href={`/bai-tap/${ex.id}/thong-ke`} title="Thống kê" className="mr-1 inline-flex rounded p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><BarChart3 size={14} /></Link>
                      {canEdit && (
                        <>
                          <button onClick={() => handleDuplicate(ex.id)} disabled={dupId === ex.id} title="Nhân bản (tạo bản nháp cùng format)"
                            className="mr-1 inline-flex rounded p-1.5 text-muted hover:bg-cream-dark hover:text-royal disabled:opacity-40">
                            {dupId === ex.id ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                          </button>
                          <Link href={`/bai-tap/${ex.id}/sua`} title="Sửa" className="mr-1 inline-flex rounded p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><PenTool size={14} /></Link>
                          <button onClick={() => handleDelete(ex.id)} title="Xoá" className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                        </>
                      )}
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