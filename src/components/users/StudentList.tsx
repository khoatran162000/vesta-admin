// FILE: src/components/users/StudentList.tsx — Quản lý học viên (điểm đầu vào / Excel / theo dõi / quản lý lớp / chọn lô)
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Lock, Unlock, Pencil, Loader2, Upload, FileDown, LineChart, KeyRound, Eye, EyeOff, Users, Trash2, X } from "lucide-react";
import * as XLSX from "xlsx";
import { api } from "@/lib/api";
interface Student {
  id: string; email: string | null; studentCode: string | null; fullName: string;
  phone: string | null; address: string | null; course: string | null;
  testScore: string | null; isActive: boolean; createdAt: string;
}
export function StudentList() {
  const [users, setUsers] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [includeHidden, setIncludeHidden] = useState(false);
  const [classModal, setClassModal] = useState<Student | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkModal, setBulkModal] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newCode, setNewCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: "STUDENT", page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (includeHidden) params.set("includeHidden", "1");
      const data = await api.get(`/users?${params}`);
      if (data.success) { setUsers(data.data); setTotal(data.meta.total); }
    } catch {} finally { setLoading(false); }
  }, [page, search, includeHidden]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);
  // Đổi trang/tìm kiếm/toggle ẩn → xoá lựa chọn (tránh chọn lô cross-page nhầm)
  useEffect(() => { setSelected(new Set()); }, [page, search, includeHidden]);
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  const allVisibleSelected = users.length > 0 && users.every((u) => selected.has(u.id));
  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) users.forEach((u) => next.delete(u.id));
      else users.forEach((u) => next.add(u.id));
      return next;
    });
  }
  async function handleToggle(id: string) {
    await api.patch(`/users/${id}/toggle-status`);
    fetchUsers();
  }
  async function handleReset(id: string, name: string) {
    if (!confirm(`Đặt lại mật khẩu cho "${name}"?`)) return;
    const data = await api.post(`/users/${id}/reset-password`, {});
    if (data.success) {
      prompt(`Mật khẩu mới của ${name} (copy đưa học viên):`, data.data.newPassword);
    } else {
      alert(data.message || "Lỗi đặt lại mật khẩu");
    }
  }
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setCreating(true); setMsg("");
    try {
      const body: any = { fullName: newName, role: "STUDENT" };
      if (newCode) body.studentCode = newCode;
      if (newEmail) body.email = newEmail;
      body.phone = newPhone || undefined;
      body.address = newAddress || undefined;
      body.password = newPass || "Student@123";
      const data = await api.post("/users", body);
      if (data.success) {
        setShowCreate(false);
        setNewName(""); setNewEmail(""); setNewPhone(""); setNewAddress(""); setNewPass(""); setNewCode("");
        fetchUsers();
        if (data.data?.studentCode) alert(`Tạo thành công! Mã học viên: ${data.data.studentCode}`);
      } else { setMsg(data.message); }
    } catch { setMsg("Lỗi server"); } finally { setCreating(false); }
  }
  // Xuất Excel: lấy TẤT CẢ học viên (không phân trang) rồi xuất .xlsx
  async function exportExcel() {
    let all: Student[] = [];
    let p = 1;
    while (true) {
      const q = new URLSearchParams({ role: "STUDENT", page: String(p), limit: "50" });
      if (search) q.set("search", search);
      if (includeHidden) q.set("includeHidden", "1");
      const data = await api.get(`/users?${q}`);
      if (!data.success || !data.data?.length) break;
      all = all.concat(data.data);
      if (data.data.length < 50) break;
      p++;
      if (p > 50) break; // chặn vòng lặp vô hạn
    }
    const rows = all.map((u) => ({
      "Mã HV": u.studentCode || "",
      "Họ tên": u.fullName,
      "SĐT": u.phone || "",
      "Email": u.email || "",
      "Địa chỉ": u.address || "",
      "Khoá": u.course || "",
      "Điểm đầu vào": u.testScore || "",
      "Trạng thái": u.isActive ? "Hoạt động" : "Đã ẩn",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Học viên");
    XLSX.writeFile(wb, `hoc-vien-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">Quản lý Học viên</h2>
          <p className="text-sm text-muted">{total} tài khoản</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setIncludeHidden((v) => !v); setPage(1); }} className="btn-secondary">
            {includeHidden ? <EyeOff size={15} /> : <Eye size={15} />}{includeHidden ? "Ẩn HS đã ẩn" : "Xem cả HS đã ẩn"}
          </button>
          <button onClick={exportExcel} className="btn-secondary"><FileDown size={15} />Xuất Excel</button>
          <Link href="/tai-khoan/hoc-vien/import" className="btn-secondary"><Upload size={15} />Import</Link>
          <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={15} />Tạo tài khoản</button>
        </div>
      </div>
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo tên, mã HV, SĐT..." className="input-field pl-9" />
      </div>
      {selected.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-gold/30 bg-gold/5 px-4 py-3">
          <span className="text-sm font-medium text-royal">Đã chọn {selected.size} học viên</span>
          <div className="flex gap-2">
            <button onClick={() => setBulkModal(true)} className="btn-primary"><Users size={14} />Thêm vào lớp</button>
            <button onClick={() => setSelected(new Set())} className="btn-secondary">Bỏ chọn</button>
          </div>
        </div>
      )}
      <div className="card overflow-hidden !p-0">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gold" /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-silver/20 bg-cream">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll}
                    className="h-4 w-4 rounded border-silver text-royal focus:ring-royal" />
                </th>
                <th className="px-4 py-3 font-semibold text-royal">Mã HV</th>
                <th className="px-4 py-3 font-semibold text-royal">Họ tên</th>
                <th className="px-4 py-3 font-semibold text-royal">SĐT</th>
                <th className="px-4 py-3 font-semibold text-royal">Email</th>
                <th className="px-4 py-3 font-semibold text-royal">Điểm đầu vào</th>
                <th className="px-4 py-3 font-semibold text-royal">Trạng thái</th>
                <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-b border-silver/10 hover:bg-cream/50 ${selected.has(u.id) ? "bg-gold/5" : ""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)}
                      className="h-4 w-4 rounded border-silver text-royal focus:ring-royal" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-royal/8 px-2 py-0.5 text-xs font-semibold text-royal">{u.studentCode || "—"}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#1a1a2e]">{u.fullName}</td>
                  <td className="px-4 py-3 text-muted">{u.phone || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted">{u.email || "—"}</td>
                  <td className="px-4 py-3">
                    {u.testScore
                      ? <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-royal">{u.testScore}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {u.isActive ? "Hoạt động" : "Đã ẩn"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/theo-doi/${u.id}`} title="Xem điểm & quá trình làm bài"
                        className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><LineChart size={15} /></Link>
                      <Link href={`/tai-khoan/${u.id}`} title="Sửa / Xem tài khoản"
                        className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Pencil size={15} /></Link>
                      <button onClick={() => handleReset(u.id, u.fullName)} title="Đặt lại mật khẩu"
                        className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><KeyRound size={15} /></button>
                      <button onClick={() => setClassModal(u)} title="Quản lý lớp"
                        className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Users size={15} /></button>
                      <button onClick={() => handleToggle(u.id)} title={u.isActive ? "Ẩn học viên" : "Hiện lại"}
                        className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal">
                        {u.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && users.length === 0 && <p className="py-12 text-center text-muted">Chưa có học viên nào.</p>}
      </div>
      {total > 20 && (
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs disabled:opacity-40">← Trước</button>
          <span className="px-3 py-1.5 text-sm text-muted">Trang {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={users.length < 20} className="btn-secondary text-xs disabled:opacity-40">Sau →</button>
        </div>
      )}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
          <form onSubmit={handleCreate} className="w-full max-w-lg card space-y-4">
            <h3 className="font-display text-xl font-bold text-royal">Tạo Học viên</h3>
            {msg && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{msg}</p>}
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Họ và tên *" required className="input-field" />
            <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="Mã học viên (để trống = tự tạo)" className="input-field" />
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email (tuỳ chọn)" className="input-field" />
            <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Số điện thoại" className="input-field" />
            <input type="text" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Địa chỉ" className="input-field" />
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Mật khẩu (mặc định: Student@123)" className="input-field" />
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">Học viên đăng nhập bằng <strong>Mã HV + Mật khẩu</strong>. Mã HV tự tạo nếu để trống.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Huỷ</button>
              <button type="submit" disabled={creating} className="btn-primary">{creating ? "Đang tạo..." : "Tạo"}</button>
            </div>
          </form>
        </div>
      )}
      {classModal && (
        <StudentClassModal student={classModal} onClose={() => setClassModal(null)} />
      )}
      {bulkModal && (
        <BulkAddClassModal
          studentIds={[...selected]}
          onClose={() => setBulkModal(false)}
          onDone={() => { setBulkModal(false); setSelected(new Set()); alert("Đã thêm học viên vào lớp"); }}
        />
      )}
    </div>
  );
}

function StudentClassModal({ student, onClose }: { student: any; onClose: () => void }) {
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [addId, setAddId] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const [mine, all] = await Promise.all([
      api.get(`/classes/of-student/${student.id}`),
      api.get(`/classes`),
    ]);
    if (mine.success) setMyClasses(mine.data || []);
    if (all.success) setAllClasses(all.data || []);
    setLoading(false);
  }, [student.id]);
  useEffect(() => { load(); }, [load]);
  async function addToClass() {
    if (!addId) return;
    const res = await api.post(`/classes/${addId}/enroll`, { studentIds: [student.id] });
    if (res.success) { setAddId(""); load(); }
    else alert(res.message || "Lỗi thêm vào lớp");
  }
  async function removeFromClass(classId: string) {
    if (!confirm("Gỡ học viên khỏi lớp này?")) return;
    const res = await api.delete(`/classes/${classId}/students/${student.id}`);
    if (res.success) load();
    else alert(res.message || "Lỗi gỡ");
  }
  const myIds = new Set(myClasses.map((c) => c.id));
  const available = allClasses.filter((c) => !myIds.has(c.id));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-royal">Quản lý lớp</h3>
            <p className="text-xs text-muted">{student.fullName} ({student.studentCode})</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-royal"><X size={20} /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-gold" /></div>
        ) : (
          <>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Lớp đang thuộc</p>
            {myClasses.length === 0 ? (
              <p className="mb-3 text-sm text-muted">Chưa thuộc lớp nào.</p>
            ) : (
              <div className="mb-3 space-y-1.5">
                {myClasses.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-silver/30 px-3 py-2">
                    <span className="text-sm font-medium text-[#1a1a2e]">{c.name}
                      {c.course && <span className="ml-1 text-xs text-muted">({c.course})</span>}</span>
                    <button onClick={() => removeFromClass(c.id)} title="Gỡ khỏi lớp"
                      className="rounded p-1 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Thêm vào lớp</p>
            <div className="flex gap-2">
              <select value={addId} onChange={(e) => setAddId(e.target.value)} className="input-field flex-1">
                <option value="">— Chọn lớp —</option>
                {available.map((c) => <option key={c.id} value={c.id}>{c.name}{c.course ? ` (${c.course})` : ""}</option>)}
              </select>
              <button onClick={addToClass} disabled={!addId} className="btn-primary disabled:opacity-40"><Plus size={14} />Thêm</button>
            </div>
          </>
        )}
        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="btn-secondary">Đóng</button>
        </div>
      </div>
    </div>
  );
}

function BulkAddClassModal({ studentIds, onClose, onDone }: { studentIds: string[]; onClose: () => void; onDone: () => void }) {
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [addId, setAddId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    (async () => {
      const all = await api.get(`/classes`);
      if (all.success) setAllClasses(all.data || []);
      setLoading(false);
    })();
  }, []);
  async function submit() {
    if (!addId) return;
    setSaving(true);
    const res = await api.post(`/classes/${addId}/enroll`, { studentIds });
    setSaving(false);
    if (res.success) onDone();
    else alert(res.message || "Lỗi thêm vào lớp");
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-royal">Thêm {studentIds.length} học viên vào lớp</h3>
          <button onClick={onClose} className="text-muted hover:text-royal"><X size={20} /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-gold" /></div>
        ) : (
          <>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Chọn lớp</p>
            <select value={addId} onChange={(e) => setAddId(e.target.value)} className="input-field w-full">
              <option value="">— Chọn lớp —</option>
              {allClasses.map((c) => <option key={c.id} value={c.id}>{c.name}{c.course ? ` (${c.course})` : ""}</option>)}
            </select>
            <p className="mt-2 text-xs text-muted">Học viên đã có trong lớp sẽ được bỏ qua, không bị trùng.</p>
          </>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Huỷ</button>
          <button onClick={submit} disabled={!addId || saving} className="btn-primary disabled:opacity-40">
            {saving ? "Đang thêm..." : "Thêm vào lớp"}
          </button>
        </div>
      </div>
    </div>
  );
}