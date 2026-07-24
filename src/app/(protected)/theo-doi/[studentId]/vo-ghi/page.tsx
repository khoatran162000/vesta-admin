// FILE: src/app/(protected)/theo-doi/[studentId]/vo-ghi/page.tsx
// Admin/GV xem toàn bộ vở ghi của 1 HV + tạo nhận xét mới + chấm bài
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Plus, MessageSquareText, Clock, CheckCircle2,
  X, Save, Award, Trash2, ImagePlus,
} from "lucide-react";
import { api } from "@/lib/api";
import HtmlPasteBox from "@/components/HtmlPasteBox";
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_BASE = (API_URL || "").replace(/\/api\/?$/, "");
function getToken() { return localStorage.getItem("accessToken") || ""; }
// ─── Nhận xét dạng ẢNH: lưu trong commentHtml, có dấu nhận biết để mở lại đúng chế độ ───
const IMG_MARK = "<!--vesta-image-->";
function buildImageHtml(url: string): string {
  return `${IMG_MARK}<div style="margin:0;padding:0;text-align:center;background:#fff"><img src="${url}" alt="" style="max-width:100%;height:auto;display:block;margin:0 auto" /></div>`;
}
function extractImageUrl(html?: string | null): string {
  if (!html || !String(html).startsWith(IMG_MARK)) return "";
  const m = String(html).match(/<img src="([^"]+)"/);
  return m ? m[1] : "";
}
function isImageHtml(html?: string | null): boolean {
  return !!html && String(html).startsWith(IMG_MARK);
}
async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${API_URL}/reports/upload-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  const j = await res.json();
  if (!j.success) throw new Error(j.message || "Lỗi upload ảnh");
  return `${API_BASE}${j.data.url}`;
}
// Xem nhanh nội dung HTML trong danh sách (iframe cách ly, không phá style trang admin)
function HtmlPreview({ html }: { html: string }) {
  return (
    <iframe
      title="Nhận xét"
      srcDoc={html}
      sandbox="allow-same-origin"
      className="w-full rounded-lg border border-silver/20 bg-white"
      style={{ minHeight: 220 }}
    />
  );
}
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
        commentHtml: form.commentHtml,
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
        commentHtml: form.commentHtml,
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
              {/* Nhận xét: HTML/ảnh (nếu có) hoặc text thường */}
              {fb.commentHtml ? (
                <div className="rounded-lg border border-gold/30 bg-gold/5 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-gold">
                    <MessageSquareText size={12} />Nhận xét của GV
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[0.6rem] font-semibold text-blue-700">
                      {isImageHtml(fb.commentHtml) ? "Ảnh" : "HTML"}
                    </span>
                  </p>
                  <HtmlPreview html={fb.commentHtml} />
                </div>
              ) : fb.teacherComment ? (
                <div className="rounded-lg border border-gold/30 bg-gold/5 p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-gold">
                    <MessageSquareText size={12} />Nhận xét của GV
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-[#1a1a2e]">{fb.teacherComment}</p>
                </div>
              ) : null}
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
// ─── Ô up ảnh (dùng cho nhận xét dạng ảnh) ───
function ImageUploadBox({ label, value, onChange, hint }: { label: string; value: string; onChange: (html: string) => void; hint?: string }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const url = extractImageUrl(value);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setUploading(true); setErr("");
    try {
      const u = await uploadImage(f);
      onChange(buildImageHtml(u));
    } catch (ex: any) {
      setErr(ex.message || "Lỗi upload ảnh");
    } finally {
      setUploading(false);
    }
  }
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-muted">{label}</label>
      {url ? (
        <div className="relative inline-block">
          <img src={url} alt="" className="max-h-56 rounded-lg border border-silver/30 bg-white object-contain p-1" />
          <button type="button" onClick={() => onChange("")}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"><X size={13} /></button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-silver/40 bg-cream py-7 text-sm font-semibold text-muted hover:border-gold/50 hover:text-royal disabled:opacity-50">
          {uploading ? <><Loader2 size={18} className="animate-spin" />Đang tải ảnh...</> : <><ImagePlus size={20} />Chọn ảnh từ máy</>}
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick} />
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
      {hint && <p className="mt-1 text-[0.7rem] text-muted">{hint}</p>}
    </div>
  );
}
function FeedbackModal({ item, studentName, onClose, onSave }: {
  item: any; studentName: string; onClose: () => void; onSave: (d: any) => void;
}) {
  const isReview = !!item?.id; // có item = chấm bài đã có; không = tạo mới
  const [form, setForm] = useState<any>(
    item || { title: "", studentWork: "", teacherComment: "", commentHtml: "", score: "" }
  );
  const [mode, setMode] = useState<"form" | "html" | "image">(
    isImageHtml(item?.commentHtml) ? "image" : item?.commentHtml ? "html" : "form"
  );
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  async function handleSubmit() {
    if (!isReview && !form.title?.trim()) { alert("Vui lòng nhập tiêu đề"); return; }
    // Chỉ giữ nội dung của chế độ đang dùng — tránh 2 kiểu nhận xét cùng tồn tại
    const payload: any = {
      ...form,
      score: form.score === "" || form.score == null ? null : Number(form.score),
    };
    if (mode === "form") {
      payload.commentHtml = null;
    } else {
      if (!String(payload.commentHtml || "").trim()) {
        alert(mode === "image" ? "Chưa chọn ảnh nhận xét" : "Chưa dán mã HTML nhận xét");
        return;
      }
      payload.teacherComment = "";
    }
    setSaving(true);
    await onSave(payload);
    setSaving(false);
  }
  const ModeBtn = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
    <button type="button" onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${active ? "border-royal bg-royal text-white" : "border-silver/40 text-muted"}`}>{label}</button>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
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
          {/* Nhận xét — 3 chế độ */}
          <div className="flex flex-wrap gap-2">
            <ModeBtn active={mode === "form"} onClick={() => setMode("form")} label="Nhập thường" />
            <ModeBtn active={mode === "html"} onClick={() => setMode("html")} label="Dán HTML" />
            <ModeBtn active={mode === "image"} onClick={() => setMode("image")} label="Up ảnh" />
          </div>
          {mode === "form" ? (
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Nhận xét của giáo viên</label>
              <textarea value={form.teacherComment || ""} onChange={(e) => set("teacherComment", e.target.value)} rows={5}
                placeholder="Nhận xét chi tiết: điểm mạnh, điểm cần cải thiện, gợi ý..." className="input-field resize-y" />
            </div>
          ) : mode === "html" ? (
            <HtmlPasteBox
              label="Mã HTML nhận xét"
              value={form.commentHtml || ""}
              onChange={(v) => set("commentHtml", v)}
              hint="Dán cả trang HTML (kể cả <style>) cũng được — học viên thấy đúng giao diện này. Chỉ học viên này xem được."
            />
          ) : (
            <ImageUploadBox
              label="Ảnh nhận xét"
              value={form.commentHtml || ""}
              onChange={(v) => set("commentHtml", v)}
              hint="Chỉ học viên này xem được ảnh nhận xét của mình."
            />
          )}
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