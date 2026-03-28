// FILE: src/app/(protected)/tai-khoan/[id]/page.tsx — Sua tai khoan voi studentCode, phone, address
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Copy, Check } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị viên", TEACHER: "Giáo viên", CONTENT_CREATOR: "Marketing", STUDENT: "Học viên",
};

export default function EditUserPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get(`/users/${id}`);
        if (data.success) {
          setUser(data.data);
          setFullName(data.data.fullName);
          setEmail(data.data.email || "");
          setPhone(data.data.phone || "");
          setAddress(data.data.address || "");
          setRole(data.data.role);
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, [id]);

  async function handleSave() {
    setSaving(true); setError(""); setSuccess("");
    try {
      const body: any = { fullName, role, phone, address, email: email || null };
      if (newPassword) body.password = newPassword;
      const data = await api.put(`/users/${id}`, body);
      if (data.success) {
        setSuccess("Cập nhật thành công!");
        setUser(data.data);
        setNewPassword("");
      } else { setError(data.message); }
    } catch { setError("Lỗi server"); }
    finally { setSaving(false); }
  }

  function copyCode() {
    if (user?.studentCode) {
      navigator.clipboard.writeText(user.studentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  if (!user) return <p className="py-20 text-center text-muted">Tài khoản không tồn tại.</p>;

  const isStudent = user.role === "STUDENT";
  const backUrl = isStudent ? "/tai-khoan/hoc-vien"
    : user.role === "TEACHER" ? "/tai-khoan/giao-vien"
    : user.role === "CONTENT_CREATOR" ? "/tai-khoan/marketing" : "/dashboard";

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-6 flex items-center gap-3">
        <Link href={backUrl} className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">Chỉnh sửa tài khoản</h2>
          <p className="text-sm text-muted">{isStudent ? `Mã HV: ${user.studentCode}` : user.email}</p>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>}

      <div className="card space-y-5">
        {/* User info card */}
        <div className="flex items-center gap-4 rounded-lg bg-cream p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-royal/10 font-display text-xl font-bold text-royal">
            {user.fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#1a1a2e]">{user.fullName}</p>
            {isStudent && user.studentCode && (
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-royal/10 px-2 py-0.5 text-xs font-bold text-royal">{user.studentCode}</span>
                <button onClick={copyCode} className="rounded p-0.5 text-muted hover:text-royal">
                  {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                </button>
              </div>
            )}
            {!isStudent && <p className="text-sm text-muted">{user.email}</p>}
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[0.65rem] font-semibold text-gold">{ROLE_LABELS[user.role]}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold ${user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {user.isActive ? "Hoạt động" : "Đã khoá"}
              </span>
            </div>
          </div>
        </div>

        {/* Student code (read only) */}
        {isStudent && (
          <div>
            <label className="mb-1 block text-sm font-medium text-royal">Mã học viên</label>
            <input value={user.studentCode || ""} disabled className="input-field opacity-60" />
            <p className="mt-1 text-xs text-muted">Mã HV không thể thay đổi. Học viên dùng mã này để đăng nhập.</p>
          </div>
        )}

        {/* Editable fields */}
        <div>
          <label className="mb-1 block text-sm font-medium text-royal">Họ và tên *</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-royal">Email {isStudent ? "(tuỳ chọn)" : "*"}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field"
            placeholder={isStudent ? "Email liên hệ (tuỳ chọn)" : "Email đăng nhập"} />
          {!isStudent && <p className="mt-1 text-xs text-muted">Staff đăng nhập bằng email này</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-royal">Số điện thoại</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912345678" className="input-field" />
        </div>

        {isStudent && (
          <div>
            <label className="mb-1 block text-sm font-medium text-royal">Địa chỉ</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Địa chỉ liên hệ" className="input-field" />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-royal">Vai trò</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field">
            <option value="ADMIN">Quản trị viên</option>
            <option value="TEACHER">Giáo viên</option>
            <option value="CONTENT_CREATOR">Marketing</option>
            <option value="STUDENT">Học viên</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-royal">Đặt mật khẩu mới (tuỳ chọn)</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Để trống nếu không đổi" className="input-field" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-royal">Ngày tạo</label>
          <input value={new Date(user.createdAt).toLocaleString("vi-VN")} disabled className="input-field opacity-60" />
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center">
          <Save size={15} />{saving ? "Đang lưu..." : "Cập nhật"}
        </button>
      </div>
    </div>
  );
}
