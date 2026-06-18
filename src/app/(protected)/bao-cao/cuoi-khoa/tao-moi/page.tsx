// FILE: src/app/(protected)/bao-cao/cuoi-khoa/tao-moi/page.tsx — Tạo báo cáo cuối khóa
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Send, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import SkillGrid, { SkillGridData, makeEmptySkillGrid } from "@/components/report/SkillGrid";
import { DEFAULT_ADVICE, DEFAULT_CLASS_INFO } from "@/components/report/finalReportDefaults";

interface Student { id: string; fullName: string; studentCode: string | null; course: string | null; }

const SKILL_BANDS = [
  { key: "listening", label: "Nghe (Listening)" },
  { key: "reading", label: "Đọc (Reading)" },
  { key: "writing", label: "Viết (Writing)" },
  { key: "speaking", label: "Nói (Speaking)" },
  { key: "overall", label: "Overall (Tổng)" },
] as const;

const REVIEW_FIELDS: { key: string; label: string; full?: boolean }[] = [
  { key: "quickSummary", label: "Tổng kết nhanh", full: true },
  { key: "reading", label: "Reading" },
  { key: "listening", label: "Listening" },
  { key: "writingT1", label: "Writing Task 1" },
  { key: "writingT2", label: "Writing Task 2" },
  { key: "speaking", label: "Speaking" },
  { key: "notebook", label: "Vở ghi", full: true },
];

export default function CreateFinalReportPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [course, setCourse] = useState("");
  const [learnclickUser, setLearnclickUser] = useState("");
  const [grid, setGrid] = useState<SkillGridData>(makeEmptySkillGrid());
  const [review, setReview] = useState<Record<string, string>>({
    quickSummary: "", reading: "", listening: "", writingT1: "", writingT2: "", speaking: "", notebook: "",
  });
  const [prediction, setPrediction] = useState<any>({
    listening: { band: "", sub: "" }, reading: { band: "", sub: "" },
    writing: { band: "", sub: "" }, speaking: { band: "", sub: "" },
    overall: { band: "", sub: "" }, note: "",
  });
  const [orientation, setOrientation] = useState({ advice: DEFAULT_ADVICE, classInfo: DEFAULT_CLASS_INFO });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await api.get("/users?role=STUDENT&limit=1000");
      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : (data.data?.users || []);
        setStudents(list);
      }
    })();
  }, []);

  function onSelectStudent(id: string) {
    setStudentId(id);
    const s = students.find((x) => x.id === id);
    if (s?.course) setCourse(s.course);
  }

  function setBand(skill: string, field: "band" | "sub", val: string) {
    setPrediction((p: any) => ({ ...p, [skill]: { ...p[skill], [field]: val } }));
  }

  async function handleSave(status: "DRAFT" | "PUBLISHED") {
    if (!studentId) return alert("Vui lòng chọn học sinh");
    setSaving(true);
    const data = await api.post("/final-reports", {
      studentId, course, learnclickUser,
      skillGrid: grid, review, prediction, orientation, status,
    });
    setSaving(false);
    if (data.success) router.push("/bao-cao/cuoi-khoa");
    else alert(data.message || "Lỗi tạo báo cáo");
  }

  return (
    <div className="mx-auto max-w-[1300px]">
      <Link href="/bao-cao/cuoi-khoa" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal">
        <ArrowLeft size={15} />Quay lại
      </Link>
      <h2 className="mb-6 font-display text-2xl font-bold text-royal">🎓 Tạo Báo Cáo Cuối Khóa</h2>

      {/* Thông tin chung */}
      <div className="card mb-6">
        <h3 className="mb-4 font-display text-lg font-bold text-royal">Thông tin chung</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Học sinh</label>
            <select value={studentId} onChange={(e) => onSelectStudent(e.target.value)} className="input-field">
              <option value="">— Chọn học sinh —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.fullName} {s.studentCode ? `(${s.studentCode})` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Lớp / Khoá</label>
            <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="7+" className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Username LearnClick</label>
            <input type="text" value={learnclickUser} onChange={(e) => setLearnclickUser(e.target.value)} placeholder="leminhvu11" className="input-field" />
          </div>
        </div>
      </div>

      {/* Bảng kỹ năng */}
      <div className="card mb-6">
        <h3 className="mb-1 font-display text-lg font-bold text-royal">Quá trình tích lũy kĩ năng</h3>
        <p className="mb-4 text-sm text-muted">Bấm vào ô để nhập điểm từng kỹ năng. Cột "Đánh giá" tự tính trung bình (sửa tay được).</p>
        <SkillGrid value={grid} onChange={setGrid} />
      </div>

      {/* Nhận xét cuối khóa */}
      <div className="card mb-6">
        <h3 className="mb-4 font-display text-lg font-bold text-royal">Nhận xét cuối khóa</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {REVIEW_FIELDS.map((f) => (
            <div key={f.key} className={f.full ? "md:col-span-2" : ""}>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">{f.label}</label>
              <textarea value={review[f.key]} onChange={(e) => setReview({ ...review, [f.key]: e.target.value })}
                rows={f.full ? 3 : 2} className="input-field resize-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Điểm dự đoán */}
      <div className="card mb-6">
        <h3 className="mb-4 font-display text-lg font-bold text-royal">Điểm dự đoán cuối khóa</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {SKILL_BANDS.map((s) => (
            <div key={s.key} className="rounded-lg border border-silver/30 p-3">
              <div className="mb-2 text-xs font-bold uppercase text-royal">{s.label}</div>
              <input type="text" value={prediction[s.key].band} onChange={(e) => setBand(s.key, "band", e.target.value)}
                placeholder="7.0–7.5" className="input-field mb-2 text-center text-lg font-bold" />
              <input type="text" value={prediction[s.key].sub} onChange={(e) => setBand(s.key, "sub", e.target.value)}
                placeholder="Ghi chú ngắn" className="input-field text-xs" />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Ghi chú dự đoán (đoạn dài)</label>
          <textarea value={prediction.note} onChange={(e) => setPrediction({ ...prediction, note: e.target.value })}
            rows={3} className="input-field resize-none" placeholder="Phân tích chi tiết về điểm dự đoán..." />
        </div>
      </div>

      {/* Định hướng */}
      <div className="card mb-6">
        <h3 className="mb-1 font-display text-lg font-bold text-royal">Định hướng sau khóa học</h3>
        <p className="mb-4 text-sm text-muted">Đã điền sẵn mẫu chung — chỉnh sửa riêng cho học sinh này nếu cần.</p>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Lời khuyên / định hướng</label>
            <textarea value={orientation.advice} onChange={(e) => setOrientation({ ...orientation, advice: e.target.value })}
              rows={4} className="input-field resize-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Thông tin lớp luyện đề</label>
            <textarea value={orientation.classInfo} onChange={(e) => setOrientation({ ...orientation, classInfo: e.target.value })}
              rows={6} className="input-field resize-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-silver/20 pt-6">
        <Link href="/bao-cao/cuoi-khoa" className="btn-secondary">Huỷ</Link>
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