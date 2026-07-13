// FILE: src/app/(protected)/lop-hoc-moi/page.tsx — Quản lý lớp học (GĐ1)
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Loader2, Pencil, Trash2, Users, X, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useLevels } from "@/lib/useLevels";
interface ClassRow {
  id: string; name: string; classCode: string | null; course: string | null;
  teacher: string | null; schedule: string | null; status: string;
  _count?: { enrollments: number };
}
export default function ClassListPage() {
  const LEVELS = useLevels();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCourse) params.set("course", filterCourse);
    const data = await api.get(`/classes?${params}`);
    if (data.success) setClasses(data.data || []);
    setLoading(false);
  }, [filterCourse]);
  useEffect(() => { load(); }, [load]);
  function openCreate() {
    setEditing({ name: "", classCode: "", course: "", teacher: "", schedule: "", room: "", startDate: "", maxStudents: "", status: "ACTIVE", notes: "" });
    setFormOpen(true);
  }
  function openEdit(c: any) {
    setEditing({
      id: c.id, name: c.name || "", classCode: c.classCode || "", course: c.course || "",
      teacher: c.teacher || "", schedule: c.schedule || "", room: c.room || "",
      startDate: c.startDate ? c.startDate.slice(0, 10) : "", maxStudents: c.maxStudents ?? "",
      status: c.status || "ACTIVE", notes: c.notes || "",
    });
    setFormOpen(true);
  }
  async function save() {
    if (!editing.name.trim()) return alert("Vui lòng nhập tên lớp");
    const payload = { ...editing };
    const res = editing.id
      ? await api.put(`/classes/${editing.id}`, payload)
      : await api.post("/classes", payload);
    if (res.success) { setFormOpen(false); setEditing(null); load(); }
    else alert(res.message || "Lỗi lưu lớp");
  }
  async function remove(id: string) {
    if (!confirm("Xoá lớp này? Danh sách ghi danh của lớp cũng sẽ bị xoá (không ảnh hưởng tài khoản học viên).")) return;
    const res = await api.delete(`/classes/${id}`);
    if (res.success) load(); else alert(res.message || "Lỗi xoá");
  }
  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">🏫 Quản Lý Lớp Học</h2>
          <p className="mt-1 text-sm text-muted">{classes.length} lớp</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Tạo lớp</button>
      </div>
      <div className="mb-4">
        <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}
          className="rounded-lg border border-silver/40 bg-white px-4 py-2 text-sm outline-none focus:border-gold">
          <option value="">Tất cả trình độ</option>
          {LEVELS.map((c) => <option key={c} value={c}>Trình độ {c}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-silver/30 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
        ) : classes.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">Chưa có lớp nào. Bấm "Tạo lớp" để bắt đầu.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">Tên lớp</th>
              <th className="px-4 py-3 font-semibold text-royal">Trình độ</th>
              <th className="px-4 py-3 font-semibold text-royal">Giáo viên</th>
              <th className="px-4 py-3 font-semibold text-royal">Lịch</th>
              <th className="px-4 py-3 text-center font-semibold text-royal">Sĩ số</th>
              <th className="px-4 py-3 font-semibold text-royal">Trạng thái</th>
              <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
            </tr></thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-4 py-3 font-medium text-[#1a1a2e]">
                    {c.name}
                    {c.classCode && <div className="text-xs font-mono text-muted">{c.classCode}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {c.course && <span className="rounded-full bg-royal/8 px-2 py-0.5 text-[0.65rem] font-semibold text-royal">{c.course}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{c.teacher || "—"}</td>
                  <td className="px-4 py-3 text-muted">{c.schedule || "—"}</td>
                  <td className="px-4 py-3 text-center font-bold text-royal">{c._count?.enrollments ?? 0}</td>
                  <td className="px-4 py-3">
                    {c.status === "FINISHED" || c.status === "CLOSED"
                      ? <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">Đã kết thúc</span>
                      : c.status === "ENROLL_CLOSED"
                      ? <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">Hết hạn ĐK</span>
                      : <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700">Đang học</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/lop-hoc-moi/${c.id}`} title="Ghi danh học viên"
                        className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Users size={15} /></Link>
                      <button onClick={() => openEdit(c)} title="Sửa"
                        className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Pencil size={15} /></button>
                      <button onClick={() => remove(c.id)} title="Xoá"
                        className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Modal tạo/sửa lớp */}
      {formOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setFormOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-royal">{editing.id ? "Sửa lớp" : "Tạo lớp mới"}</h3>
              <button onClick={() => setFormOpen(false)} className="text-muted hover:text-royal"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Tên lớp *</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="7+ Tối 246 - KG tháng 3" className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Mã lớp</label>
                <input value={editing.classCode} onChange={(e) => setEditing({ ...editing, classCode: e.target.value })}
                  placeholder="7P-T246-03" className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Trình độ</label>
                <select value={editing.course} onChange={(e) => setEditing({ ...editing, course: e.target.value })} className="input-field">
                  <option value="">— Chọn —</option>
                  {LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Giáo viên</label>
                <input value={editing.teacher} onChange={(e) => setEditing({ ...editing, teacher: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Phòng</label>
                <input value={editing.room} onChange={(e) => setEditing({ ...editing, room: e.target.value })} className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Lịch học</label>
                <input value={editing.schedule} onChange={(e) => setEditing({ ...editing, schedule: e.target.value })}
                  placeholder="Tối T2-4-6, 19:30-21:00" className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Ngày khai giảng</label>
                <input type="date" value={editing.startDate} onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Sĩ số tối đa</label>
                <input type="number" value={editing.maxStudents} onChange={(e) => setEditing({ ...editing, maxStudents: e.target.value })}
                  placeholder="15" className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Trạng thái</label>
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="input-field">
                  <option value="ACTIVE">Đang học</option>
                  <option value="ENROLL_CLOSED">Hết hạn đăng ký</option>
                  <option value="FINISHED">Đã kết thúc</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Ghi chú</label>
                <textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={2} className="input-field resize-none" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setFormOpen(false)} className="btn-secondary">Huỷ</button>
              <button onClick={save} className="btn-primary"><Save size={14} />Lưu lớp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}