"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.post("/auth/login", { email, password });
      if (data.success) {
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        window.location.href = "/dashboard";
      } else {
        setError(data.message);
      }
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-royal">VESTA</h1>
          <p className="mt-1 text-sm text-muted">Admin Portal — Đăng nhập</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-5">
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@vestauni.vn" required className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-royal">Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required className="input-field" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
