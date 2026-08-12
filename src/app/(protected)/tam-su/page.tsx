// FILE: src/app/(protected)/tam-su/page.tsx — Tâm sự với Vesta (admin đọc/trả lời)
"use client";
import { useState, useEffect, useCallback } from "react";
import { Loader2, MessageSquare, Check, Send } from "lucide-react";
import { api } from "@/lib/api";

const CAT_LABEL: Record<string, string> = { QUESTION: "Câu hỏi", SHARE: "Chia sẻ", SUGGEST: "Đề xuất" };
const CAT_BADGE: Record<string, string> = {
  QUESTION: "bg-blue-50 text-blue-700",
  SHARE: "bg-rose-50 text-rose-700",
  SUGGEST: "bg-amber-50 text-amber-700",
};
const STATUS_LABEL: Record<string, string> = { NEW: "Mới", READ: "Đã đọc", REPLIED: "Đã trả lời" };
const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-amber-50 text-amber-700",
  READ: "bg-blue-50 text-blue-700",
  REPLIED: "bg-green-50 text-green-700",
};
const TABS = [
  { key: "NEW", label: "Mới" },
  { key: "READ", label: "Đã đọc" },
  { key: "REPLIED", label: "Đã trả lời" },
  { key: "ALL", label: "Tất cả" },
];

export default function AdminTamSuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("NEW");
  const [replyEdit, setReplyEdit] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = status === "ALL" ? "" : `?status=${status}`;
      const res = await api.get(`/vesta-messages${q}`);
      if (res.success) { setItems(res.data || []); setNewCount(res.newCount || 0); }
    } catch {} finally { setLoading(false); }
  }, [status]);
  useEffect(() => { load(); }, [load]);

  async function markRead(id: string) {
    setBusy(id);
    try { const r = await api.patch(`/vesta-messages/${id}`, { status: "READ" }); if (r.success) load(); }
    finally { setBusy(null); }
  }
  async function sendReply(id: string) {
    const reply = (replyEdit[id] || "").trim();
    if (!reply) return;
    setBusy(id);
    try {
      const r = await api.patch(`/vesta-messages/${id}`, { adminReply: reply });
      if (r.success) { setReplyEdit((p) => { const n = { ...p }; delete n[id]; return n; }); load(); }
      else alert(r.message || "Lỗi gửi");
    } finally { setBusy(null); }
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">Tâm sự với Vesta</h2>
          <p className="text-sm text-muted">Câu hỏi, chia sẻ, đề xuất học viên gửi tới trung tâm</p>
        </div>
        {newCount > 0 && <span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-700">{newCount} tin mới</span>}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setStatus(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${status === t.key ? "bg-royal text-white" : "border border-silver/30 bg-white text-muted hover:bg-cream"}`}>
            {t.label}{t.key === "NEW" && newCount > 0 ? ` (${newCount})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gold" /></div>
      ) : items.length === 0 ? (
        <div className="card py-12 text-center text-muted"><MessageSquare size={32} className="mx-auto mb-3 opacity-40" />Chưa có tin nào ở mục này.</div>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div key={m.id} className={`card !py-4 border-l-4 ${m.status === "NEW" ? "border-l-amber-400" : m.status === "REPLIED" ? "border-l-green-400" : "border-l-blue-400"}`}>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#1a1a2e]">{m.student?.fullName || "Học viên"}</span>
                {m.student?.studentCode && <span className="font-mono text-xs text-gold">{m.student.studentCode}</span>}
                {m.student?.course && <span className="rounded bg-royal/8 px-1.5 py-0.5 text-[0.6rem] font-semibold text-royal">Lớp {m.student.course}</span>}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CAT_BADGE[m.category] || ""}`}>{CAT_LABEL[m.category] || "Chia sẻ"}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[m.status] || ""}`}>{STATUS_LABEL[m.status] || m.status}</span>
                <span className="text-xs text-muted">{new Date(m.createdAt).toLocaleString("vi-VN")}</span>
              </div>
              <p className="whitespace-pre-wrap rounded-lg bg-cream px-3 py-2 text-sm text-[#1a1a2e]">{m.content}</p>
              {m.adminReply && (
                <div className="mt-2 rounded-lg bg-gold/5 px-3 py-2">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gold-dark">Đã phản hồi</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-[#1a1a2e]">{m.adminReply}</p>
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-start gap-2">
                <textarea value={replyEdit[m.id] ?? (m.adminReply || "")} onChange={(e) => setReplyEdit((p) => ({ ...p, [m.id]: e.target.value }))}
                  rows={2} placeholder="Viết phản hồi cho học viên..." className="input-field flex-1 text-sm" />
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => sendReply(m.id)} disabled={busy === m.id} className="btn-primary !py-1.5 whitespace-nowrap"><Send size={13} />Gửi trả lời</button>
                  {m.status === "NEW" && (
                    <button onClick={() => markRead(m.id)} disabled={busy === m.id} className="btn-secondary !py-1.5 whitespace-nowrap"><Check size={13} />Đánh dấu đã đọc</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
