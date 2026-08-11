// FILE: src/app/(protected)/thong-bao/gui-moi/page.tsx — Gui thong bao (tat ca / chon nguoi / chon ca lop)
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Search, Check, Users, Plus } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import NotificationEditor from "@/components/NotificationEditor";

interface Student { id: string; fullName: string; email?: string | null; studentCode?: string | null; course?: string | null; }
interface ClassItem { id: string; name: string; classCode?: string | null; course?: string | null; }

export default function SendNotificationPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const flushRef = useRef<(() => string) | null>(null);
  const [mode, setMode] = useState<"all" | "select">("all");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  // chọn theo lớp
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classId, setClassId] = useState("");
  const [addingClass, setAddingClass] = useState(false);
  const [classNote, setClassNote] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (mode === "select") {
      // all=true → lấy TOÀN BỘ học viên (không phân trang, không lọc ẩn)
      api.get("/users?role=STUDENT&all=true").then((data) => {
        if (data.success) setStudents(data.data || []);
      });
      // danh sách lớp để chọn cả lớp
      api.get("/classes").then((data) => {
        if (data.success) setClasses(data.data || []);
      });
    }
  }, [mode]);

  function toggleStudent(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function selectAll() {
    if (selectedIds.length === filteredStudents.length) setSelectedIds([]);
    else setSelectedIds(filteredStudents.map((s) => s.id));
  }

  // Thêm cả lớp: lấy HV trong lớp qua GET /classes/:id → enrollments[].student
  async function addWholeClass() {
    if (!classId) return;
    setAddingClass(true); setClassNote("");
    try {
      const res = await api.get(`/classes/${classId}`);
      if (res.success && res.data?.enrollments) {
        const ids: string[] = res.data.enrollments
          .map((e: any) => e.student?.id)
          .filter(Boolean);
        // gộp vào danh sách đã chọn (không trùng), đồng thời đảm bảo có trong students để hiển thị
        setStudents((prev) => {
          const map = new Map(prev.map((s) => [s.id, s]));
          for (const e of res.data.enrollments) {
            if (e.student?.id && !map.has(e.student.id)) map.set(e.student.id, e.student);
          }
          return Array.from(map.values());
        });
        setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
        const clsName = classes.find((c) => c.id === classId)?.name || "lớp";
        setClassNote(`Đã thêm ${ids.length} học viên của ${clsName}.`);
      } else {
        setClassNote("Lớp này chưa có học viên.");
      }
    } catch { setClassNote("Lỗi tải học viên lớp."); }
    setAddingClass(false);
  }

  // 1a: mẫu thông báo
  useEffect(() => {
    api.get("/notifications/templates").then((r) => { if (r.success) setTemplates(r.data || []); }).catch(() => {});
  }, []);
  function applyTemplate(t: any) { setTitle(t.title || ""); setMessage(t.html || ""); }
  async function persistTemplates(list: any[]) {
    setTemplates(list);
    try { await api.post("/notifications/templates", { templates: list }); } catch {}
  }
  function saveAsTemplate() {
    const latestMsg = flushRef.current ? flushRef.current() : message;
    const name = window.prompt("Tên mẫu:", title || "Mẫu mới");
    if (!name) return;
    persistTemplates([...templates, { id: Date.now().toString(), name, title, html: latestMsg }]);
  }
  function deleteTemplate(id: string) {
    if (!window.confirm("Xoá mẫu này?")) return;
    persistTemplates(templates.filter((x) => x.id !== id));
  }
  const filteredStudents = students.filter((s) => {
    const q = searchInput.toLowerCase();
    return (s.fullName || "").toLowerCase().includes(q) ||
           (s.email || "").toLowerCase().includes(q) ||
           (s.studentCode || "").toLowerCase().includes(q);
  });

  const isEmpty = message.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim() === "";
  async function handleSend() {
    const latestMsg = flushRef.current ? flushRef.current() : message;
    const latestEmpty = latestMsg.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim() === "";
    if (!title.trim() || latestEmpty) {
      setError(!title.trim() ? "Vui lòng nhập tiêu đề" : "Vui lòng nhập nội dung");
      return;
    }
    if (mode === "select" && selectedIds.length === 0) { setError("Chưa chọn học viên nào"); return; }
    setSending(true); setError("");
    try {
      const body: any = { title, message: latestMsg, type: "TEACHER_WARNING" };
      if (mode === "all") body.sendToAll = true;
      else body.userIds = selectedIds;
      const data = await api.post("/notifications/send", body);
      if (data.success) router.push("/thong-bao");
      else setError(data.message);
    } catch { setError("Lỗi server"); } finally { setSending(false); }
  }

  return (
    <div className="mx-auto max-w-[700px]">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/thong-bao" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
        <h2 className="font-display text-2xl font-bold text-royal">Gửi thông báo</h2>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="card space-y-5">
        {/* 1a: mẫu thông báo có sẵn */}
        {templates.length > 0 && (
          <div className="rounded-lg border border-gold/30 bg-gold/5 p-3">
            <p className="mb-2 text-xs font-semibold text-royal">Mẫu có sẵn — bấm để dùng:</p>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-white px-2.5 py-1 text-xs text-royal">
                  <button type="button" onClick={() => applyTemplate(t)} className="font-medium hover:text-gold-dark">{t.name}</button>
                  <button type="button" onClick={() => deleteTemplate(t.id)} className="text-royal/40 hover:text-red-500" title="Xoá mẫu">×</button>
                </span>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-royal">Tiêu đề *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Nhắc nhở làm bài tập" className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-royal">Nội dung *</label>
          <NotificationEditor value={message} onChange={setMessage} flushRef={flushRef} />
          <p className="mt-1 text-[0.7rem] text-muted">Soạn có thanh định dạng như blog, hoặc dán HTML ở tab Mã HTML rồi chỉnh chữ ở tab Soạn. Học viên sẽ thấy đúng định dạng này.</p>
          <button type="button" onClick={saveAsTemplate} className="mt-2 text-xs font-medium text-gold hover:text-gold-dark">＋ Lưu nội dung này làm mẫu</button>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-royal">Gửi đến</label>
          <div className="flex gap-3">
            <button onClick={() => setMode("all")}
              className={`flex-1 rounded-lg border py-3 text-center text-sm font-medium transition-colors ${mode === "all" ? "border-gold bg-gold/10 text-royal" : "border-silver/40 text-muted hover:border-gold/40"}`}>
              Tất cả học viên
            </button>
            <button onClick={() => setMode("select")}
              className={`flex-1 rounded-lg border py-3 text-center text-sm font-medium transition-colors ${mode === "select" ? "border-gold bg-gold/10 text-royal" : "border-silver/40 text-muted hover:border-gold/40"}`}>
              Chọn người nhận
            </button>
          </div>
        </div>

        {mode === "select" && (
          <div>
            {/* Chọn theo lớp */}
            <div className="mb-3 rounded-lg border border-gold/40 bg-gold/5 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-royal"><Users size={15} />Thêm nhanh cả lớp</div>
              <div className="flex gap-2">
                <select value={classId} onChange={(e) => { setClassId(e.target.value); setClassNote(""); }} className="input-field !py-2 text-sm flex-1">
                  <option value="">— Chọn lớp —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.course ? ` (${c.course})` : ""}</option>
                  ))}
                </select>
                <button onClick={addWholeClass} disabled={!classId || addingClass}
                  className="rounded-lg border border-gold bg-white px-3 py-2 text-sm font-semibold text-gold-dark hover:bg-gold/10 disabled:opacity-50">
                  <Plus size={14} className="inline" />{addingClass ? "Đang thêm..." : "Thêm cả lớp"}
                </button>
              </div>
              {classNote && <p className="mt-2 text-xs text-green-700">{classNote}</p>}
            </div>

            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-muted">Đã chọn: <strong className="text-royal">{selectedIds.length}</strong> học viên</p>
              <button onClick={selectAll} className="text-xs font-medium text-gold hover:text-gold-light">
                {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>
            {/* 1b: danh sách HS đã chọn — bấm × để bỏ */}
            {selectedIds.length > 0 && (
              <div className="mb-2 flex max-h-[120px] flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-silver/20 bg-cream/40 p-2">
                {selectedIds.map((id) => {
                  const s = students.find((x) => x.id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1 rounded-full bg-royal/8 px-2.5 py-0.5 text-[0.7rem] font-medium text-royal">
                      {s?.fullName || id}
                      <button type="button" onClick={() => toggleStudent(id)} className="leading-none text-royal/50 hover:text-red-500" title="Bỏ chọn">×</button>
                    </span>
                  );
                })}
              </div>
            )}
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Tìm học viên..." className="input-field pl-9 !py-2 text-sm" />
            </div>
            <div className="max-h-[240px] overflow-y-auto rounded-lg border border-silver/30">
              {filteredStudents.map((s) => {
                const selected = selectedIds.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggleStudent(s.id)}
                    className={`flex w-full items-center gap-3 border-b border-silver/10 px-4 py-2.5 text-left transition-colors ${selected ? "bg-gold/5" : "hover:bg-cream"}`}>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${selected ? "border-gold bg-gold text-white" : "border-silver/40"}`}>
                      {selected && <Check size={12} />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#1a1a2e]">{s.fullName}{s.course ? <span className="ml-1 text-[0.65rem] text-gold-dark">· {s.course}</span> : null}</p>
                      <p className="truncate text-[0.7rem] text-muted">{s.studentCode || s.email || "—"}</p>
                    </div>
                  </button>
                );
              })}
              {filteredStudents.length === 0 && <p className="py-6 text-center text-sm text-muted">Không tìm thấy học viên.</p>}
            </div>
          </div>
        )}

        <button onClick={handleSend} disabled={sending || !title.trim()} className="btn-primary w-full justify-center">
          <Send size={15} />{sending ? "Đang gửi..." : `Gửi thông báo${mode === "select" ? ` (${selectedIds.length} người)` : " (tất cả)"}`}
        </button>
      </div>
    </div>
  );
}
