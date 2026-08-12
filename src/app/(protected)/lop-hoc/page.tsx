// FILE: src/app/(protected)/lop-hoc/page.tsx — Nội dung lớp học (3 tab)
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Trash2, Save, Loader2, X, BookOpen, FileText, PenTool, ImagePlus, Eye } from "lucide-react";import { Plus, Trash2, Save, Loader2, X, BookOpen, FileText, PenTool, ImagePlus } from "lucide-react";
import { api } from "@/lib/api";
import { useLevels } from "@/lib/useLevels";
import HtmlPasteBox from "@/components/HtmlPasteBox";
import HtmlFrame from "@/components/HtmlFrame";
type Section = "diary" | "materials" | "feedback";
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_BASE = (API_URL || "").replace(/\/api\/?$/, "");
function getToken() { return localStorage.getItem("accessToken") || ""; }
// ─── Nội dung dạng ẢNH: lưu trong contentHtml, có dấu nhận biết để mở lại đúng chế độ ───
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
// Upload 1 ảnh → trả URL tuyệt đối (cần tuyệt đối để hiện được trong iframe)
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
// Parse bảng điểm dán từ Excel/Sheets: mỗi dòng 1 HS, cột tách bằng tab
function parseScoreTable(text: string): { name: string; vocab: string; attitude: string; score: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cols = line.split("\t");
      return {
        name: (cols[0] || "").trim(),
        vocab: (cols[1] || "").trim(),
        attitude: (cols[2] || "").trim(),
        score: (cols[3] || "").trim(),
      };
    })
    .filter((r) => r.name); // bỏ dòng không có tên
}
export default function ClassContentPage() {
  const COURSES = useLevels();
  const [section, setSection] = useState<Section>("diary");
  const [course, setCourse] = useState("7+");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const loadData = useCallback(async () => {
    setLoading(true);
    let path = "";
    if (section === "diary") path = `/class/diaries?course=${encodeURIComponent(course)}&limit=200`;
    else if (section === "materials") path = `/class/materials?course=${encodeURIComponent(course)}&limit=200`;
    else path = `/class/feedback`;
    const json = await api.get(path);
    setData(json.data || []);
    setLoading(false);
  }, [section, course]);
  useEffect(() => { loadData(); }, [loadData]);
  async function handleSave(formData: any) {
    let url = "", method: "post" | "put" = "post";
    if (section === "diary") {
      url = editItem?.id ? `/class/diaries/${editItem.id}` : `/class/diaries`;
      method = editItem?.id ? "put" : "post";
      if (!editItem?.id) formData.course = course;
    } else if (section === "materials") {
      url = editItem?.id ? `/class/materials/${editItem.id}` : `/class/materials`;
      method = editItem?.id ? "put" : "post";
      if (!editItem?.id) formData.course = course;
    } else if (section === "feedback" && editItem?.id) {
      url = `/class/feedback/${editItem.id}/review`;
      method = "put";
    }
    const json = await (method === "put" ? api.put(url, formData) : api.post(url, formData));
    if (!json.success) { alert(json.message || "Lỗi lưu"); return; }
    setShowModal(false);
    setEditItem(null);
    loadData();
  }
  async function handleDelete(id: string) {
    if (!confirm("Xác nhận xoá?")) return;
    const url = section === "diary" ? `/class/diaries/${id}` : `/class/materials/${id}`;
    await api.delete(url);
    loadData();
  }
  return (
    <div className="mx-auto max-w-[1100px]">
      <h2 className="mb-1 font-display text-2xl font-bold text-royal">Quản Lý Nội Dung Lớp</h2>
      <p className="mb-6 text-sm text-muted">Nhật ký buổi học · Tài liệu · Chấm bài / phản hồi</p>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-silver/30 bg-white p-1">
          {([
            { id: "diary" as Section, label: "📖 Nhật ký" },
            { id: "materials" as Section, label: "📁 Tài liệu" },
            { id: "feedback" as Section, label: "📝 Chấm bài" },
          ]).map((s) => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${section === s.id ? "bg-royal text-white" : "text-muted hover:bg-cream-dark"}`}>
              {s.label}
            </button>
          ))}
        </div>
        {section !== "feedback" && (
          <select value={course} onChange={(e) => setCourse(e.target.value)}
            className="rounded-lg border border-silver/40 bg-white px-4 py-2 text-sm outline-none focus:border-gold">
            {COURSES.map((c) => <option key={c} value={c}>Khoá {c}</option>)}
          </select>
        )}
        {section !== "feedback" && (
          <button onClick={() => { setEditItem(null); setShowModal(true); }} className="btn-primary ml-auto">
            <Plus size={16} />{section === "diary" ? "Thêm buổi học" : "Thêm tài liệu"}
          </button>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-silver/30 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">Chưa có dữ liệu.</div>
        ) : section === "diary" ? (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">Buổi</th>
              <th className="px-4 py-3 font-semibold text-royal">Ngày</th>
              <th className="px-4 py-3 font-semibold text-royal">Nội dung</th>
              <th className="px-4 py-3 font-semibold text-royal">BTVN</th>
              <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
            </tr></thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-4 py-3 font-bold text-royal">{d.session}</td>
                  <td className="px-4 py-3 text-muted">{new Date(d.date).toLocaleDateString("vi-VN")}</td>
                  <td className="max-w-[300px] px-4 py-3"><p className="line-clamp-2 text-[#1a1a2e]">{d.topic}</p></td>
                  <td className="max-w-[200px] px-4 py-3 text-muted"><p className="line-clamp-1">{d.homework || "—"}</p></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setPreviewItem(d)} title="Xem như học viên" className="mr-1 rounded p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Eye size={14} /></button><button onClick={() => { setEditItem(d); setShowModal(true); }} className="mr-1 rounded p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><PenTool size={14} /></button>
                    <button onClick={() => handleDelete(d.id)} className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : section === "materials" ? (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">#</th>
              <th className="px-4 py-3 font-semibold text-royal">Tên tài liệu</th>
              <th className="px-4 py-3 font-semibold text-royal">Loại</th>
              <th className="px-4 py-3 font-semibold text-royal">Link</th>
              <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
            </tr></thead>
            <tbody>
              {data.map((m: any, i: number) => (
                <tr key={m.id} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-4 py-3 text-muted">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a2e]">{m.title}</td>
                  <td className="px-4 py-3"><span className="rounded bg-cream px-2 py-0.5 text-xs text-muted">{m.fileType || "FILE"}</span></td>
                  <td className="px-4 py-3">{isImageHtml(m.contentHtml)
                    ? <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Ảnh</span>
                    : m.contentHtml
                    ? <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">Bài HTML</span>
                    : <a href={m.fileUrl} target="_blank" className="text-xs text-gold underline">Mở link</a>}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditItem(m); setShowModal(true); }} className="mr-1 rounded p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><PenTool size={14} /></button>
                    <button onClick={() => handleDelete(m.id)} className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">Học viên</th>
              <th className="px-4 py-3 font-semibold text-royal">Bài</th>
              <th className="px-4 py-3 font-semibold text-royal">Trạng thái</th>
              <th className="px-4 py-3 font-semibold text-royal">Điểm</th>
              <th className="px-4 py-3 font-semibold text-royal">Ngày nộp</th>
              <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
            </tr></thead>
            <tbody>
              {data.map((fb: any) => (
                <tr key={fb.id} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1a1a2e]">{fb.student?.fullName}</p>
                    <p className="text-xs text-muted">{fb.student?.studentCode}</p>
                  </td>
                  <td className="px-4 py-3 text-[#1a1a2e]">{fb.title}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${fb.status === "REVIEWED" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {fb.status === "REVIEWED" ? "Đã chấm" : "Chờ chấm"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-royal">{fb.score ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted">{new Date(fb.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditItem(fb); setShowModal(true); }} className="btn-primary text-xs">
                      {fb.status === "REVIEWED" ? "Sửa" : "Chấm bài"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showModal && (
        <Modal section={section} item={editItem} onClose={() => { setShowModal(false); setEditItem(null); }} onSave={handleSave} />
      )}
      {/* 2b: xem như HS */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 px-4 py-8" onClick={() => setPreviewItem(null)}>
          <div className="flex max-h-full w-full max-w-[760px] flex-col rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex shrink-0 items-center justify-between border-b border-silver/20 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-royal px-2.5 py-0.5 text-xs font-bold text-white">Buổi {previewItem.session}</span>
                <span className="text-xs text-muted">{new Date(previewItem.date).toLocaleDateString("vi-VN")}</span>
                <span className="rounded bg-cream-dark px-2 py-0.5 text-[0.65rem] text-muted">Xem như học viên</span>
              </div>
              <button onClick={() => setPreviewItem(null)} className="text-muted hover:text-royal"><X size={20} /></button>
            </div>
            <div className="overflow-auto p-5">
              {previewItem.contentHtml
                ? <div className="overflow-hidden rounded-lg border border-silver/20"><HtmlFrame html={previewItem.contentHtml} /></div>
                : <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1a1a2e]">{previewItem.topic}</p>}
              {previewItem.homework && (
                <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-amber-700">BTVN</p>
                  <p className="text-xs text-amber-900">{previewItem.homework}</p>
                </div>
              )}
              {previewItem.teacherNote && (
                <div className="mt-2 rounded-lg bg-cream/60 px-3 py-2 text-xs italic text-muted">💬 {previewItem.teacherNote}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Ô up ảnh (dùng chung cho cả 3 tab) ───
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
          <img src={url} alt="" className="max-h-64 rounded-lg border border-silver/30 bg-white object-contain p-1" />
          <button type="button" onClick={() => onChange("")}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"><X size={13} /></button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-silver/40 bg-cream py-8 text-sm font-semibold text-muted hover:border-gold/50 hover:text-royal disabled:opacity-50">
          {uploading ? <><Loader2 size={18} className="animate-spin" />Đang tải ảnh...</> : <><ImagePlus size={20} />Chọn ảnh từ máy</>}
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick} />
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
      {hint && <p className="mt-1 text-[0.7rem] text-muted">{hint}</p>}
    </div>
  );
}
function Modal({ section, item, onClose, onSave }: { section: Section; item: any; onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState<any>(item || {});
  const [saving, setSaving] = useState(false);
  const [diaryMode, setDiaryMode] = useState<"form" | "html" | "image">(isImageHtml(item?.contentHtml) ? "image" : item?.contentHtml ? "html" : "form");
  const [matMode, setMatMode] = useState<"link" | "html" | "image">(isImageHtml(item?.contentHtml) ? "image" : item?.contentHtml ? "html" : "link");
  const [fbMode, setFbMode] = useState<"form" | "html" | "image">(isImageHtml(item?.commentHtml) ? "image" : item?.commentHtml ? "html" : "form");
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  async function handleSubmit() {
    // Xoá hẳn field của mode không dùng (giống trang báo cáo) — tránh 2 nội dung cùng tồn tại
    const payload: any = { ...form };
    if (section === "materials") {
      if (matMode === "html" || matMode === "image") {
        if (!String(payload.contentHtml || "").trim()) {
          return alert(matMode === "image" ? "Chưa chọn ảnh tài liệu" : "Chưa dán mã HTML của tài liệu");
        }
        payload.fileUrl = "";
        payload.fileType = matMode === "image" ? "IMAGE" : "HTML";
      } else {
        if (!String(payload.fileUrl || "").trim()) return alert("Chưa nhập link tài liệu");
        payload.contentHtml = null;
      }
    } else if (section === "diary") {
      if (diaryMode === "form") payload.contentHtml = null;
      else if (!String(payload.contentHtml || "").trim()) {
        return alert(diaryMode === "image" ? "Chưa chọn ảnh nội dung buổi học" : "Chưa dán mã HTML nội dung buổi học");
      }
    } else if (section === "feedback") {
      if (fbMode === "html" || fbMode === "image") {
        payload.teacherComment = "";
      } else {
        payload.commentHtml = null;
      }
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
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-royal">
            {section === "diary" ? (item ? "Sửa buổi học" : "Thêm buổi học") :
             section === "materials" ? (item ? "Sửa tài liệu" : "Thêm tài liệu") :
             "Chấm bài / Phản hồi"}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-royal"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          {section === "diary" && (<>
            <div className="flex flex-wrap gap-2">
              <ModeBtn active={diaryMode === "form"} onClick={() => setDiaryMode("form")} label="Nhập thường" />
              <ModeBtn active={diaryMode === "html"} onClick={() => setDiaryMode("html")} label="Dán HTML" />
              <ModeBtn active={diaryMode === "image"} onClick={() => setDiaryMode("image")} label="Up ảnh" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Buổi số</label>
                <input type="number" value={form.session || ""} onChange={(e) => set("session", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Ngày</label>
                <input type="date" value={form.date?.slice?.(0, 10) || ""} onChange={(e) => set("date", e.target.value)} className="input-field" />
              </div>
            </div>
            {diaryMode === "form" ? (<>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Nội dung buổi học</label>
                <textarea value={form.topic || ""} onChange={(e) => set("topic", e.target.value)} rows={3} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">BTVN</label>
                <textarea value={form.homework || ""} onChange={(e) => set("homework", e.target.value)} rows={2} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted">Thời lượng</label>
                  <input type="text" value={form.duration || ""} onChange={(e) => set("duration", e.target.value)} placeholder="2.5h" className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted">Ghi chú GV</label>
                  <input type="text" value={form.teacherNote || ""} onChange={(e) => set("teacherNote", e.target.value)} className="input-field" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Bảng điểm học sinh (chỉ GV xem — không hiện cho học viên)</label>
                <textarea
                  rows={4}
                  placeholder="Dán từ Excel: mỗi dòng 1 HS, các cột Tên — Từ vựng — Ý thức & ghi bài — Điểm (cách nhau bằng tab)"
                  onChange={(e) => set("scoreTable", parseScoreTable(e.target.value))}
                  className="input-field font-mono text-xs" />
                <p className="mt-1 text-[0.7rem] text-muted">Copy vùng 4 cột từ Excel/Google Sheets rồi dán vào đây. Xem trước ở dưới.</p>
                {Array.isArray(form.scoreTable) && form.scoreTable.length > 0 && (
                  <div className="mt-2 overflow-x-auto rounded-lg border border-silver/20">
                    <table className="w-full text-left text-xs">
                      <thead><tr className="border-b bg-cream">
                        <th className="px-2 py-1.5 font-semibold text-royal">Tên HS</th>
                        <th className="px-2 py-1.5 font-semibold text-royal">Từ vựng</th>
                        <th className="px-2 py-1.5 font-semibold text-royal">Ý thức & ghi bài</th>
                        <th className="px-2 py-1.5 font-semibold text-royal">Điểm</th>
                      </tr></thead>
                      <tbody>
                        {form.scoreTable.map((r: any, i: number) => (
                          <tr key={i} className="border-b border-silver/10">
                            <td className="px-2 py-1 font-medium text-[#1a1a2e]">{r.name}</td>
                            <td className="px-2 py-1 text-muted">{r.vocab}</td>
                            <td className="px-2 py-1 text-muted">{r.attitude}</td>
                            <td className="px-2 py-1 font-bold text-royal">{r.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="px-2 py-1 text-[0.7rem] text-muted">{form.scoreTable.length} học sinh</p>
                  </div>
                )}
              </div>
            </>) : diaryMode === "html" ? (
              <HtmlPasteBox
                label="Mã HTML nội dung buổi học"
                value={form.contentHtml || ""}
                onChange={(v) => set("contentHtml", v)}
                hint="Dán cả trang HTML (kể cả <!doctype>, <style>) cũng được — học viên thấy đúng giao diện này. Vẫn nên điền Buổi số + Ngày ở trên."
              />
            ) : (
              <ImageUploadBox
                label="Ảnh nội dung buổi học"
                value={form.contentHtml || ""}
                onChange={(v) => set("contentHtml", v)}
                hint="Học viên mở buổi học sẽ thấy đúng ảnh này. Vẫn nên điền Buổi số + Ngày ở trên."
              />
            )}
          </>)}
          {section === "materials" && (<>
            <div className="flex flex-wrap gap-2">
              <ModeBtn active={matMode === "link"} onClick={() => setMatMode("link")} label="Link / File" />
              <ModeBtn active={matMode === "html"} onClick={() => setMatMode("html")} label="Dán HTML" />
              <ModeBtn active={matMode === "image"} onClick={() => setMatMode("image")} label="Up ảnh" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Tên tài liệu</label>
              <input type="text" value={form.title || ""} onChange={(e) => set("title", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Mô tả</label>
              <input type="text" value={form.description || ""} onChange={(e) => set("description", e.target.value)} className="input-field" />
            </div>
            {matMode === "link" ? (<>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Link / URL</label>
                <input type="url" value={form.fileUrl || ""} onChange={(e) => set("fileUrl", e.target.value)} placeholder="https://padlet.com/..." className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Loại</label>
                <select value={form.fileType || ""} onChange={(e) => set("fileType", e.target.value)} className="input-field">
                  <option value="">— Chọn —</option>
                  <option value="LINK">Link</option>
                  <option value="PDF">PDF</option>
                  <option value="VIDEO">Video</option>
                  <option value="SLIDE">Slide</option>
                  <option value="DOC">Word</option>
                </select>
              </div>
            </>) : matMode === "html" ? (
              <HtmlPasteBox
                label="Mã HTML nội dung tài liệu"
                value={form.contentHtml || ""}
                onChange={(v) => set("contentHtml", v)}
                hint="Học viên bấm vào tài liệu sẽ đọc HTML này ngay tại chỗ, không mở link ra ngoài."
              />
            ) : (
              <ImageUploadBox
                label="Ảnh tài liệu"
                value={form.contentHtml || ""}
                onChange={(v) => set("contentHtml", v)}
                hint="Học viên bấm vào tài liệu sẽ xem ảnh này ngay tại chỗ. Chỉ học viên lớp này xem được."
              />
            )}
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Thứ tự</label>
              <input type="number" value={form.orderIndex || 0} onChange={(e) => set("orderIndex", parseInt(e.target.value))} className="input-field" />
            </div>
          </>)}
          {section === "feedback" && (<>
            <div className="rounded-lg bg-cream p-3">
              <p className="text-xs font-bold text-muted">Học viên: <span className="text-royal">{item?.student?.fullName} ({item?.student?.studentCode})</span></p>
              <p className="text-xs font-bold text-muted">Bài: <span className="text-royal">{item?.title}</span></p>
            </div>
            {item?.studentWork && (
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Bài làm</label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-silver/20 bg-cream p-3 text-sm text-[#1a1a2e] whitespace-pre-wrap">{item.studentWork}</div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <ModeBtn active={fbMode === "form"} onClick={() => setFbMode("form")} label="Nhập thường" />
              <ModeBtn active={fbMode === "html"} onClick={() => setFbMode("html")} label="Dán HTML" />
              <ModeBtn active={fbMode === "image"} onClick={() => setFbMode("image")} label="Up ảnh" />
            </div>
            {fbMode === "form" ? (
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Nhận xét / Phản hồi</label>
                <textarea value={form.teacherComment || ""} onChange={(e) => set("teacherComment", e.target.value)} rows={4} className="input-field" />
              </div>
            ) : fbMode === "html" ? (
              <HtmlPasteBox
                label="Mã HTML nhận xét"
                value={form.commentHtml || ""}
                onChange={(v) => set("commentHtml", v)}
                hint="Chỉ học viên này xem được nhận xét của mình."
              />
            ) : (
              <ImageUploadBox
                label="Ảnh nhận xét"
                value={form.commentHtml || ""}
                onChange={(v) => set("commentHtml", v)}
                hint="Chỉ học viên này xem được ảnh nhận xét của mình."
              />
            )}
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Điểm (0-10)</label>
              <input type="number" min="0" max="10" step="0.5" value={form.score ?? ""} onChange={(e) => set("score", parseFloat(e.target.value))} className="input-field" />
            </div>
          </>)}
        </div>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Huỷ</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Lưu
          </button>
        </div>
      </div>
    </div>
  );
}