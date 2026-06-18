// FILE: src/app/(protected)/bao-cao/cuoi-khoa/[id]/page.tsx — Sửa báo cáo cuối khóa
"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Send, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import SkillGrid, { SkillGridData, makeEmptySkillGrid } from "@/components/report/SkillGrid";

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

const emptyBand = () => ({ band: "", sub: "" });

export default function EditFinalReportPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [course, setCourse] = useState("");
  const [learnclickUser, setLearnclickUser] = useState("");
  const [grid, setGrid] = useState<SkillGridData>(makeEmptySkillGrid());
  const [review, setReview] = useState<Record<string, string>>({
    quickSummary: "", reading: "", listening: "", writingT1: "", writingT2: "", speaking: "", notebook: "",
  });
  const [prediction, setPrediction] = useState<any>({
    listening: emptyBand(), reading: emptyBand(), writing: emptyBand(), speaking: emptyBand(), overall: emptyBand(), note: "",
  });
  const [orientation, setOrientation] = useState({ advice: "", classInfo: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await api.get(`/final-reports/${id}`);
      if (res.success) {
        const r = res.data;
        setStudentName(r.student?.fullName || "");
        setStudentCode(r.student?.studentCode || "");
        setCourse(r.course || "");
        setLearnclickUser(r.learnclickUser || "");
        if (r.skillGrid && Array.isArray(r.skillGrid.units)) setGrid(r.skillGrid);
        if (r.review) setReview({ quickSummary: "", reading: "", listening: "", writingT1: "", writingT2: "", speaking: "", notebook: "", ...r.review });
        if (r.prediction) setPrediction({
          listening: r.prediction.listening || emptyBand(),
          reading: r.prediction.reading || emptyBand(),
          writing: r.prediction.writing || emptyBand(),
          speaking: r.prediction.speaking || emptyBand(),
          overall: r.prediction.overall || emptyBand(),
          note: r.prediction.note || "",
        });
        if (r.orientation) setOrientation({ advice: r.orientation.advice || "", classInfo: r.orientation.classInfo || "" });
      } else {
        alert(res.message || "Không tải được báo cáo");
        router.push("/bao-cao/cuoi-khoa");
      }
      setLoading(false);
    })();
  }, [id, router]);

  function setBand(skill: string, field: "band" | "sub", val: string) {
    setPrediction((p: any) => ({ ...p, [skill]: { ...p[skill], [field]: val } }));
  }

  async function handleSave(status: "DRAFT" | "PUBLISHED") {
    setSaving(true);
    const data = await api.put(`/final-reports/${id}`, {
      course, learnclickUser, skillGrid: grid, review, prediction, orientation, status,
    });
    setSaving(false);
    if (data.success) router.push("/bao-cao/cuoi-khoa");
    else alert(data.message || "Lỗi cập nhật báo cáo");
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gold" /></div>;

  return (
    <div className="mx-auto max-w-[1300px]">
      <Link href="/bao-cao/cuoi-khoa" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-royal">
        <ArrowLeft size={15} />Quay lại
      </Link>
      <h2 className="mb-1 font-display text-2xl font-bold text-royal">✏️ Sửa Báo Cáo Cuối Khóa</h2>
      <p className="mb-6 text-sm text-muted">{studentName} {studentCode ? `(${studentCode})` : ""}</p>

      <div className="card mb-6">
        <h3 className="mb-4 font-display text-lg font-bold text-royal">Thông tin chung</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Lớp / Khoá</label>
            <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="7+" className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Username LearnClick</label>
            <input type="text" value={learnclickUser} onChange={(e) => setLearnclickUser(e.target.value)} className="input-field" />
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="mb-1 font-display text-lg font-bold text-royal">Quá trình tích lũy kĩ năng</h3>
        <p className="mb-4 text-sm text-muted">Bấm vào ô để nhập điểm. Cột "Đánh giá" tự tính (sửa tay được).</p>
        <SkillGrid value={grid} onChange={setGrid} />
      </div>

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
            rows={3} className="input-field resize-none" />
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="mb-4 font-display text-lg font-bold text-royal">Định hướng sau khóa học</h3>
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