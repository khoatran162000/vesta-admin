// FILE: src/app/(protected)/bai-tap/page.tsx — Danh sách bài tập tương tác
"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Eye, EyeOff, PenTool, BarChart3, Copy, Link2, Check, ArrowDownAZ, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { canEditContent } from "@/lib/permissions";

const STUDENT_URL = "https://student.vestaedu.online";

const VIS_LABELS: Record<string, { label: string; color: string }> = {
  PUBLIC: { label: "Công khai", color: "bg-green-50 text-green-700" },
  STUDENT: { label: "Học viên", color: "bg-blue-50 text-blue-700" },
  TEACHER: { label: "Giáo viên", color: "bg-purple-50 text-purple-700" },
  CLASS: { label: "Theo lớp", color: "bg-amber-50 text-amber-700" },
};

// Khối của một bài = gộp nhãn LV: (mô tả) + các lớp được tick (visibleTo khi CLASS)
function exKhoi(ex: any): string[] {
  const tags = new Set<string>();
  if (ex.level) tags.add(String(ex.level).trim());
  if (ex.visibility === "CLASS" && ex.visibleTo) {
    String(ex.visibleTo).split(",").map((s: string) => s.trim()).filter(Boolean).forEach((t: string) => tags.add(t));
  }
  return [...tags];
}

export default function ExerciseListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = canEditContent(user?.role);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dupId, setDupId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState("");
  const [q, setQ] = useState("");
  const [sortMode, setSortMode] = useState<"recent" | "az">("recent");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const isAdmin = user?.role === "ADMIN";

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
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  async function handleBulkDelete() {
    const ids = [...selected];
    if (!ids.length) return;
    if (!confirm(`Xoá ${ids.length} bài tập đã chọn? Thao tác không thể hoàn tác.`)) return;
    setBulkDeleting(true);
    let okCount = 0, failCount = 0;
    for (const id of ids) {
      try { const res = await api.delete(`/interactive/${id}`); if (res.success) okCount++; else failCount++; } catch { failCount++; }
    }
    setBulkDeleting(false);
    setSelected(new Set());
    await loadData();
    if (failCount) alert(`Đã xoá ${okCount} bài. ${failCount} bài không xoá được (có thể do quyền).`);
  }
  async function handleDuplicate(id: string) {
    setDupId(id);
    const res = await api.post(`/interactive/${id}/duplicate`, {});
    setDupId(null);
    if (res.success && res.data?.id) router.push(`/bai-tap/${res.data.id}/sua`);
    else alert(res.message || "Không có quyền thực hiện / lỗi nhân bản");
  }
  function copyLink(id: string) {
    const url = `${STUDENT_URL}/bai-tap/${id}`;
    try { navigator.clipboard?.writeText(url); } catch {}
    setCopiedId(id); setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
  }

  const khoiList = useMemo(() => {
    const s = new Set<string>();
    exercises.forEach((e) => exKhoi(e).forEach((k) => s.add(k)));
    return [...s].sort((a, b) => a.localeCompare(b, "vi"));
  }, [exercises]);
  const hasUncat = exercises.some((e) => exKhoi(e).length === 0);

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return exercises
      .filter((ex) => {
        const matchQ = !kw || String(ex.title).toLowerCase().includes(kw);
        if (kw) return matchQ; // đang tìm -> bỏ qua lọc khối, ra hết mọi khối
        const khoi = exKhoi(ex);
        return !levelFilter || (levelFilter === "__uncat__" ? khoi.length === 0 : khoi.includes(levelFilter));
      })
      .sort((a, b) => sortMode === "az"
        ? String(a.title || "").localeCompare(String(b.title || ""), "vi")
        : new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
  }, [exercises, q, levelFilter, sortMode]);

  const allShownSelected = shown.length > 0 && shown.every((ex) => selected.has(ex.id));
  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allShownSelected) shown.forEach((ex) => next.delete(ex.id));
      else shown.forEach((ex) => next.add(ex.id));
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">🎯 Bài Tập Tương Tác</h2>
          <p className="mt-1 text-sm text-muted">{exercises.length} bài tập · Quiz, Fill blank, Matching, Vocab</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm bài…" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            <button onClick={() => setLevelFilter("")} className={`rounded-full px-3 py-1 text-xs font-semibold ${!levelFilter ? "bg-[#1B2A5C] text-white" : "bg-gray-100 text-gray-600"}`}>Tất cả</button>
            {khoiList.map((lv) => (
              <button key={lv} onClick={() => setLevelFilter(lv)} className={`rounded-full px-3 py-1 text-xs font-semibold ${levelFilter === lv ? "bg-[#1B2A5C] text-white" : "bg-gray-100 text-gray-600"}`}>{lv}</button>
            ))}
            {hasUncat && (
              <button onClick={() => setLevelFilter("__uncat__")} className={`rounded-full px-3 py-1 text-xs font-semibold ${levelFilter === "__uncat__" ? "bg-[#1B2A5C] text-white" : "bg-gray-100 text-gray-600"}`}>Chưa phân loại</button>
            )}
            <span className="mx-1 h-4 w-px bg-gray-300" />
            <button onClick={() => setSortMode("recent")} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${sortMode === "recent" ? "bg-[#1B2A5C] text-white" : "bg-gray-100 text-gray-600"}`} title="Mới sửa gần nhất"><Clock size={12} />Mới sửa</button>
            <button onClick={() => setSortMode("az")} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${sortMode === "az" ? "bg-[#1B2A5C] text-white" : "bg-gray-100 text-gray-600"}`} title="Sắp xếp A-Z"><ArrowDownAZ size={12} />A-Z</button>
          </div>
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
      {isAdmin && selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm">
          <span className="font-semibold text-red-700">Đã chọn {selected.size} bài</span>
          <button onClick={() => setSelected(new Set())} className="text-xs font-medium text-gray-600 hover:underline">Bỏ chọn</button>
          <button onClick={handleBulkDelete} disabled={bulkDeleting}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
            {bulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {bulkDeleting ? "Đang xoá…" : `Xoá ${selected.size} bài đã chọn`}
          </button>
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
              {isAdmin && (
                <th className="w-10 px-3 py-3 text-center">
                  <input type="checkbox" checked={allShownSelected} onChange={toggleAll} title="Chọn tất cả" className="h-4 w-4 cursor-pointer accent-[#1B2A5C]" />
                </th>
              )}
              <th className="px-4 py-3 font-semibold text-royal">Tiêu đề</th>
              <th className="px-4 py-3 font-semibold text-royal">Loại</th>
              <th className="px-4 py-3 font-semibold text-royal">Số câu</th>
              <th className="px-4 py-3 font-semibold text-royal">Phân quyền</th>
              <th className="px-4 py-3 font-semibold text-royal">Trạng thái</th>
              <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
            </tr></thead>
            <tbody>
              {shown.map((ex) => {
                const qs = typeof ex.questions === "string" ? JSON.parse(ex.questions) : ex.questions;
                const count = typeof ex.questionCount === "number" ? ex.questionCount : (Array.isArray(qs) ? qs.length : 0);
                const vis = VIS_LABELS[ex.visibility] || VIS_LABELS.PUBLIC;
                return (
                  <tr key={ex.id} className={`border-b border-silver/10 hover:bg-cream/50 ${isAdmin && selected.has(ex.id) ? "bg-red-50/40" : ""}`}>
                    {isAdmin && (
                      <td className="w-10 px-3 py-3 text-center">
                        <input type="checkbox" checked={selected.has(ex.id)} onChange={() => toggleOne(ex.id)} className="h-4 w-4 cursor-pointer accent-[#1B2A5C]" />
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-[#1a1a2e]">
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
                      <button onClick={() => copyLink(ex.id)} title="Copy link cho học sinh" className="mr-1 inline-flex rounded p-1.5 text-muted hover:bg-cream-dark hover:text-royal">
                        {copiedId === ex.id ? <Check size={14} className="text-green-600" /> : <Link2 size={14} />}
                      </button>
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
