"use client";

import { useState, useEffect } from "react";
import { Save, Camera, Loader2 } from "lucide-react";
import { api, getImageUrl } from "@/lib/api";
import { ROLE_LABELS } from "@/hooks/useAuth";

interface UserProfile { id: string; email: string; fullName: string; role: string; avatarUrl: string | null; }

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get("/auth/me");
        if (data.success) { setUser(data.data); setFullName(data.data.fullName); }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileMsg("");
    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("fullName", fullName);
    try {
      const data = await api.put("/auth/profile", formData);
      if (data.success) { setUser(data.data); setProfileMsg("✅ Cập nhật avatar thành công!"); }
      else setProfileMsg(`❌ ${data.message}`);
    } catch { setProfileMsg("❌ Lỗi upload"); }
    e.target.value = "";
  }

  async function handleUpdateProfile() {
    setSavingProfile(true); setProfileMsg("");
    try {
      const data = await api.put("/auth/profile", { fullName });
      if (data.success) { setUser(data.data); setProfileMsg("✅ Cập nhật thành công!"); }
      else setProfileMsg(`❌ ${data.message}`);
    } catch { setProfileMsg("❌ Lỗi server"); } finally { setSavingProfile(false); }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 6) { setPasswordMsg("❌ Mật khẩu mới tối thiểu 6 ký tự"); return; }
    setSavingPassword(true); setPasswordMsg("");
    try {
      const data = await api.put("/auth/change-password", { currentPassword, newPassword });
      if (data.success) { setPasswordMsg("✅ Đổi mật khẩu thành công!"); setCurrentPassword(""); setNewPassword(""); }
      else setPasswordMsg(`❌ ${data.message}`);
    } catch { setPasswordMsg("❌ Lỗi server"); } finally { setSavingPassword(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  if (!user) return null;

  return (
    <div className="mx-auto max-w-[640px]">
      <h2 className="mb-6 font-display text-2xl font-bold text-royal">Hồ sơ cá nhân</h2>

      <div className="card space-y-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            {user.avatarUrl ? (
              <img src={getImageUrl(user.avatarUrl)} alt={user.fullName} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-royal/10 font-display text-2xl font-bold text-royal">{user.fullName.charAt(0)}</div>
            )}
            <button onClick={() => document.getElementById("avatar-input")?.click()}
              className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-gold p-1.5 text-navy hover:scale-110">
              <Camera size={12} />
            </button>
            <input id="avatar-input" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="text-lg font-semibold text-royal">{user.fullName}</p>
            <p className="text-sm text-muted">{user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-gold/15 px-3 py-0.5 text-xs font-semibold text-gold">{ROLE_LABELS[user.role]}</span>
          </div>
        </div>

        <div><label className="mb-1 block text-sm font-medium text-royal">Họ và tên</label><input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" /></div>
        <div><label className="mb-1 block text-sm font-medium text-royal">Email</label><input value={user.email} disabled className="input-field opacity-60" /></div>

        {profileMsg && <p className={`rounded-lg px-4 py-2.5 text-sm ${profileMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{profileMsg}</p>}

        <button onClick={handleUpdateProfile} disabled={savingProfile || fullName === user.fullName} className="btn-primary">
          <Save size={15} />{savingProfile ? "Đang lưu..." : "Cập nhật hồ sơ"}
        </button>
      </div>

      <div className="card mt-6 space-y-5">
        <h3 className="font-display text-lg font-bold text-royal">Đổi mật khẩu</h3>
        <div><label className="mb-1 block text-sm font-medium text-royal">Mật khẩu hiện tại</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="input-field" /></div>
        <div><label className="mb-1 block text-sm font-medium text-royal">Mật khẩu mới</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="input-field" /></div>

        {passwordMsg && <p className={`rounded-lg px-4 py-2.5 text-sm ${passwordMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{passwordMsg}</p>}

        <button onClick={handleChangePassword} disabled={savingPassword || !currentPassword || !newPassword} className="btn-secondary">
          {savingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
        </button>
      </div>
    </div>
  );
}
