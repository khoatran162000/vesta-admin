// FILE: thong-bao/page.tsx — Mẫu + Lịch sử đã gửi (chi tiết nội dung & người nhận)
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Loader2, Clock, Users, LayoutTemplate, X, CheckCircle2, Circle } from "lucide-react";
import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const strip = (s: string) => String(s || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export default function ThongBaoPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fullHtml, setFullHtml] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [t, s]: any[] = await Promise.all([
          api.get("/notifications/templates").catch(() => null),
          api.get("/notifications/admin/sent").catch(() => null),
        ]);
        if (t?.success) setTemplates(t.data || []);
        if (s?.success) setSent(s.data || []);
      } finally { setLoading(false); }
    })();
  }, []);

  async function openDetail(item: any) {
    setDetailLoading(true); setDetail({ __loading: true }); setFullHtml(null);
    try {
      const q = item.batchId ? `batchId=${encodeURIComponent(item.batchId)}` : `legacyTitle=${encodeURIComponent(item.legacyTitle || item.title)}`;
      const res: any = await api.get(`/notifications/admin/sent-detail?${q}`);
      if (res?.success) {
        setDetail(res.data);
        // Nội dung nặng offload qua link /thong-bao/xem/<token> → lấy HTML đầy đủ để xem
        const link: string = res.data?.link || "";
        const m = link.match(/\/thong-bao\/xem\/([a-z0-9]+)/i);
        if (m) {
          try {
            const r = await fetch(`${API_URL}/site-content/notif_${m[1]}`, { cache: "no-store" });
            const j = await r.json();
            const h = j?.data?.data?.html;
            if (h) setFullHtml(String(h));
          } catch {}
        }
      } else setDetail(null);
    } catch { setDetail(null); }
    finally { setDetailLoading(false); }
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-royal">Thông báo</h2>
        <Link href="/thong-bao/gui-moi" className="btn-primary"><Send size={15} />Gửi thông báo</Link>
      </div>

      <div className="card mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-royal"><LayoutTemplate size={16} />Mẫu thông báo có sẵn</div>
        {templates.length === 0 ? (
          <p className="text-sm text-muted">Chưa có mẫu nào. Vào “Gửi thông báo” để tạo mẫu.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <Link key={t.id} href="/thong-bao/gui-moi" className="inline-flex items-center rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-xs font-medium text-royal hover:bg-gold/10">{t.name}</Link>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-royal"><Clock size={16} />Lịch sử thông báo đã gửi</div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-gold" /></div>
        ) : sent.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Chưa gửi thông báo nào.</p>
        ) : (
          <div className="divide-y divide-silver/15">
            {sent.map((n, i) => (
              <button key={i} onClick={() => openDetail(n)} className="block w-full py-3 text-left hover:bg-cream/40">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-royal">{n.title || "(không tiêu đề)"}</p>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-royal/8 px-2 py-0.5 text-[0.7rem] font-medium text-royal"><Users size={12} />{n.count} người</span>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-muted">{strip(n.message).slice(0, 140)}</p>
                <p className="mt-1 text-[0.7rem] text-muted">{n.createdAt ? new Date(n.createdAt).toLocaleString("vi-VN") : ""} · Bấm để xem chi tiết & người nhận</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="flex max-h-[90vh] w-full max-w-[900px] flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-silver/20 px-5 py-3">
              <h3 className="font-display text-lg font-bold text-royal">Chi tiết thông báo đã gửi</h3>
              <button onClick={() => setDetail(null)} className="text-muted hover:text-royal"><X size={20} /></button>
            </div>
            {detailLoading || detail.__loading ? (
              <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
            ) : (
              <div className="grid flex-1 grid-cols-1 gap-4 overflow-auto p-5 md:grid-cols-2">
                <div>
                  <p className="text-sm font-bold text-royal">{detail.title}</p>
                  <p className="mb-2 text-[0.7rem] text-muted">{detail.createdAt ? new Date(detail.createdAt).toLocaleString("vi-VN") : ""} · {detail.total} người nhận · {detail.readCount} đã đọc</p>
                  <div className="rounded-lg border border-silver/30 bg-cream/30 p-3 text-sm">
                    {fullHtml ? (
                      <iframe srcDoc={fullHtml} title="Nội dung" sandbox="allow-scripts allow-popups allow-same-origin" className="h-[420px] w-full rounded border-0 bg-white" />
                    ) : (
                      <div className="notif-html max-h-[420px] overflow-auto" dangerouslySetInnerHTML={{ __html: detail.message || "" }} />
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-bold text-royal">Danh sách người nhận ({detail.recipients?.length || 0})</p>
                  <div className="max-h-[460px] overflow-auto rounded-lg border border-silver/20">
                    {(detail.recipients || []).map((r: any, i: number) => (
                      <div key={i} className="flex items-center justify-between gap-2 border-b border-silver/10 px-3 py-1.5 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#1a1a2e]">{r.fullName}</p>
                          <p className="truncate text-[0.7rem] font-mono text-muted">{r.studentCode}</p>
                        </div>
                        {r.isRead
                          ? <span className="inline-flex shrink-0 items-center gap-1 text-[0.7rem] text-green-600"><CheckCircle2 size={13} />Đã đọc</span>
                          : <span className="inline-flex shrink-0 items-center gap-1 text-[0.7rem] text-muted"><Circle size={13} />Chưa đọc</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
