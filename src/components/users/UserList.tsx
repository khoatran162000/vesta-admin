// FILE: src/components/users/UserList.tsx — Hien thi studentCode, phone, edit/lock
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Lock, Unlock, Pencil, Loader2, Upload } from "lucide-react";
import { api } from "@/lib/api";

interface User {
  id: string; email: string | null; studentCode: string | null; fullName: string;
  phone: string | null; role: string; isActive: boolean; createdAt: string;
}

interface Props {
  role: string;
  roleLabel: string;
  canCreate?: boolean;
  showImport?: boolean;
}

export function UserList({ role, roleLabel, canCreate = true, showImport = false }: Props) {
  const isStudent = role === "STUDENT";
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  // Create form states
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
      const params = new URLSearchParams({ role, page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const data = await api.get(`/users?${params}`);
      if (data.success) { setUsers(data.data); setTotal(data.meta.total); }
    } catch {} finally { setLoading(false); }
  }, [role, page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const [searchInput, setSearchInput] = useState("");
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
      const body: any = { fullName: newName, role };

      if (isStudent) {
        // Student: studentCode tự generate nếu để trống
        if (newCode) body.studentCode = newCode;
        if (newEmail) body.email = newEmail;
        body.phone = newPhone || undefined;
        body.address = newAddress || undefined;
        body.password = newPass || "Student@123";
      } else {
        // Staff: bắt buộc email
        body.email = newEmail;
        body.password = newPass || "Default@123";
        if (newPhone) body.phone = newPhone;
      }

      const data = await api.post("/users", body);
      if (data.success) {
        setShowCreate(false);
        setNewName(""); setNewEmail(""); setNewPhone(""); setNewAddress(""); setNewPass(""); setNewCode("");
        fetchUsers();
        if (isStudent && data.data?.studentCode) {
          alert(`Tạo thành công! Mã học viên: ${data.data.studentCode}`);
        }
      } else { setMsg(data.message); }
    } catch { setMsg("Lỗi server"); } finally { setCreating(false); }
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">Quản lý {roleLabel}</h2>
          <p className="text-sm text-muted">{total} tài khoản</p>
        </div>
        <div className="flex items-center gap-2">
          {showImport && (
            <Link href="/tai-khoan/hoc-vien/import" className="btn-secondary"><Upload size={15} />Import</Link>
          )}
          {canCreate && (
            <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={15} />Tạo tài khoản</button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder={isStudent ? "Tìm theo tên, mã HV, SĐT..." : "Tìm theo tên hoặc email..."} className="input-field pl-9" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gold" /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-silver/20 bg-cream">
                {isStudent && <th className="px-4 py-3 font-semibold text-royal">Mã HV</th>}
                <th className="px-4 py-3 font-semibold text-royal">Họ tên</th>
                {isStudent ? (
                  <>
                    <th className="px-4 py-3 font-semibold text-royal">SĐT</th>
                    <th className="px-4 py-3 font-semibold text-royal">Email</th>
                  </>
                ) : (
                  <th className="px-4 py-3 font-semibold text-royal">Email</th>
                )}
                <th className="px-4 py-3 font-semibold text-royal">Trạng thái</th>
                <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-silver/10 hover:bg-cream/50">
                  {isStudent && (
                    <td className="px-4 py-3">
                      <span className="rounded bg-royal/8 px-2 py-0.5 text-xs font-semibold text-royal">{u.studentCode || "—"}</span>
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium text-[#1a1a2e]">{u.fullName}</td>
                  {isStudent ? (
                    <>
                      <td className="px-4 py-3 text-muted">{u.phone || "—"}</td>
                      <td className="px-4 py-3 text-muted text-xs">{u.email || "—"}</td>
                    </>
                  ) : (
                    <td className="px-4 py-3 text-muted">{u.email}</td>
                  )}
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {u.isActive ? "Hoạt động" : "Đã khoá"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/tai-khoan/${u.id}`} title="Sửa" className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Pencil size={15} /></Link>
                      <button onClick={() => handleToggle(u.id)} title={u.isActive ? "Khoá" : "Mở khoá"}
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
        {!loading && users.length === 0 && <p className="py-12 text-center text-muted">Chưa có {roleLabel.toLowerCase()} nào.</p>}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs disabled:opacity-40">← Trước</button>
          <span className="px-3 py-1.5 text-sm text-muted">Trang {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={users.length < 20} className="btn-secondary text-xs disabled:opacity-40">Sau →</button>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
          <form onSubmit={handleCreate} className="w-full max-w-lg card space-y-4">
            <h3 className="font-display text-xl font-bold text-royal">Tạo {roleLabel}</h3>
            {msg && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{msg}</p>}

            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Họ và tên *" required className="input-field" />

            {isStudent && (
              <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value)}
                placeholder="Mã học viên (để trống = tự tạo, VD: VS20250001)" className="input-field" />
            )}

            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
              placeholder={isStudent ? "Email (tuỳ chọn)" : "Email *"} required={!isStudent} className="input-field" />

            <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Số điện thoại" className="input-field" />

            {isStudent && (
              <input type="text" value={newAddress} onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Địa chỉ" className="input-field" />
            )}

            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
              placeholder={`Mật khẩu (mặc định: ${isStudent ? "Student@123" : "Default@123"})`} className="input-field" />

            {isStudent && (
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                Học viên đăng nhập bằng <strong>Mã HV + Mật khẩu</strong> (không dùng email).
                Mã HV sẽ tự tạo nếu để trống.
              </p>
            )}

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
