// FILE: src/app/(protected)/tai-khoan/hoc-vien/import/page.tsx — Import HV (Trình độ + Lớp + Ngày ĐK)
"use client";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, FileSpreadsheet, FileText, Download, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLevels } from "@/lib/useLevels";
interface StudentRow {
  fullName: string; course: string; className: string; startDate: string;
  phone: string; email: string; address: string;
}
// Chuẩn hoá ngày về YYYY-MM-DD để backend dựng mã đúng ngày.
function normalizeDate(v: any): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return "";
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, dd, mm, yy] = m;
    if (yy.length === 2) yy = "20" + yy;
    return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return s;
}
const normClass = (s: string) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
export default function ImportStudentsPage() {
  const COURSES = useLevels();
  const [classNames, setClassNames] = useState<string[]>([]); // tên lớp trong hệ thống (để cảnh báo)
  const [mode, setMode] = useState<"text" | "excel">("excel");
  const [text, setText] = useState("");
  const [excelData, setExcelData] = useState<StudentRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Tải danh sách lớp để đối chiếu cột "Lớp"
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/classes");
        if (r.success) setClassNames((r.data || []).map((c: any) => c.name).filter(Boolean));
      } catch { /* bỏ qua */ }
    })();
  }, []);
  const knownClassSet = new Set(classNames.map(normClass));
  function clearFile() {
    setFileName(""); setExcelData([]); setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }
  function clearText() { setText(""); setResult(null); }
  function switchMode(m: "text" | "excel") {
    if (m === mode) return;
    setMode(m); setResult(null);
    if (m === "excel") setText(""); else clearFile();
  }
  // Dán văn bản — thứ tự cột: Họ tên, Trình độ, Lớp, Ngày ĐK, SĐT, Email, Địa chỉ
  function parseText(): StudentRow[] {
    return text.trim().split("\n").filter(Boolean).map((line) => {
      const p = line.split(/[\t,;|]+/).map((s) => s.trim());
      return {
        fullName: p[0] || "", course: p[1] || "", className: p[2] || "",
        startDate: normalizeDate(p[3] || ""),
        phone: p[4] || "", email: p[5] || "", address: p[6] || "",
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
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true });
      const parsed: StudentRow[] = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[0]) continue;
        parsed.push({
          fullName: String(r[0] || "").trim(),
          course: String(r[1] || "").trim(),
          className: String(r[2] || "").trim(),
          startDate: normalizeDate(r[3]),
          phone: r[4] === undefined || r[4] === null ? "" : String(r[4]).trim(),
          email: String(r[5] || "").trim(),
          address: String(r[6] || "").trim(),
        });
      }
      setExcelData(parsed.filter((s) => s.fullName));
    } catch (err) { console.error(err); setExcelData([]); }
    e.target.value = "";
  }
  // Tải mẫu Excel — 7 cột
  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const header = ["Họ tên", "Trình độ", "Lớp", "Ngày đăng ký", "SĐT", "Email", "Địa chỉ"];
    const sample = [
      ["Lê Hương Ly", COURSES[0] || "7+", classNames[0] || "7+0726", "17/07/2026", "0912345678", "ly@gmail.com", "123 Hoàng Quốc Việt, HN"],
      ["Trần Gia Huy", COURSES[0] || "7+", "", "17/07/2026", "0987654321", "", ""],
    ];
    const ws = XLSX.utils.aoa_to_sheet([header, ...sample]);
    ws["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 28 }];
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
  const unknownClass = preview.filter((s) => s.className && knownClassSet.size > 0 && !knownClassSet.has(normClass(s.className)));
  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/tai-khoan/hoc-vien" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <h2 className="font-display text-2xl font-bold text-royal">Import học viên hàng loạt</h2>
      </div>

      {/* Chọn chế độ */}
      <div className="mb-5 flex gap-1 rounded-xl border border-silver/30 bg-white p-1">
        <button onClick={() => switchMode("excel")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${mode === "excel" ? "bg-royal text-white" : "text-muted hover:bg-cream-dark"}`}>
          <FileSpreadsheet size={16} />Upload Excel
        </button>
        <button onClick={() => switchMode("text")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${mode === "text" ? "bg-royal text-white" : "text-muted hover:bg-cream-dark"}`}>
          <FileText size={16} />Dán văn bản
        </button>
      </div>

      <div className="card space-y-4">
        {/* Format hint */}
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <p className="font-bold">Format: 7 cột (đúng thứ tự)</p>
          <p className="mt-0.5 text-xs">Họ tên*, <b>Trình độ*</b>, <b>Lớp</b>, Ngày đăng ký*, SĐT, Email, Địa chỉ</p>
          <p className="mt-1 text-xs">
            Mã HV tự sinh theo <b>tên + trình độ + ngày</b> (vd <code>lehuongly7240726</code>). Cột <b>Lớp</b> để xếp HS vào lớp cụ thể (khớp theo tên lớp trong Quản lý lớp học); để trống nếu chưa xếp. Mật khẩu = <b>SĐT</b>. Ngày dạng <b>dd/mm/yyyy</b>. Chỉ Họ tên/Trình độ/Ngày bắt buộc.
          </p>
          <button onClick={downloadTemplate} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-royal hover:bg-cream">
            <Download size={13} />Tải mẫu
          </button>
        </div>

        {/* Input area */}
        {mode === "text" ? (
          <>
            <textarea value={text} onChange={(e) => { setText(e.target.value); setResult(null); }} rows={10}
              placeholder={"Dán mỗi HV 1 dòng, các cột cách nhau bằng dấu phẩy/tab:\nLê Hương Ly, 7+, 7+0726, 17/07/2026, 0912345678, ly@gmail.com, 123 HQV HN\nTrần Gia Huy, 5+, , 17/07/2026, 0987654321"}
              className="input-field font-mono text-xs" />
            {text.trim() && (
              <button onClick={clearText} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-red-600">
                <Trash2 size={13} />Xoá nội dung đã dán
              </button>
            )}
          </>
        ) : (
          <>
            {fileName ? (
              <div className="flex items-center justify-between rounded-lg border border-silver/30 bg-cream px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-royal"><FileSpreadsheet size={16} />{fileName}</span>
                <button onClick={clearFile} className="text-muted hover:text-red-600"><X size={16} /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-silver/40 bg-cream px-4 py-10 text-muted hover:border-gold/40 hover:bg-gold/5">
                <FileSpreadsheet size={28} />
                <div className="text-center">
                  <p className="text-sm font-semibold text-royal">Chọn file Excel (.xlsx)</p>
                  <p className="text-xs">7 cột: Họ tên, Trình độ, Lớp, Ngày ĐK, SĐT, Email, Địa chỉ</p>
                </div>
              </button>
            )}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcel} />
          </>
        )}

        {/* Cảnh báo trình độ lạ */}
        {unknownCourse.length > 0 && (
          <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
            ⚠️ {unknownCourse.length} dòng có <b>trình độ lạ</b> (không khớp danh sách trình độ):
            {" "}<b>{[...new Set(unknownCourse.map((s) => s.course))].join(", ")}</b>.
            Vẫn import được, nhưng kiểm tra lại kẻo mã HV sinh ra sai.
          </div>
        )}
        {/* Cảnh báo lớp lạ */}
        {unknownClass.length > 0 && (
          <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
            ⚠️ {unknownClass.length} dòng có <b>tên lớp không có trong hệ thống</b>:
            {" "}<b>{[...new Set(unknownClass.map((s) => s.className))].join(", ")}</b>.
            Các HV này vẫn được tạo nhưng <b>chưa xếp vào lớp</b>. Kiểm tra lại tên lớp (phải trùng tên trong mục Quản lý lớp học) hoặc tạo lớp trước.
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
                  <th className="px-2 py-2 text-muted">Trình độ</th>
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
                    <td className="px-2 py-1.5">
                      {s.className
                        ? <span className={!knownClassSet.size || knownClassSet.has(normClass(s.className)) ? "text-muted" : "font-semibold text-amber-600"}>{s.className}</span>
                        : <span className="text-muted">—</span>}
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
            <p className="text-green-700">✅ Đã tạo: {result.created} tài khoản{result.enrolled != null ? ` · xếp lớp: ${result.enrolled}` : ""}</p>
            {result.skipped > 0 && <p className="text-amber-600">⚠️ Bỏ qua: {result.skipped}</p>}
            {result.warnings?.length > 0 && (
              <ul className="list-disc pl-5 text-xs text-amber-700">
                {result.warnings.slice(0, 10).map((w: string, i: number) => <li key={i}>{w}</li>)}
                {result.warnings.length > 10 && <li>... và {result.warnings.length - 10} cảnh báo nữa</li>}
              </ul>
            )}
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