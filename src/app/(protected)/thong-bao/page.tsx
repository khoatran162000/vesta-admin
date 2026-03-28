"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get("/notifications?limit=50");
        if (data.success) setNotifications(data.data);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-[800px]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-royal">Thông báo</h2>
        <Link href="/thong-bao/gui-moi" className="btn-primary"><Send size={15} />Gửi thông báo</Link>
      </div>
      <div className="card !p-0 overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gold" /></div>
          : notifications.length === 0 ? <p className="py-12 text-center text-muted">Chưa có thông báo nào.</p>
          : (
          <div className="divide-y divide-silver/10">
            {notifications.map((n) => (
              <div key={n.id} className={`px-5 py-4 ${n.isRead ? "" : "bg-gold/5"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-royal">{n.title}</p>
                  <span className="text-xs text-muted">{new Date(n.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
