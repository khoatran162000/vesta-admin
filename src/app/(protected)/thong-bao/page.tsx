// FILE: thong-bao/page.tsx — Lịch sử thông báo đã gửi + thư viện mẫu mặc định
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Loader2, Clock, Users, LayoutTemplate } from "lucide-react";
import { api } from "@/lib/api";

const strip = (s: string) => String(s || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export default function ThongBaoPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, s]: any[] = await Promise.all([
          api.get("/notifications/templates").catch(() => null),
          api.get("/notifications/admin/sent?limit=50").catch(() => null),
        ]);
        if (t?.success) setTemplates(t.data || []);
        const rows: any[] = (s?.data || []) as any[];
        const map = new Map<string, any>();
        for (const n of rows) {
          const key = (n.title || "") + "|" + String(n.createdAt || "").slice(0, 16);
          const g = map.get(key);
          if (g) g.count++;
          else map.set(key, { title: n.title, createdAt: n.createdAt, message: n.message, link: n.link, count: 1 });
        }
        setSent(Array.from(map.values()));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-royal">Thông báo</h2>
        <Link href="/thong-bao/gui-moi" className="btn-primary"><Send size={15} />Gửi thông báo</Link>
      </div>

      {/* Thư viện mẫu mặc định */}
      <div className="card mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-royal"><LayoutTemplate size={16} />Mẫu thông báo có sẵn</div>
        {templates.length === 0 ? (
          <p className="text-sm text-muted">Chưa có mẫu nào. Vào “Gửi thông báo” để tạo mẫu.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <Link key={t.id} href="/thong-bao/gui-moi" title="Dùng mẫu này ở trang Gửi thông báo"
                className="inline-flex items-center rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-xs font-medium text-royal hover:bg-gold/10">
                {t.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Lịch sử đã gửi */}
      <div className="card">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-royal"><Clock size={16} />Lịch sử thông báo đã gửi</div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-gold" /></div>
        ) : sent.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Chưa gửi thông báo nào.</p>
        ) : (
          <div className="divide-y divide-silver/15">
            {sent.map((n, i) => (
              <div key={i} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-royal">{n.title}</p>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-royal/8 px-2 py-0.5 text-[0.7rem] font-medium text-royal"><Users size={12} />{n.count} người</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{strip(n.message).slice(0, 160)}</p>
                <p className="mt-1 text-[0.7rem] text-muted">{n.createdAt ? new Date(n.createdAt).toLocaleString("vi-VN") : ""}{n.link ? " · có link xem chi tiết" : ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
