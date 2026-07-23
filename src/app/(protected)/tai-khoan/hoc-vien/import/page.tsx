// FILE: src/app/(protected)/tai-khoan/hoc-vien/import/page.tsx — Import HV theo format mới (Lớp + Ngày ĐK)
"use client";
import { useState, useRef } from "react";
import { ArrowLeft, Upload, FileSpreadsheet, FileText, Download, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLevels } from "@/lib/useLevels";
interface StudentRow {
  fullName: string; course: string; startDate: string;
  phone: string; email: string; address: string;
}
// Chuẩn hoá ngày về YYYY-MM-DD để backend dựng mã đúng ngày.
// Excel có thể trả: (a) số serial (45890), (b) chuỗi "17/07/2026", (c) chuỗi "2026-07-17".
function normalizeDate(v: any): string {
  if (v === null || v === undefined || v === "") return "";
  // (a) số serial của Excel — mốc 1899-12-30
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return "";
  }
  const s = String(v).trim();
  // (c) đã là YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // (b) dd/mm/yyyy hoặc dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, dd, mm, yy] = m;
    if (yy.length === 2) yy = "20" + yy;
    return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return s; // để nguyên, backend fallback new Date()
}
export default function ImportStudentsPage() {
  const COURSES = useLevels();
  const [mode, setMode] = useState<"text" | "excel">("excel");
  const [text, setText] = useState("");
  const [excelData, setExcelData] = useState<StudentRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Bỏ file đã chọn (up sai file thì chọn lại, không cần tải lại trang)
  function clearFile() {
    setFileName("");
    setExcelData([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }
  // Xoá nội dung đã dán
  function clearText() {
    setText("");
    setResult(null);
  }
  // Đổi chế độ → dọn dữ liệu của chế độ cũ, tránh bấm Import nhầm dữ liệu còn sót
  function switchMode(m: "text" | "excel") {
    if (m === mode) return;
    setMode(m);
    setResult(null);
    if (m === "excel") setText("");
    else clearFile();
  }
  // Dán văn bản — thứ tự cột: Họ tên, Lớp, Ngày ĐK, SĐT, Email, Địa chỉ
  function parseText(): StudentRow[] {
    return text.trim().split("\n").filter(Boolean).map((line) => {
      const p = line.split(/[\t,;|]+/).map((s) => s.trim());
      return {
        fullName: p[0] || "", course: p[1] || "", startDate: normalizeDate(p[2] || ""),
        phone: p[3] || "", email: p[4] || "", address: p[5] || "",
      };
    }).filter((s) => s.fullName);
  }
  async function handleExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      // raw:true để lấy đúng số serial của cột ngày, rồi tự normalize
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true });
      const parsed: StudentRow[] = [];
      for (let i = 1; i < rows.length; i++) {   // bỏ dòng tiêu đề
        const r = rows[i];
        if (!r || !r[0]) continue;
        parsed.push({
          fullName: String(r[0] || "").trim(),
          course: String(r[1] || "").trim(),
          startDate: normalizeDate(r[2]),
          phone: r[3] === undefined || r[3] === null ? "" : String(r[3]).trim(),
          email: String(r[4] || "").trim(),
          address: String(r[5] || "").trim(),
        });
      }
      setExcelData(parsed.filter((s) => s.fullName));
    } catch (err) { console.error(err); setExcelData([]); }
    e.target.value = "";
  }
  // Tải mẫu Excel đúng format — chị bấm là có file chuẩn để điền
  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const header = ["Họ tên", "Lớp", "Ngày đăng ký", "SĐT", "Email", "Địa chỉ"];
    const sample = [
      ["Lê Hương Ly", COURSES[0] || "7+", "17/07/2026", "0912345678", "ly@gmail.com", "123 Hoàng Quốc Việt, HN"],
      ["Trần Gia Huy", COURSES[0] || "7+", "17/07/2026", "0987654321", "", ""],
    ];
    const ws = XLSX.utils.aoa_to_sheet([header, ...sample]);
    ws["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 28 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Học viên");
    XLSX.writeFile(wb, "mau-import-hoc-vien.xlsx");
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
  const unknownCourse = preview.filter((s) => s.course && !COURSES.includes(s.course));
  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/tai-khoan/hoc-vien" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <h2 className="font-display text-2xl font-bold text-royal">Import học viên hàng loạt</h2>
      </div>
      {/* Mode toggle */}
      <div className="mb-5 flex gap-3">
        <button onClick={() => switchMode("excel")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors ${mode === "excel" ? "border-gold bg-gold/10 text-royal" : "border-silver/40 text-muted"}`}>
          <FileSpreadsheet size={16} />Upload Excel
        </button>
        <button onClick={() => switchMode("text")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors ${mode === "text" ? "border-gold bg-gold/10 text-royal" : "border-silver/40 text-muted"}`}>
          <FileText size={16} />Dán văn bản
        </button>
      </div>
      <div className="card space-y-4">
        {/* Info box */}
        <div className="flex items-start justify-between gap-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <div>
            <p className="font-semibold mb-1">Format: 6 cột (đúng thứ tự)</p>
            <p className="text-xs">Họ tên*, Lớp*, Ngày đăng ký*, SĐT, Email, Địa chỉ</p>
            <p className="text-xs mt-1">
              Mã HV tự sinh theo <b>tên + lớp + ngày</b> (vd <code>lehuongly7+170726</code>). Mật khẩu = <b>SĐT</b>.
              Ngày dạng <b>dd/mm/yyyy</b>. Chỉ Họ tên/Lớp/Ngày bắt buộc.
            </p>
          </div>
          <button onClick={downloadTemplate} className="btn-secondary shrink-0"><Download size={14} />Tải mẫu</button>
        </div>
        {mode === "text" ? (
          <>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10}
              placeholder={"Lê Hương Ly, 7+, 17/07/2026, 0912345678, ly@gmail.com, 123 Hoàng Quốc Việt HN\nTrần Gia Huy, 7+, 17/07/2026, 0987654321"}
              className="input-field font-mono text-sm" />
            {text.trim() && (
              <button onClick={clearText} disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-red-600 disabled:opacity-50">
                <Trash2 size={13} />Xoá nội dung đã dán
              </button>
            )}
          </>
        ) : (
          <>
            {fileName ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gold/40 bg-gold/5 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileSpreadsheet size={22} className="shrink-0 text-gold-dim" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-royal">{fileName}</p>
                    <p className="text-xs text-muted">
                      {excelData.length > 0 ? `Đọc được ${excelData.length} học viên` : "Không đọc được dữ liệu — kiểm tra lại file"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => fileRef.current?.click()} disabled={loading}
                    className="rounded-lg border border-silver/40 px-3 py-1.5 text-xs font-semibold text-muted hover:border-gold/50 hover:text-royal disabled:opacity-50">
                    Chọn file khác
                  </button>
                  <button onClick={clearFile} disabled={loading} title="Bỏ file này"
                    className="rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 disabled:opacity-50">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-dashed border-silver/40 bg-cream py-8 hover:border-gold/40 hover:bg-gold/5">
                <FileSpreadsheet size={28} className="text-muted" />
                <div className="text-center">
                  <p className="text-sm font-medium text-muted">Bấm để chọn file Excel</p>
                  <p className="text-xs text-muted/60">.xlsx, .xls — 6 cột: Họ tên, Lớp, Ngày đăng ký, SĐT, Email, Địa chỉ</p>
                </div>
              </button>
            )}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcel} />
          </>
        )}
        {/* Cảnh báo lớp không khớp danh sách */}
        {unknownCourse.length > 0 && (
          <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
            ⚠️ {unknownCourse.length} dòng có tên lớp lạ (không khớp danh sách lớp trong hệ thống):
            {" "}<b>{[...new Set(unknownCourse.map((s) => s.course))].join(", ")}</b>.
            Vẫn import được, nhưng kiểm tra lại chính tả kẻo mã HV sinh ra sai lớp.
          </div>
        )}
        {/* Preview */}
        {preview.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-royal">Xem trước: {preview.length} học viên</p>
            <div className="max-h-[240px] overflow-auto rounded-lg border border-silver/30">
              <table className="w-full text-left text-xs">
                <thead><tr className="border-b border-silver/20 bg-cream">
                  <th className="px-2 py-2 text-muted">#</th>
                  <th className="px-2 py-2 text-muted">Họ tên</th>
                  <th className="px-2 py-2 text-muted">Lớp</th>
                  <th className="px-2 py-2 text-muted">Ngày ĐK</th>
                  <th className="px-2 py-2 text-muted">SĐT</th>
                  <th className="px-2 py-2 text-muted">Email</th>
                </tr></thead>
                <tbody>{preview.slice(0, 20).map((s, i) => (
                  <tr key={i} className="border-b border-silver/10">
                    <td className="px-2 py-1.5 text-muted">{i + 1}</td>
                    <td className="px-2 py-1.5 font-medium">{s.fullName}</td>
                    <td className="px-2 py-1.5">
                      {s.course
                        ? <span className={COURSES.includes(s.course) ? "text-muted" : "font-semibold text-amber-600"}>{s.course}</span>
                        : <span className="text-red-500">(thiếu)</span>}
                    </td>
                    <td className="px-2 py-1.5 text-muted">{s.startDate || <span className="text-red-500">(thiếu)</span>}</td>
                    <td className="px-2 py-1.5 text-muted">{s.phone || "—"}</td>
                    <td className="px-2 py-1.5 text-muted truncate max-w-[140px]">{s.email || "—"}</td>
                  </tr>
                ))}</tbody>
              </table>
              {preview.length > 20 && <p className="py-2 text-center text-xs text-muted">... và {preview.length - 20} học viên nữa</p>}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button onClick={handleImport} disabled={loading || preview.length === 0} className="btn-primary">
            <Upload size={15} />{loading ? "Đang import..." : `Import ${preview.length} học viên`}
          </button>
          <Link href="/tai-khoan/hoc-vien" className="btn-secondary">Huỷ</Link>
        </div>
        {/* Result */}
        {result && (
          <div className="rounded-lg bg-cream-dark p-4 text-sm space-y-2">
            <p className="font-semibold text-royal">Kết quả:</p>
            <p className="text-green-700">✅ Đã tạo: {result.created} tài khoản</p>
            {result.skipped > 0 && <p className="text-amber-600">⚠️ Bỏ qua: {result.skipped}</p>}
            {result.createdStudents?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-royal mb-1">Danh sách tài khoản đã tạo (lưu lại để phát cho HS):</p>
                <div className="max-h-[180px] overflow-auto rounded border border-silver/30 bg-white">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-cream border-b border-silver/20">
                      <th className="px-2 py-1.5 text-left text-muted">Mã HV (đăng nhập)</th>
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