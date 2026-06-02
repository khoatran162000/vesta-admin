// FILE: src/app/(protected)/theo-doi/[studentId]/vo-ghi/page.tsx
// Admin/GV xem toàn bộ vở ghi của 1 HV + tạo nhận xét mới + chấm bài
"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Plus, MessageSquareText, Clock, CheckCircle2,
  X, Save, Award, Trash2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function StudentNotebookPage() {
  const params = useParams();
  const studentId = params.studentId as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null); // null = tạo mới; object = chấm/sửa
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get(`/class/feedback/student/${studentId}`);
    if (res.success) setData(res.data);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    const res = await api.delete(`/class/feedback/${deleteItem.id}`);
    setDeleting(false);
    if (!res.success) { alert(res.message || "Lỗi xoá"); return; }
    setDeleteItem(null);
    load();
  }

  async function handleSave(form: any) {
    if (editItem?.id) {
      // Chấm/sửa bài đã có
      const res = await api.put(`/class/feedback/${editItem.id}/review`, {
        teacherComment: form.teacherComment,
        score: form.score,
      });
      if (!res.success) { alert(res.message || "Lỗi lưu"); return; }
    } else {
      // GV tạo nhận xét mới cho HV
      const res = await api.post(`/class/feedback/create-for-student`, {
        studentId,
        title: form.title,
        studentWork: form.studentWork,
        teacherComment: form.teacherComment,
        score: form.score,
      });
      if (!res.success) { alert(res.message || "Lỗi tạo"); return; }
    }
    setShowModal(false);
    setEditItem(null);
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  if (!data) return <p className="py-20 text-center text-muted">Không tìm thấy học viên.</p>;

  const { student, feedbacks, stats } = data;
  const pending = feedbacks.filter((f: any) => f.status === "PENDING");
  const reviewed = feedbacks.filter((f: any) => f.status === "REVIEWED");

  return (
    <div className="mx-auto max-w-[900px]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/theo-doi/${studentId}`} className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
          <div>
            <h2 className="font-display text-2xl font-bold text-royal">Vở ghi & Nhận xét</h2>
            <p className="text-sm text-muted">{student.fullName} · <span className="font-mono text-gold">{student.studentCode}</span>{student.course && ` · Lớp ${student.course}`}</p>
          </div>
        </div>
        <button onClick={() => { setEditItem(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} />Tạo nhận xét mới
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-[#1a1a2e]">{stats.total}</p>
          <p className="text-xs text-muted">Tổng bài</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-xs text-muted">Chờ chấm</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{stats.reviewed}</p>
          <p className="text-xs text-muted">Đã chấm</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gold">{stats.avgScore ?? "—"}</p>
          <p className="text-xs text-muted">Điểm TB</p>
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <>
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-royal">
            <Clock size={18} className="text-amber-600" />Chờ chấm ({pending.length})
          </h3>
          <div className="mb-6 space-y-3">
            {pending.map((fb: any) => (
              <div key={fb.id} className="card border-l-4 border-amber-500">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-semibold text-[#1a1a2e]">{fb.title}</h4>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditItem(fb); setShowModal(true); }} className="btn-primary text-xs">Chấm bài</button>
                    <button onClick={() => setDeleteItem(fb)} className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600" title="Xoá"><Trash2 size={14} /></button>
                  </div>
                </div>
                {fb.studentWork && <p className="line-clamp-3 whitespace-pre-wrap text-xs text-muted">{fb.studentWork}</p>}
                <p className="mt-2 text-[0.65rem] text-muted">Nộp: {new Date(fb.createdAt).toLocaleString("vi-VN")}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Reviewed */}
      <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-royal">
        <CheckCircle2 size={18} className="text-green-600" />Đã chấm ({reviewed.length})
      </h3>
      {reviewed.length === 0 ? (
        <div className="card py-12 text-center text-sm text-muted">Chưa có bài nào được chấm.</div>
      ) : (
        <div className="space-y-3">
          {reviewed.map((fb: any) => (
            <div key={fb.id} className="card border-l-4 border-green-500">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-[#1a1a2e]">{fb.title}</h4>
                  <p className="text-[0.65rem] text-muted">
                    {fb.reviewedAt && `Chấm: ${new Date(fb.reviewedAt).toLocaleDateString("vi-VN")}`}
                    {fb.reviewer && ` · ${fb.reviewer.fullName}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {fb.score != null && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gold">{fb.score}</p>
                      <p className="text-[0.6rem] text-muted">/ {fb.maxScore || 10}</p>
                    </div>
                  )}
                  <button onClick={() => { setEditItem(fb); setShowModal(true); }} className="btn-secondary text-xs">Sửa</button>
                  <button onClick={() => setDeleteItem(fb)} className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600" title="Xoá"><Trash2 size={14} /></button>
                </div>
              </div>

              {fb.studentWork && (
                <details className="mb-2">
                  <summary className="cursor-pointer text-xs font-semibold text-muted hover:text-royal">Xem bài làm của HV</summary>
                  <div className="mt-2 whitespace-pre-wrap rounded-lg bg-cream/60 p-3 text-xs text-[#1a1a2e]">{fb.studentWork}</div>
                </details>
              )}

              {fb.teacherComment && (
                <div className="rounded-lg border border-gold/30 bg-gold/5 p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-gold">
                    <MessageSquareText size={12} />Nhận xét của GV
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-[#1a1a2e]">{fb.teacherComment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <FeedbackModal item={editItem} studentName={student.fullName}
          onClose={() => { setShowModal(false); setEditItem(null); }} onSave={handleSave} />
      )}

      {/* Modal xác nhận xoá */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-xl font-bold text-royal">Xác nhận xoá</h3>
            <p className="mt-2 text-sm text-muted">
              Bạn có chắc muốn xoá nhận xét <strong className="text-[#1a1a2e]">&quot;{deleteItem.title}&quot;</strong>?
              {deleteItem.status === "REVIEWED" && " Học viên sẽ không còn thấy nhận xét này nữa."} Hành động này không thể hoàn tác.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setDeleteItem(null)} disabled={deleting} className="btn-secondary">Huỷ</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? "Đang xoá..." : "Xoá nhận xét"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackModal({ item, studentName, onClose, onSave }: {
  item: any; studentName: string; onClose: () => void; onSave: (d: any) => void;
}) {
  const isReview = !!item?.id; // có item = chấm bài đã có; không = tạo mới
  const [form, setForm] = useState<any>(
    item || { title: "", studentWork: "", teacherComment: "", score: "" }
  );
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  async function handleSubmit() {
    if (!isReview && !form.title?.trim()) { alert("Vui lòng nhập tiêu đề"); return; }
    setSaving(true);
    await onSave({
      ...form,
      score: form.score === "" || form.score == null ? null : Number(form.score),
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-royal">
            {isReview ? "Chấm bài / Sửa nhận xét" : `Tạo nhận xét cho ${studentName}`}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-royal"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          {/* Tiêu đề — chỉ khi tạo mới */}
          {!isReview && (
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Tiêu đề <span className="text-red-500">*</span></label>
              <input type="text" value={form.title || ""} onChange={(e) => set("title", e.target.value)}
                placeholder="VD: Nhận xét Writing Task 2 tuần 3" className="input-field" />
            </div>
          )}

          {isReview && (
            <div className="rounded-lg bg-cream p-3">
              <p className="text-xs font-bold text-muted">Bài: <span className="text-royal">{item.title}</span></p>
            </div>
          )}

          {/* Bài làm — hiển thị nếu HV đã nộp (review) hoặc cho GV nhập (tạo mới) */}
          {isReview && item.studentWork ? (
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Bài làm của HV</label>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-silver/20 bg-cream p-3 text-sm whitespace-pre-wrap text-[#1a1a2e]">{item.studentWork}</div>
            </div>
          ) : !isReview ? (
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Nội dung bài (tuỳ chọn)</label>
              <textarea value={form.studentWork || ""} onChange={(e) => set("studentWork", e.target.value)} rows={3}
                placeholder="Dán bài làm của HV vào đây (nếu có)" className="input-field resize-y" />
            </div>
          ) : null}

          {/* Nhận xét */}
          <div>
            <label className="mb-1 block text-xs font-bold text-muted">Nhận xét của giáo viên</label>
            <textarea value={form.teacherComment || ""} onChange={(e) => set("teacherComment", e.target.value)} rows={5}
              placeholder="Nhận xét chi tiết: điểm mạnh, điểm cần cải thiện, gợi ý..." className="input-field resize-y" />
          </div>

          {/* Điểm */}
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-bold text-muted"><Award size={12} />Điểm (0-10, tuỳ chọn)</label>
            <input type="number" min="0" max="10" step="0.5" value={form.score ?? ""} onChange={(e) => set("score", e.target.value)}
              placeholder="VD: 7.5" className="input-field" />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Huỷ</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isReview ? "Lưu nhận xét" : "Tạo & gửi HV"}
          </button>
        </div>
      </div>
    </div>
  );
}
