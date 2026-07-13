// FILE: src/components/users/StudentList.tsx — Quản lý học viên (tách riêng, có điểm đầu vào / Excel / theo dõi)
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Lock, Unlock, Pencil, Loader2, Upload, FileDown, LineChart } from "lucide-react";
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
      const data = await api.get(`/users?${params}`);
      if (data.success) { setUsers(data.data); setTotal(data.meta.total); }
    } catch {} finally { setLoading(false); }
  }, [page, search]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);
  async function handleToggle(id: string) {
    await api.patch(`/users/${id}/toggle-status`);
    fetchUsers();
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
    const params = new URLSearchParams({ role: "STUDENT", page: "1", limit: "50" });
    if (search) params.set("search", search);
    // gom hết các trang
    let all: Student[] = [];
    let p = 1;
    while (true) {
      const q = new URLSearchParams({ role: "STUDENT", page: String(p), limit: "50" });
      if (search) q.set("search", search);
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
      <div className="card overflow-hidden !p-0">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gold" /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-silver/20 bg-cream">
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
                <tr key={u.id} className="border-b border-silver/10 hover:bg-cream/50">
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
    </div>
  );
}