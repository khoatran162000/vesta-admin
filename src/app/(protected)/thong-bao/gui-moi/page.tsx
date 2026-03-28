// FILE: src/app/(protected)/thong-bao/gui-moi/page.tsx — Gui thong bao (tat ca hoac chon nguoi)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Search, Check } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Student { id: string; fullName: string; email: string; }

export default function SendNotificationPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"all" | "select">("all");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Fetch students khi chọn mode "select"
  useEffect(() => {
    if (mode === "select") {
      api.get("/users?role=STUDENT&limit=200").then((data) => {
        if (data.success) setStudents(data.data);
      });
    }
  }, [mode]);

  function toggleStudent(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  }

  const filteredStudents = students.filter((s) =>
    s.fullName.toLowerCase().includes(searchInput.toLowerCase()) ||
    s.email.toLowerCase().includes(searchInput.toLowerCase())
  );

  async function handleSend() {
    if (!title || !message) return;
    if (mode === "select" && selectedIds.length === 0) {
      setError("Chưa chọn học viên nào");
      return;
    }

    setSending(true); setError("");
    try {
      const body: any = { title, message, type: "TEACHER_WARNING" };
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
        <div>
          <label className="mb-1 block text-sm font-medium text-royal">Tiêu đề *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Nhắc nhở làm bài tập" className="input-field" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-royal">Nội dung *</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
            placeholder="Nhập nội dung thông báo..." className="input-field" />
        </div>

        {/* Mode select */}
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

        {/* Student picker */}
        {mode === "select" && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-muted">Đã chọn: <strong className="text-royal">{selectedIds.length}</strong> học viên</p>
              <button onClick={selectAll} className="text-xs font-medium text-gold hover:text-gold-light">
                {selectedIds.length === filteredStudents.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>

            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm học viên..." className="input-field pl-9 !py-2 text-sm" />
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
                      <p className="truncate text-sm font-medium text-[#1a1a2e]">{s.fullName}</p>
                      <p className="truncate text-[0.7rem] text-muted">{s.email}</p>
                    </div>
                  </button>
                );
              })}
              {filteredStudents.length === 0 && <p className="py-6 text-center text-sm text-muted">Không tìm thấy học viên.</p>}
            </div>
          </div>
        )}

        <button onClick={handleSend} disabled={sending || !title || !message} className="btn-primary w-full justify-center">
          <Send size={15} />{sending ? "Đang gửi..." : `Gửi thông báo${mode === "select" ? ` (${selectedIds.length} người)` : " (tất cả)"}`}
        </button>
      </div>
    </div>
  );
}