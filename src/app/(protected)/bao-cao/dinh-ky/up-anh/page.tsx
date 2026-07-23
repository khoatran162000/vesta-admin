// FILE: src/app/(protected)/bao-cao/dinh-ky/up-anh/page.tsx — Up ảnh báo cáo hàng loạt (tự khớp tên file → học sinh)
"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Loader2, Send, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { api } from "@/lib/api";
const API_URL = process.env.NEXT_PUBLIC_API_URL;
function getToken() { return localStorage.getItem("accessToken") || ""; }

interface Student { id: string; fullName: string; studentCode: string | null; course: string | null; }
interface Row {
  file: File; preview: string; guess: string;
  studentId: string; ambiguous: boolean;
  status: "" | "running" | "done" | "error"; message?: string;
}

// Bỏ dấu + chuẩn hoá để so khớp tên
function normName(s: string): string {
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
// "03_dinh-ngoc-anh.png" → "dinh ngoc anh"
function nameFromFile(filename: string): string {
  let n = filename.replace(/\.[^.]+$/, "");
  n = n.replace(/^\s*\d+\s*[_\-.]\s*/, "");
  return normName(n);
}

export default function UploadReportImagesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [course, setCourse] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [running, setRunning] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const res = await api.get("/users?role=STUDENT&limit=1000");
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : (res.data?.users || res.data?.items || []);
        setStudents(list);
      }
    })();
  }, []);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const next: Row[] = files.map((f) => {
      const guess = nameFromFile(f.name);
      const hits = students.filter((s) => normName(s.fullName) === guess);
      return {
        file: f,
        preview: URL.createObjectURL(f),
        guess,
        studentId: hits.length === 1 ? hits[0].id : "",
        ambiguous: hits.length > 1,
        status: "" as const,
      };
    });
    setRows(next);
    setDoneCount(0);
    e.target.value = "";
  }

  function setRowStudent(i: number, id: string) {
    setRows((prev) => prev.map((r, x) => (x === i ? { ...r, studentId: id, ambiguous: false } : r)));
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, x) => x !== i));
  }

  const matched = rows.filter((r) => r.studentId).length;
  const unmatched = rows.length - matched;

  async function handleRun(status: "DRAFT" | "PUBLISHED") {
    if (rows.length === 0) return alert("Chưa chọn ảnh nào");
    if (unmatched > 0 && !confirm(`Còn ${unmatched} ảnh chưa chọn học sinh — các ảnh này sẽ bị bỏ qua. Tiếp tục?`)) return;
    setRunning(true);
    setDoneCount(0);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.studentId) continue;
      setRows((prev) => prev.map((x, idx) => (idx === i ? { ...x, status: "running" } : x)));
      try {
        // 1) upload ảnh
        const fd = new FormData();
        fd.append("image", r.file);
        const upRes = await fetch(`${API_URL}/reports/upload-image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: fd,
        });
        const upJson = await upRes.json();
        if (!upJson.success) throw new Error(upJson.message || "Lỗi upload ảnh");
        // 2) tạo báo cáo với ảnh đó
        const st = students.find((s) => s.id === r.studentId);
        const payload: any = {
          studentId: r.studentId,
          imageUrl: upJson.data.url,
          course: course || st?.course || null,
          periodTo: periodTo || null,
          grid: null,
          html: "",
          status,
        };
        const crRes = await api.post("/reports", payload);
        if (!crRes.success) throw new Error(crRes.message || "Lỗi tạo báo cáo");
        setRows((prev) => prev.map((x, idx) => (idx === i ? { ...x, status: "done" } : x)));
        setDoneCount((c) => c + 1);
      } catch (e: any) {
        setRows((prev) => prev.map((x, idx) => (idx === i ? { ...x, status: "error", message: e.message } : x)));
      }
    }
    setRunning(false);
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/bao-cao/dinh-ky" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">Up ảnh báo cáo hàng loạt</h2>
          <p className="text-sm text-muted">Chọn nhiều ảnh — hệ thống tự khớp tên file với học sinh, chị soát lại rồi lưu một lần.</p>
        </div>
      </div>

      {/* Thông tin chung */}
      <div className="card mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-royal">Lớp / khoá (áp cho tất cả)</label>
          <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="vd: 6+ (bỏ trống = theo lớp của từng HS)" className="input-field" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-royal">Kỳ báo cáo đến ngày</label>
          <input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className="input-field" />
        </div>
      </div>

      {/* Chọn ảnh */}
      <div className="card mb-5">
        <button onClick={() => fileRef.current?.click()} disabled={running}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-silver/40 bg-cream py-8 text-sm font-semibold text-muted hover:border-gold/50 hover:text-royal disabled:opacity-50">
          <ImagePlus size={22} />Chọn ảnh báo cáo (chọn được nhiều ảnh cùng lúc)
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        {rows.length > 0 && (
          <p className="mt-3 text-sm text-muted">
            Đã chọn <strong className="text-royal">{rows.length}</strong> ảnh — khớp được <strong className="text-green-600">{matched}</strong>
            {unmatched > 0 && <> · chưa khớp <strong className="text-amber-600">{unmatched}</strong></>}
          </p>
        )}
      </div>

      {/* Bảng soát */}
      {rows.length > 0 && (
        <div className="card !p-0 mb-5 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-silver/20 bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">Ảnh</th>
              <th className="px-4 py-3 font-semibold text-royal">Tên file</th>
              <th className="px-4 py-3 font-semibold text-royal">Học sinh</th>
              <th className="px-4 py-3 font-semibold text-royal">Kết quả</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={i} className={`border-b border-silver/10 ${!r.studentId ? "bg-amber-50/60" : ""}`}>
                <td className="px-4 py-2"><img src={r.preview} alt="" className="h-12 w-16 rounded border object-cover" /></td>
                <td className="px-4 py-2">
                  <div className="text-xs text-[#1a1a2e]">{r.file.name}</div>
                  {r.ambiguous && <div className="text-[0.65rem] text-amber-700">Trùng nhiều HS — chị chọn tay</div>}
                </td>
                <td className="px-4 py-2">
                  <select value={r.studentId} onChange={(e) => setRowStudent(i, e.target.value)} disabled={running}
                    className={`input-field !py-1.5 !text-xs ${!r.studentId ? "border-amber-400" : ""}`}>
                    <option value="">— chọn học sinh —</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName}{s.course ? ` (${s.course})` : ""}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  {r.status === "running" && <Loader2 size={15} className="animate-spin text-gold" />}
                  {r.status === "done" && <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600"><CheckCircle2 size={13} />Đã lưu</span>}
                  {r.status === "error" && <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600" title={r.message}><AlertTriangle size={13} />Lỗi</span>}
                </td>
                <td className="px-4 py-2 text-right">
                  {!running && <button onClick={() => removeRow(i)} className="text-muted hover:text-red-500"><X size={15} /></button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Nút lưu */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-silver/20 pt-5">
          <p className="text-sm text-muted">{running ? `Đang lưu... ${doneCount}/${matched}` : doneCount > 0 ? `Đã lưu ${doneCount}/${matched} báo cáo.` : ""}</p>
          <div className="flex gap-3">
            <button onClick={() => handleRun("DRAFT")} disabled={running || matched === 0} className="btn-secondary">
              {running ? <Loader2 size={14} className="animate-spin" /> : null}Lưu bản nháp
            </button>
            <button onClick={() => handleRun("PUBLISHED")} disabled={running || matched === 0} className="btn-primary">
              {running ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}Xuất bản cho học sinh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}