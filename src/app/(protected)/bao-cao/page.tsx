// FILE: src/app/(protected)/bao-cao/page.tsx — Báo cáo kết quả học viên
"use client";
import { useState, useEffect, useCallback } from "react";
import { Loader2, Download, TrendingUp, Award, FileText, BookOpen } from "lucide-react";
import { api } from "@/lib/api";

const COURSES = ["5+", "6+", "7+", "1-1", "Intensive", "Writing", "Chuyên Cấp 3"];

export default function ReportPage() {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "exam" | "feedback">("exam");

  const loadReport = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCourse) params.set("course", filterCourse);
    const data = await api.get(`/schedule/reports/students?${params}`);
    if (data.success) setReport(data.data || []);
    setLoading(false);
  }, [filterCourse]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const sorted = [...report].sort((a, b) => {
    if (sortBy === "name") return (a.fullName || "").localeCompare(b.fullName || "");
    if (sortBy === "exam") return (b.avgExamScore || 0) - (a.avgExamScore || 0);
    if (sortBy === "feedback") return (b.avgFeedbackScore || 0) - (a.avgFeedbackScore || 0);
    return 0;
  });

  const validExam = report.filter((s) => s.avgExamScore !== null);
  const overview = {
    totalStudents: report.length,
    activeStudents: report.filter((s) => s.totalExams > 0 || s.totalInteractive > 0).length,
    avgExam: validExam.length > 0
      ? Math.round(validExam.reduce((sum, s) => sum + (s.avgExamScore || 0), 0) / validExam.length)
      : 0,
    topStudents: report.filter((s) => (s.avgExamScore || 0) >= 70).length,
  };

  function downloadCSV() {
    const csv = "Họ tên,Mã HV,Khoá,Bài thi đã làm,Điểm TB,Điểm cao nhất,Bài viết được chấm,Điểm TB viết,Bài tập tương tác,Điểm TB tương tác\n" +
      sorted.map((s) => [
        s.fullName, s.studentCode, s.course || "",
        s.totalExams, s.avgExamScore ?? "", s.highestExam ?? "",
        s.totalFeedback, s.avgFeedbackScore ?? "",
        s.totalInteractive, s.avgInteractiveScore ?? "",
      ].map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-hoc-vien-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">📊 Báo Cáo Kết Quả Học Viên</h2>
          <p className="mt-1 text-sm text-muted">Tổng hợp điểm thi, chấm bài, bài tập tương tác</p>
        </div>
        <button onClick={downloadCSV} className="btn-primary">
          <Download size={14} />Tải Excel
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: BookOpen, label: "Tổng HV", value: overview.totalStudents, color: "#0F1B3D" },
          { icon: TrendingUp, label: "Đang hoạt động", value: overview.activeStudents, color: "#22c55e" },
          { icon: Award, label: "Điểm TB", value: `${overview.avgExam}%`, color: "#C9A84C" },
          { icon: FileText, label: "Đạt 7.0+", value: overview.topStudents, color: "#C93040" },
        ].map((s, i) => (
          <div key={i} className="card">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${s.color}15` }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-bold text-[#1a1a2e]">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}
          className="rounded-lg border border-silver/40 bg-white px-4 py-2 text-sm outline-none focus:border-gold">
          <option value="">Tất cả khoá</option>
          {COURSES.map((c) => <option key={c} value={c}>Khoá {c}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
          className="rounded-lg border border-silver/40 bg-white px-4 py-2 text-sm outline-none focus:border-gold">
          <option value="exam">Sắp theo điểm thi</option>
          <option value="feedback">Sắp theo điểm chấm</option>
          <option value="name">Sắp theo tên</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-silver/30 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">Chưa có dữ liệu.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-3 py-3 font-semibold text-royal">#</th>
              <th className="px-3 py-3 font-semibold text-royal">Họ tên</th>
              <th className="px-3 py-3 font-semibold text-royal">Mã HV</th>
              <th className="px-3 py-3 font-semibold text-royal">Khoá</th>
              <th className="px-3 py-3 text-center font-semibold text-royal">Bài thi</th>
              <th className="px-3 py-3 text-center font-semibold text-royal">Điểm TB</th>
              <th className="px-3 py-3 text-center font-semibold text-royal">Cao nhất</th>
              <th className="px-3 py-3 text-center font-semibold text-royal">Bài chấm</th>
              <th className="px-3 py-3 text-center font-semibold text-royal">Điểm GV</th>
              <th className="px-3 py-3 text-center font-semibold text-royal">Bài tương tác</th>
            </tr></thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={s.id} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-3 py-3 text-muted">{i + 1}</td>
                  <td className="px-3 py-3 font-medium text-[#1a1a2e]">{s.fullName}</td>
                  <td className="px-3 py-3 font-mono text-xs text-royal">{s.studentCode || "—"}</td>
                  <td className="px-3 py-3">
                    {s.course && <span className="rounded-full bg-royal/8 px-2 py-0.5 text-[0.65rem] font-semibold text-royal">{s.course}</span>}
                  </td>
                  <td className="px-3 py-3 text-center text-muted">{s.totalExams}</td>
                  <td className="px-3 py-3 text-center">
                    {s.avgExamScore !== null ? (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.avgExamScore >= 70 ? "bg-green-50 text-green-700" : s.avgExamScore >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                        {s.avgExamScore}%
                      </span>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-[#1a1a2e]">{s.highestExam ?? "—"}</td>
                  <td className="px-3 py-3 text-center text-muted">{s.totalFeedback}</td>
                  <td className="px-3 py-3 text-center font-bold text-gold">{s.avgFeedbackScore ?? "—"}</td>
                  <td className="px-3 py-3 text-center text-muted">
                    {s.totalInteractive > 0 ? `${s.totalInteractive} (${s.avgInteractiveScore || 0}%)` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
