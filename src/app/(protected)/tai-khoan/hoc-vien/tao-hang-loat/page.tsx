// FILE: src/app/(protected)/tai-khoan/hoc-vien/tao-hang-loat/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Loader2, CheckCircle, Copy, Download } from "lucide-react";
import { api } from "@/lib/api";

interface Account {
  fullName: string;
  studentCode: string;
  password: string;
  phone: string;
}

const COURSES = ["5+", "6+", "7+", "1-1", "Intensive", "Writing", "Chuyên Cấp 3"];

export default function BatchCreatePage() {
  const [input, setInput] = useState("");
  const [course, setCourse] = useState("6+");
  const [creating, setCreating] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    const lines = input.trim().split("\n").filter((l) => l.trim());
    if (lines.length === 0) { alert("Vui lòng nhập danh sách"); return; }
    setCreating(true);
    setAccounts([]);
    setErrors([]);

    const newAccounts: Account[] = [];
    const newErrors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(/[,\t]/).map((s) => s.trim());
      let fullName = "", phone = "", email = "";
      if (parts.length >= 3) { fullName = parts[0]; email = parts[1]; phone = parts[2]; }
      else if (parts.length === 2) { fullName = parts[0]; phone = parts[1]; }
      else { fullName = parts[0]; phone = ""; }

      if (!fullName || !phone) {
        newErrors.push(`Dòng ${i + 1}: Thiếu họ tên hoặc SĐT — "${lines[i]}"`);
        continue;
      }

      try {
        const data = await api.post("/register", { fullName, email: email || undefined, phone, course });
        if (data.success && data.data) {
          newAccounts.push({
            fullName: data.data.fullName,
            studentCode: data.data.studentCode,
            password: data.data.password,
            phone,
          });
        } else {
          newErrors.push(`Dòng ${i + 1}: ${fullName} — ${data.message}`);
        }
      } catch {
        newErrors.push(`Dòng ${i + 1}: ${fullName} — Lỗi kết nối`);
      }
    }

    setAccounts(newAccounts);
    setErrors(newErrors);
    setCreating(false);
  }

  function copyAll() {
    const text = accounts.map((a) => `${a.fullName}\t${a.studentCode}\t${a.password}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadCSV() {
    const csv = "Họ tên,Mã học viên,Mật khẩu,SĐT\n" +
      accounts.map((a) => `"${a.fullName}","${a.studentCode}","${a.password}","${a.phone}"`).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tai-khoan-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <Link href="/tai-khoan/hoc-vien" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal">
        <ArrowLeft size={15} />Quay lại
      </Link>
      <h2 className="mb-2 font-display text-2xl font-bold text-royal">👥 Tạo Tài Khoản Hàng Loạt</h2>
      <p className="mb-6 text-sm text-muted">Dán danh sách học viên, mỗi dòng 1 người. Hệ thống tự tạo mã HV + mật khẩu = SĐT.</p>

      {accounts.length === 0 ? (
        <>
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
            <p className="mb-1 text-sm font-bold text-amber-800">📋 Format mỗi dòng:</p>
            <code className="block text-xs text-amber-900">Họ tên, SĐT</code>
            <code className="block text-xs text-amber-900">Họ tên, Email, SĐT</code>
            <p className="mt-1 text-xs text-amber-700">Phân cách bằng dấu phẩy hoặc tab.</p>
            <pre className="mt-1 text-xs text-amber-800">Trần Ngọc Khoa, 0838779988{"\n"}Lê Hương Ly, ly@gmail.com, 0336781368</pre>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Khoá học mặc định</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)}
              className="rounded-lg border border-silver/40 bg-white px-4 py-2.5 text-sm outline-none focus:border-gold">
              {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={10}
            placeholder={"Trần Ngọc Khoa, 0838779988\nLê Hương Ly, ly@gmail.com, 0336781368"}
            className="input-field mb-4 resize-y font-mono" />

          <button onClick={handleCreate} disabled={creating || !input.trim()}
            className="btn-primary w-full justify-center py-3.5">
            {creating ? <><Loader2 size={16} className="animate-spin" />Đang tạo...</> : <><Users size={16} />Tạo {input.trim().split("\n").filter((l) => l.trim()).length} tài khoản</>}
          </button>
        </>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <CheckCircle size={24} className="mx-auto mb-1 text-green-600" />
              <p className="text-xl font-bold text-green-700">{accounts.length}</p>
              <p className="text-xs text-green-600">Tạo thành công</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-xl font-bold text-red-600">{errors.length}</p>
              <p className="text-xs text-red-500">Lỗi / Bỏ qua</p>
            </div>
          </div>

          <div className="mb-4 flex gap-2">
            <button onClick={copyAll} className="btn-secondary flex-1 justify-center">
              {copied ? <><CheckCircle size={14} className="text-green-600" /><span className="text-green-600">Đã copy!</span></> : <><Copy size={14} />Copy tất cả</>}
            </button>
            <button onClick={downloadCSV} className="btn-primary flex-1 justify-center">
              <Download size={14} />Tải CSV
            </button>
          </div>

          {errors.length > 0 && (
            <div className="mb-4 rounded-xl border border-red-200 bg-white p-3">
              {errors.map((e, i) => <p key={i} className="text-xs text-red-500">{e}</p>)}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-silver/20 bg-white">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b bg-cream">
                <th className="px-4 py-2.5 font-semibold text-royal">Họ tên</th>
                <th className="px-4 py-2.5 font-semibold text-royal">Mã HV</th>
                <th className="px-4 py-2.5 font-semibold text-royal">Mật khẩu</th>
              </tr></thead>
              <tbody>
                {accounts.map((a, i) => (
                  <tr key={i} className="border-b border-silver/10">
                    <td className="px-4 py-2">{a.fullName}</td>
                    <td className="px-4 py-2 font-mono text-royal">{a.studentCode}</td>
                    <td className="px-4 py-2 font-mono text-muted">{a.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={() => { setAccounts([]); setErrors([]); setInput(""); }}
            className="btn-secondary mt-4 w-full justify-center py-3">
            Tạo thêm
          </button>
        </>
      )}
    </div>
  );
}
