// FILE: src/app/(protected)/lop-hoc/page.tsx — Nội dung lớp học (3 tab)
"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Loader2, X, BookOpen, FileText, PenTool } from "lucide-react";
import { api } from "@/lib/api";

const COURSES = ["5+", "6+", "7+", "1-1", "Intensive", "Writing", "Chuyên Cấp 3"];
type Section = "diary" | "materials" | "feedback";

export default function ClassContentPage() {
  const [section, setSection] = useState<Section>("diary");
  const [course, setCourse] = useState("7+");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

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
                    <button onClick={() => { setEditItem(d); setShowModal(true); }} className="mr-1 rounded p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><PenTool size={14} /></button>
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
                  <td className="px-4 py-3"><a href={m.fileUrl} target="_blank" className="text-xs text-gold underline">Mở link</a></td>
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
    </div>
  );
}

function Modal({ section, item, onClose, onSave }: { section: Section; item: any; onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState<any>(item || {});
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  async function handleSubmit() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
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
          </>)}

          {section === "materials" && (<>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Tên tài liệu</label>
              <input type="text" value={form.title || ""} onChange={(e) => set("title", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Mô tả</label>
              <input type="text" value={form.description || ""} onChange={(e) => set("description", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Link / URL</label>
              <input type="url" value={form.fileUrl || ""} onChange={(e) => set("fileUrl", e.target.value)} placeholder="https://padlet.com/..." className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Thứ tự</label>
                <input type="number" value={form.orderIndex || 0} onChange={(e) => set("orderIndex", parseInt(e.target.value))} className="input-field" />
              </div>
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
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Nhận xét / Phản hồi</label>
              <textarea value={form.teacherComment || ""} onChange={(e) => set("teacherComment", e.target.value)} rows={4} className="input-field" />
            </div>
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
