// FILE: src/app/(protected)/bao-cao/dinh-ky/[id]/page.tsx — Sửa báo cáo định kỳ
"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Send, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import ReportGrid, { ReportGridData, makeEmptyGrid } from "@/components/report/ReportGrid";

export default function EditReportPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [course, setCourse] = useState("");
  const [learnclickUser, setLearnclickUser] = useState("");
  const [padletAccount, setPadletAccount] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [dataFrom, setDataFrom] = useState("");
  const [dataTo, setDataTo] = useState("");
  const [grid, setGrid] = useState<ReportGridData>(makeEmptyGrid());
  const [note, setNote] = useState({ strengths: "", reminders: "", homework: "", attitude: "" });
  const [saving, setSaving] = useState(false);

  // cắt ISO date "2026-06-08T00:00:00.000Z" → "2026-06-08" cho input[type=date]
  const toDateInput = (d: string | null) => (d ? d.slice(0, 10) : "");

  useEffect(() => {
    (async () => {
      const data = await api.get(`/reports/${id}`);
      if (data.success) {
        const r = data.data;
        setStudentName(r.student?.fullName || "");
        setStudentCode(r.student?.studentCode || "");
        setCourse(r.course || "");
        setLearnclickUser(r.learnclickUser || "");
        setPadletAccount(r.padletAccount || "");
        setPeriodTo(toDateInput(r.periodTo));
        setDataFrom(toDateInput(r.dataFrom));
        setDataTo(toDateInput(r.dataTo));
        if (r.grid && Array.isArray(r.grid.units)) setGrid(r.grid);
        if (r.teacherNote) setNote({
          strengths: r.teacherNote.strengths || "",
          reminders: r.teacherNote.reminders || "",
          homework: r.teacherNote.homework || "",
          attitude: r.teacherNote.attitude || "",
        });
      } else {
        alert(data.message || "Không tải được báo cáo");
        router.push("/bao-cao/dinh-ky");
      }
      setLoading(false);
    })();
  }, [id, router]);

  async function handleSave(status: "DRAFT" | "PUBLISHED") {
    setSaving(true);
    const data = await api.put(`/reports/${id}`, {
      course, learnclickUser, padletAccount,
      periodTo: periodTo || null,
      dataFrom: dataFrom || null,
      dataTo: dataTo || null,
      grid,
      teacherNote: note,
      status,
    });
    setSaving(false);
    if (data.success) router.push("/bao-cao/dinh-ky");
    else alert(data.message || "Lỗi cập nhật báo cáo");
  }

  const NOTE_FIELDS: { key: keyof typeof note; label: string; placeholder: string }[] = [
    { key: "strengths", label: "Điểm mạnh", placeholder: "Những điểm học sinh làm tốt..." },
    { key: "reminders", label: "Nhắc nhở cần xử lý ngay", placeholder: "Vấn đề cần khắc phục sớm..." },
    { key: "homework", label: "Bài tập về nhà", placeholder: "Giao bài, link cần hoàn thành..." },
    { key: "attitude", label: "Thái độ học tập & ghi bài", placeholder: "Nhận xét thái độ, ghi chép..." },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-gold" /></div>;
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link href="/bao-cao/dinh-ky" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal">
        <ArrowLeft size={15} />Quay lại
      </Link>
      <h2 className="mb-1 font-display text-2xl font-bold text-royal">✏️ Sửa Báo Cáo Định Kỳ</h2>
      <p className="mb-6 text-sm text-muted">{studentName} {studentCode ? `(${studentCode})` : ""}</p>

      {/* Thông tin chung */}
      <div className="card mb-6">
        <h3 className="mb-4 font-display text-lg font-bold text-royal">Thông tin chung</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Lớp / Khoá</label>
            <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="7+" className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Username LearnClick</label>
            <input type="text" value={learnclickUser} onChange={(e) => setLearnclickUser(e.target.value)} placeholder="tranbaolong11" className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Tài khoản Padlet</label>
            <input type="text" value={padletAccount} onChange={(e) => setPadletAccount(e.target.value)} placeholder="Vở học tập" className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Kỳ báo cáo (đến ngày)</label>
            <input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-2 md:col-span-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Dữ liệu từ</label>
              <input type="date" value={dataFrom} onChange={(e) => setDataFrom(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">đến</label>
              <input type="date" value={dataTo} onChange={(e) => setDataTo(e.target.value)} className="input-field" />
            </div>
          </div>
        </div>
      </div>

      {/* Lưới điểm */}
      <div className="card mb-6">
        <h3 className="mb-1 font-display text-lg font-bold text-royal">Theo dõi LearnClick theo lộ trình</h3>
        <p className="mb-4 text-sm text-muted">Bấm vào ô để thêm bài và nhập điểm.</p>
        <ReportGrid value={grid} onChange={setGrid} />
      </div>

      {/* Nhận xét */}
      <div className="card mb-6">
        <h3 className="mb-4 font-display text-lg font-bold text-royal">Nhận xét của giáo viên</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {NOTE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">{f.label}</label>
              <textarea value={note[f.key]} onChange={(e) => setNote({ ...note, [f.key]: e.target.value })}
                placeholder={f.placeholder} rows={3} className="input-field resize-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-silver/20 pt-6">
        <Link href="/bao-cao/dinh-ky" className="btn-secondary">Huỷ</Link>
        <button onClick={() => handleSave("DRAFT")} disabled={saving} className="btn-secondary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Lưu nháp
        </button>
        <button onClick={() => handleSave("PUBLISHED")} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}Lưu & Xuất bản
        </button>
      </div>
    </div>
  );
}