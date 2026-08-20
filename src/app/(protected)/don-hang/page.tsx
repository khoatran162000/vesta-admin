// FILE: src/app/(protected)/don-hang/page.tsx — Quản lý đơn hàng (tài liệu paid + chấm bài): duyệt CK, giao file
"use client";
import { useState, useEffect, useRef } from "react";
import { Loader2, X, Upload, Check, Package, FileText, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import HtmlPasteBox from "@/components/HtmlPasteBox";

interface Order {
  id: string; code: string; kind: string; status: string;
  customerName: string; customerEmail: string; customerPhone: string | null;
  itemId: string | null; item?: { title: string } | null;
  gradingType: string | null; essayText: string | null; speakingLink: string | null;
  amount: number; deliverUrl: string | null; resultHtml: string | null; adminNote: string | null; createdAt: string;
}
const fmtVND = (n: number) => n.toLocaleString("vi-VN") + "₫";
const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Chờ thanh toán", cls: "bg-amber-50 text-amber-700" },
  PAID: { label: "Đã thanh toán", cls: "bg-blue-50 text-blue-700" },
  DELIVERED: { label: "Đã giao", cls: "bg-green-50 text-green-700" },
  CANCELLED: { label: "Đã huỷ", cls: "bg-gray-100 text-gray-500" },
};

export default function DonHangPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState<Order | null>(null);

  async function load() {
    setLoading(true);
    const res = await api.get(`/orders${filter ? `?status=${filter}` : ""}`);
    if (res.success) setOrders(res.data || []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-bold text-royal">🧾 Đơn hàng</h2>
        <p className="mt-1 text-sm text-muted">Đơn mua tài liệu & chấm bài. HS chuyển khoản → đối chiếu sao kê → bấm &quot;Đã nhận tiền&quot; → giao file.</p>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[["", "Tất cả"], ["PENDING", "Chờ thanh toán"], ["PAID", "Đã thanh toán"], ["DELIVERED", "Đã giao"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${filter === v ? "border-royal bg-royal text-white" : "border-silver/40 text-muted hover:border-gold/50"}`}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
      ) : orders.length === 0 ? (
        <div className="card py-12 text-center text-muted">Chưa có đơn nào.</div>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <button key={o.id} onClick={() => setDetail(o)} className="flex w-full items-center gap-4 rounded-xl border border-silver/30 bg-white px-4 py-3 text-left shadow-sm hover:border-gold/50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-royal/10 text-royal">{o.kind === "MATERIAL" ? <FileText size={18} /> : <Package size={18} />}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-royal">{o.code}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS[o.status]?.cls}`}>{STATUS[o.status]?.label}</span>
                </div>
                <div className="truncate text-sm text-[#1a1a2e]">{o.kind === "MATERIAL" ? o.item?.title || "Tài liệu" : `Chấm bài ${o.gradingType === "speaking" ? "Speaking" : "Writing"}`} — {o.customerName}</div>
                <div className="text-xs text-muted">{o.customerEmail}{o.customerPhone ? ` · ${o.customerPhone}` : ""}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-bold text-royal">{o.amount ? fmtVND(o.amount) : "—"}</div>
                <div className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString("vi-VN")}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {detail && <OrderDetail order={detail} close={() => setDetail(null)} saved={() => { setDetail(null); load(); }} />}
    </div>
  );
}

function OrderDetail({ order, close, saved }: { order: Order; close: () => void; saved: () => void }) {
  const [amount, setAmount] = useState(String(order.amount || ""));
  const [adminNote, setAdminNote] = useState(order.adminNote || "");
  const [file, setFile] = useState<File | null>(null);
  const [resultHtml, setResultHtml] = useState(order.resultHtml || "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function patch(extra: any, withFile = false) {
    setSaving(true);
    let body: any;
    if (withFile && file) {
      body = new FormData();
      Object.entries({ ...extra, amount, adminNote, resultHtml }).forEach(([k, v]) => body.append(k, String(v)));
      body.append("file", file);
    } else {
      body = { ...extra, amount: Number(amount) || 0, adminNote, resultHtml };
    }
    const res = await api.patch(`/orders/${order.id}`, body);
    setSaving(false);
    if (!res.success) return alert(res.message || "Lỗi");
    saved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-royal">Đơn {order.code}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS[order.status]?.cls}`}>{STATUS[order.status]?.label}</span>
          </div>
          <button onClick={close} className="text-muted hover:text-royal"><X size={20} /></button>
        </div>

        <div className="mb-4 space-y-1 rounded-lg bg-cream/50 p-3 text-sm">
          <div><b>Khách:</b> {order.customerName}</div>
          <div><b>Email:</b> {order.customerEmail}</div>
          {order.customerPhone && <div><b>SĐT:</b> {order.customerPhone}</div>}
          <div><b>Loại:</b> {order.kind === "MATERIAL" ? `Mua tài liệu — ${order.item?.title}` : `Chấm bài ${order.gradingType === "speaking" ? "Speaking" : "Writing"}`}</div>
        </div>

        {order.kind === "GRADING" && (
          <div className="mb-4 rounded-lg border border-silver/30 p-3">
            <div className="mb-1 text-xs font-bold text-muted">Bài học viên nộp</div>
            {order.essayText && <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-cream/50 p-2 text-sm">{order.essayText}</div>}
            {order.speakingLink && <a href={order.speakingLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-royal underline"><ExternalLink size={13} />Link Speaking</a>}
          </div>
        )}

        <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-muted">Số tiền (VND)</span>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" placeholder="Đặt giá (nhất là đơn chấm bài)" /></label>
        <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-muted">Ghi chú nội bộ</span>
          <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} className="input-field" /></label>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-bold text-muted">File giao cho HS (tài liệu / bài đã chữa)</span>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-silver/40 bg-cream px-4 py-3 text-sm text-muted hover:border-gold/40">
            <Upload size={16} />{file ? file.name : order.deliverUrl ? "Đã có file giao — chọn để thay" : "Chọn file giao"}
          </button>
        </label>
        <div className="mb-4">
          <HtmlPasteBox
            label="Bài chữa dạng text/HTML (tuỳ chọn — HS đọc ngay trên web)"
            value={resultHtml}
            onChange={setResultHtml}
            hint="Soạn nhận xét / bài đã chữa. Dùng kèm hoặc thay cho file. HS xem ở trang Tra cứu đơn khi đơn đã giao."
            rows={6}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={() => patch({})} disabled={saving} className="btn-secondary">Lưu ghi chú/giá</button>
          {order.status === "PENDING" && <button onClick={() => patch({ status: "PAID" })} disabled={saving} className="btn-primary"><Check size={15} />Đã nhận tiền</button>}
          {(order.status === "PAID" || order.status === "PENDING") && (
            <button onClick={() => patch({ status: "DELIVERED" }, true)} disabled={saving || (!file && !order.deliverUrl && !resultHtml.trim())} className="btn-primary bg-green-600 hover:bg-green-700">
              <Package size={15} />Giao hàng
            </button>
          )}
        </div>
        {order.deliverUrl && <p className="mt-2 text-xs text-green-600">Đã có file giao. HS tra đơn bằng mã + email sẽ tải được sau khi trạng thái = Đã giao.</p>}
      </div>
    </div>
  );
}