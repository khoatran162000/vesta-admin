// FILE: src/app/(protected)/tu-van/page.tsx — Yêu cầu tư vấn từ landing (chỉ ADMIN)
"use client";
import { useState, useEffect, useCallback } from "react";
import { Loader2, Search, Phone, Mail, Clock, Trash2, MessageSquare, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";

interface Consultation {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  preferredTime: string | null;
  question: string | null;
  status: "NEW" | "CONTACTED" | "DONE" | "SPAM";
  note: string | null;
  handledBy: string | null;
  createdAt: string;
}

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "NEW", label: "Mới" },
  { key: "CONTACTED", label: "Đã liên hệ" },
  { key: "DONE", label: "Hoàn tất" },
  { key: "SPAM", label: "Spam" },
  { key: "ALL", label: "Tất cả" },
];

const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-amber-50 text-amber-700",
  CONTACTED: "bg-blue-50 text-blue-700",
  DONE: "bg-green-50 text-green-700",
  SPAM: "bg-gray-100 text-gray-500",
};
const STATUS_LABEL: Record<string, string> = {
  NEW: "Mới", CONTACTED: "Đã liên hệ", DONE: "Hoàn tất", SPAM: "Spam",
};

export default function ConsultationPage() {
  useRequireAdmin("/dashboard");
  const [items, setItems] = useState<Consultation[]>([]);
  const [total, setTotal] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("NEW");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [noteEdit, setNoteEdit] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, limit: "100" });
      if (search) params.set("search", search);
      const res = await api.get(`/consultation?${params}`);
      if (res.success) {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
        setNewCount(res.data.newCount || 0);
      }
    } catch {} finally { setLoading(false); }
  }, [status, search]);
  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function setStatusOf(id: string, newStatus: string) {
    const res = await api.patch(`/consultation/${id}`, { status: newStatus });
    if (res.success) fetchData();
    else alert(res.message || "Lỗi cập nhật");
  }
  async function saveNote(id: string) {
    const res = await api.patch(`/consultation/${id}`, { note: noteEdit[id] ?? "" });
    if (res.success) {
      setNoteEdit((prev) => { const n = { ...prev }; delete n[id]; return n; });
      fetchData();
    } else alert(res.message || "Lỗi lưu ghi chú");
  }
  async function remove(id: string, name: string) {
    if (!confirm(`Xoá yêu cầu tư vấn của "${name}"? Không hoàn tác.`)) return;
    const res = await api.delete(`/consultation/${id}`);
    if (res.success) fetchData();
    else alert(res.message || "Lỗi xoá");
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">Yêu cầu tư vấn</h2>
          <p className="text-sm text-muted">Thông tin khách gửi từ trang "Đặt lịch tư vấn"</p>
        </div>
        {newCount > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-700">
            {newCount} yêu cầu mới
          </span>
        )}
      </div>

      {/* Tabs trạng thái */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button key={t.key} onClick={() => setStatus(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${status === t.key ? "bg-royal text-white" : "bg-white text-muted hover:bg-cream border border-silver/30"}`}>
            {t.label}{t.key === "NEW" && newCount > 0 ? ` (${newCount})` : ""}
          </button>
        ))}
      </div>

      {/* Tìm kiếm */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo tên, SĐT, email..." className="input-field pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gold" /></div>
      ) : items.length === 0 ? (
        <div className="card py-12 text-center text-muted">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-40" />
          Chưa có yêu cầu nào{status !== "ALL" ? " ở mục này" : ""}.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className={`card !py-4 border-l-4 ${c.status === "NEW" ? "border-l-amber-400" : c.status === "CONTACTED" ? "border-l-blue-400" : c.status === "DONE" ? "border-l-green-400" : "border-l-gray-300"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#1a1a2e]">{c.name}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                    <span className="text-xs text-muted">{new Date(c.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                    <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 hover:text-royal"><Phone size={13} />{c.phone}</a>
                    {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 hover:text-royal"><Mail size={13} />{c.email}</a>}
                    {c.preferredTime && <span className="inline-flex items-center gap-1.5"><Clock size={13} />{c.preferredTime}</span>}
                  </div>
                  {c.question && (
                    <p className="mt-2 rounded-lg bg-cream px-3 py-2 text-sm text-[#1a1a2e]">{c.question}</p>
                  )}
                  {/* Ghi chú nội bộ */}
                  <div className="mt-2">
                    {noteEdit[c.id] !== undefined ? (
                      <div className="flex gap-2">
                        <input value={noteEdit[c.id]} onChange={(e) => setNoteEdit((p) => ({ ...p, [c.id]: e.target.value }))}
                          placeholder="Ghi chú nội bộ..." className="input-field flex-1 !py-1.5 text-sm" />
                        <button onClick={() => saveNote(c.id)} className="btn-primary !py-1.5"><Check size={14} />Lưu</button>
                        <button onClick={() => setNoteEdit((p) => { const n = { ...p }; delete n[c.id]; return n; })} className="btn-secondary !py-1.5">Huỷ</button>
                      </div>
                    ) : (
                      <button onClick={() => setNoteEdit((p) => ({ ...p, [c.id]: c.note || "" }))}
                        className="text-xs text-muted hover:text-royal">
                        {c.note ? <>📝 {c.note} <span className="underline">(sửa)</span></> : "+ Thêm ghi chú"}
                      </button>
                    )}
                  </div>
                </div>
                {/* Hành động */}
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <select value={c.status} onChange={(e) => setStatusOf(c.id, e.target.value)}
                    className="input-field !py-1.5 text-xs" title="Đổi trạng thái">
                    <option value="NEW">Mới</option>
                    <option value="CONTACTED">Đã liên hệ</option>
                    <option value="DONE">Hoàn tất</option>
                    <option value="SPAM">Spam</option>
                  </select>
                  <button onClick={() => remove(c.id, c.name)} title="Xoá"
                    className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
          <p className="pt-2 text-center text-xs text-muted">Tổng {total} yêu cầu {status !== "ALL" ? "ở mục này" : ""}</p>
        </div>
      )}
    </div>
  );
}