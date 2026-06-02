// FILE: src/app/(protected)/lich-hoc/page.tsx — Lịch học cả năm
"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Loader2, X, PenTool } from "lucide-react";
import { api } from "@/lib/api";

const COURSES = ["5+", "6+", "7+", "1-1", "Intensive", "Writing", "Phát Âm", "Chuyên Cấp 3"];
const STATUS_OPTIONS = [
  { value: "UPCOMING", label: "Sắp khai giảng", color: "bg-blue-50 text-blue-700" },
  { value: "ONGOING", label: "Đang học", color: "bg-green-50 text-green-700" },
  { value: "COMPLETED", label: "Đã kết thúc", color: "bg-gray-100 text-gray-500" },
  { value: "CANCELLED", label: "Đã huỷ", color: "bg-red-50 text-red-600" },
];

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ course: "", status: "", year: String(new Date().getFullYear()) });
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.course) params.set("course", filter.course);
    if (filter.status) params.set("status", filter.status);
    if (filter.year) params.set("year", filter.year);
    const json = await api.get(`/schedule?${params}`);
    setSchedules(json.data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSave(formData: any) {
    const url = editItem?.id ? `/schedule/${editItem.id}` : "/schedule";
    const json = await (editItem?.id ? api.put(url, formData) : api.post(url, formData));
    if (!json.success) { alert(json.message || "Lỗi lưu"); return; }
    setShowModal(false);
    setEditItem(null);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xác nhận xoá lịch học này?")) return;
    await api.delete(`/schedule/${id}`);
    loadData();
  }

  function getStatusBadge(status: string) {
    const s = STATUS_OPTIONS.find((o) => o.value === status);
    if (!s) return null;
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.color}`}>{s.label}</span>;
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">📅 Lịch Học Cả Năm</h2>
          <p className="mt-1 text-sm text-muted">{schedules.length} lớp trong năm {filter.year}</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} />Thêm lớp mới
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select value={filter.year} onChange={(e) => setFilter({ ...filter, year: e.target.value })}
          className="rounded-lg border border-silver/40 bg-white px-4 py-2 text-sm outline-none focus:border-gold">
          {[2025, 2026, 2027, 2028].map((y) => <option key={y} value={y}>Năm {y}</option>)}
        </select>
        <select value={filter.course} onChange={(e) => setFilter({ ...filter, course: e.target.value })}
          className="rounded-lg border border-silver/40 bg-white px-4 py-2 text-sm outline-none focus:border-gold">
          <option value="">Tất cả khoá</option>
          {COURSES.map((c) => <option key={c} value={c}>Khoá {c}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="rounded-lg border border-silver/40 bg-white px-4 py-2 text-sm outline-none focus:border-gold">
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-silver/30 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
        ) : schedules.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">Chưa có lịch học nào.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">Lớp</th>
              <th className="px-4 py-3 font-semibold text-royal">Khoá</th>
              <th className="px-4 py-3 font-semibold text-royal">Bắt đầu</th>
              <th className="px-4 py-3 font-semibold text-royal">Kết thúc</th>
              <th className="px-4 py-3 font-semibold text-royal">Lịch học</th>
              <th className="px-4 py-3 font-semibold text-royal">GV</th>
              <th className="px-4 py-3 font-semibold text-royal">Sĩ số</th>
              <th className="px-4 py-3 font-semibold text-royal">Trạng thái</th>
              <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
            </tr></thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-4 py-3 font-medium text-[#1a1a2e]">{s.className}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-royal/8 px-2 py-0.5 text-xs font-semibold text-royal">{s.course}</span></td>
                  <td className="px-4 py-3 text-muted">{new Date(s.startDate).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-muted">{new Date(s.endDate).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-xs text-muted">{s.schedule}</td>
                  <td className="px-4 py-3 text-muted">{s.teacher || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={s.currentStudents >= s.maxStudents ? "font-bold text-red-600" : "text-muted"}>
                      {s.currentStudents}/{s.maxStudents}
                    </span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(s.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditItem(s); setShowModal(true); }} className="mr-1 rounded p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><PenTool size={14} /></button>
                    <button onClick={() => handleDelete(s.id)} className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <ScheduleModal item={editItem} onClose={() => { setShowModal(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}

function ScheduleModal({ item, onClose, onSave }: { item: any; onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState<any>(item || { maxStudents: 15, status: "UPCOMING" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  async function handleSubmit() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-royal">{item ? "Sửa lịch học" : "Thêm lớp mới"}</h3>
          <button onClick={onClose} className="text-muted hover:text-royal"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-muted">Tên lớp</label>
            <input type="text" value={form.className || ""} onChange={(e) => set("className", e.target.value)} placeholder="VD: 7+ 12/2025 - 01/2026" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Khoá học</label>
              <select value={form.course || ""} onChange={(e) => set("course", e.target.value)} className="input-field">
                <option value="">— Chọn —</option>
                {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Giáo viên</label>
              <input type="text" value={form.teacher || ""} onChange={(e) => set("teacher", e.target.value)} placeholder="Ms. Ly Le" className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Khai giảng</label>
              <input type="date" value={form.startDate?.slice?.(0, 10) || ""} onChange={(e) => set("startDate", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Kết thúc</label>
              <input type="date" value={form.endDate?.slice?.(0, 10) || ""} onChange={(e) => set("endDate", e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted">Lịch học</label>
            <input type="text" value={form.schedule || ""} onChange={(e) => set("schedule", e.target.value)} placeholder="T2,4,6 19:30-21:30" className="input-field" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Phòng</label>
              <input type="text" value={form.room || ""} onChange={(e) => set("room", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Sĩ số tối đa</label>
              <input type="number" value={form.maxStudents || 15} onChange={(e) => set("maxStudents", parseInt(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">Trạng thái</label>
              <select value={form.status || "UPCOMING"} onChange={(e) => set("status", e.target.value)} className="input-field">
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted">Ghi chú</label>
            <textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={2} className="input-field resize-none" />
          </div>
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
