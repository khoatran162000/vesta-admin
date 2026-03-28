// FILE: src/app/(protected)/tai-khoan/hoc-vien/import/page.tsx — Import HV voi studentCode, phone, address
"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Upload, FileSpreadsheet, FileText } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

interface StudentRow {
  fullName: string; email: string; phone: string; address: string; password: string; studentCode: string;
}

export default function ImportStudentsPage() {
  const [mode, setMode] = useState<"text" | "excel">("text");
  const [text, setText] = useState("");
  const [excelData, setExcelData] = useState<StudentRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function parseText(): StudentRow[] {
    return text.trim().split("\n").filter(Boolean).map((line) => {
      const p = line.split(/[\t,;|]+/).map((s) => s.trim());
      // Format: Họ tên, Email, SĐT, Địa chỉ, Mật khẩu, Mã HV
      return {
        fullName: p[0] || "", email: p[1] || "", phone: p[2] || "",
        address: p[3] || "", password: p[4] || "", studentCode: p[5] || "",
      };
    }).filter((s) => s.fullName);
  }

  async function handleExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      const parsed: StudentRow[] = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[0]) continue;
        parsed.push({
          fullName: String(r[0] || "").trim(),
          email: String(r[1] || "").trim(),
          phone: String(r[2] || "").trim(),
          address: String(r[3] || "").trim(),
          password: String(r[4] || "").trim(),
          studentCode: String(r[5] || "").trim(),
        });
      }
      setExcelData(parsed.filter((s) => s.fullName));
    } catch (err) { console.error(err); setExcelData([]); }
    e.target.value = "";
  }

  async function handleImport() {
    const students = mode === "text" ? parseText() : excelData;
    if (!students.length) return;
    setLoading(true); setResult(null);
    try {
      const data = await api.post("/users/bulk-create", { students });
      setResult(data.data);
    } catch { setResult({ errors: ["Lỗi server"] }); }
    finally { setLoading(false); }
  }

  const preview = mode === "text" ? parseText() : excelData;

  return (
    <div className="mx-auto max-w-[850px]">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/tai-khoan/hoc-vien" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <h2 className="font-display text-2xl font-bold text-royal">Import học viên hàng loạt</h2>
      </div>

      {/* Mode toggle */}
      <div className="mb-5 flex gap-3">
        <button onClick={() => setMode("text")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors ${mode === "text" ? "border-gold bg-gold/10 text-royal" : "border-silver/40 text-muted"}`}>
          <FileText size={16} />Dán văn bản
        </button>
        <button onClick={() => setMode("excel")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors ${mode === "excel" ? "border-gold bg-gold/10 text-royal" : "border-silver/40 text-muted"}`}>
          <FileSpreadsheet size={16} />Upload Excel
        </button>
      </div>

      <div className="card space-y-4">
        {/* Info box */}
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <p className="font-semibold mb-1">Format: 6 cột</p>
          <p className="text-xs">Họ tên*, Email, SĐT, Địa chỉ, Mật khẩu, Mã HV</p>
          <p className="text-xs mt-1">(*) Chỉ Họ tên là bắt buộc. Mã HV và Mật khẩu để trống sẽ tự tạo (VS2025xxxx / Student@123)</p>
        </div>

        {mode === "text" ? (
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10}
            placeholder={"Nguyễn Văn A, nva@gmail.com, 0912345678, 123 Hoàng Quốc Việt HN, Pass@123, VS20250010\nTrần Thị B, , 0987654321, , , \nLê Văn C"}
            className="input-field font-mono text-sm" />
        ) : (
          <>
            <button onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-dashed border-silver/40 bg-cream py-8 hover:border-gold/40 hover:bg-gold/5">
              <FileSpreadsheet size={28} className="text-muted" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted">{fileName || "Bấm để chọn file Excel"}</p>
                <p className="text-xs text-muted/60">.xlsx, .xls — 6 cột: Họ tên, Email, SĐT, Địa chỉ, Mật khẩu, Mã HV</p>
              </div>
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcel} />
          </>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-royal">Xem trước: {preview.length} học viên</p>
            <div className="max-h-[220px] overflow-auto rounded-lg border border-silver/30">
              <table className="w-full text-left text-xs">
                <thead><tr className="border-b border-silver/20 bg-cream">
                  <th className="px-2 py-2 text-muted">#</th>
                  <th className="px-2 py-2 text-muted">Họ tên</th>
                  <th className="px-2 py-2 text-muted">Email</th>
                  <th className="px-2 py-2 text-muted">SĐT</th>
                  <th className="px-2 py-2 text-muted">Địa chỉ</th>
                  <th className="px-2 py-2 text-muted">Mã HV</th>
                </tr></thead>
                <tbody>{preview.slice(0, 20).map((s, i) => (
                  <tr key={i} className="border-b border-silver/10">
                    <td className="px-2 py-1.5 text-muted">{i + 1}</td>
                    <td className="px-2 py-1.5 font-medium">{s.fullName}</td>
                    <td className="px-2 py-1.5 text-muted">{s.email || "—"}</td>
                    <td className="px-2 py-1.5 text-muted">{s.phone || "—"}</td>
                    <td className="px-2 py-1.5 text-muted truncate max-w-[120px]">{s.address || "—"}</td>
                    <td className="px-2 py-1.5 text-muted">{s.studentCode || "(tự tạo)"}</td>
                  </tr>
                ))}</tbody>
              </table>
              {preview.length > 20 && <p className="py-2 text-center text-xs text-muted">... và {preview.length - 20} học viên nữa</p>}
            </div>
          </div>
        )}

        <button onClick={handleImport} disabled={loading || preview.length === 0} className="btn-primary">
          <Upload size={15} />{loading ? "Đang import..." : `Import ${preview.length} học viên`}
        </button>

        {/* Result */}
        {result && (
          <div className="rounded-lg bg-cream-dark p-4 text-sm space-y-2">
            <p className="font-semibold text-royal">Kết quả:</p>
            <p className="text-green-700">✅ Đã tạo: {result.created} tài khoản</p>
            {result.skipped > 0 && <p className="text-amber-600">⚠️ Bỏ qua: {result.skipped}</p>}

            {/* Show created students with their codes */}
            {result.createdStudents?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-royal mb-1">Danh sách mã HV đã tạo:</p>
                <div className="max-h-[150px] overflow-auto rounded border border-silver/30 bg-white">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-cream border-b border-silver/20">
                      <th className="px-2 py-1.5 text-left text-muted">Mã HV</th>
                      <th className="px-2 py-1.5 text-left text-muted">Họ tên</th>
                      <th className="px-2 py-1.5 text-left text-muted">Mật khẩu</th>
                    </tr></thead>
                    <tbody>{result.createdStudents.map((s: any, i: number) => (
                      <tr key={i} className="border-b border-silver/10">
                        <td className="px-2 py-1.5 font-bold text-royal">{s.studentCode}</td>
                        <td className="px-2 py-1.5">{s.fullName}</td>
                        <td className="px-2 py-1.5 text-muted">{s.password}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {result.errors?.length > 0 && (
              <ul className="list-disc pl-5 text-xs text-red-600">
                {result.errors.slice(0, 10).map((e: string, i: number) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
