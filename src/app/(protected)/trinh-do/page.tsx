// FILE: src/app/(protected)/trinh-do/page.tsx — Quản lý danh sách Trình độ
"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, Save, X } from "lucide-react";
import { api } from "@/lib/api";
export default function LevelsPage() {
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    const json = await api.get("/levels");
    if (json.success) setLevels(json.data || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  async function handleDelete(item: any) {
    if (!confirm(`Xoá trình độ "${item.code}"?`)) return;
    const json = await api.delete(`/levels/${item.id}`);
    if (json.success) load();
    else alert(json.message || "Không xoá được"); // hiện "còn N lớp đang dùng"
  }
  async function handleSave(form: any) {
    const url = form.id ? `/levels/${form.id}` : "/levels";
    const json = await (form.id ? api.put(url, form) : api.post(url, form));
    if (!json.success) { alert(json.message || "Lỗi lưu"); return; }
    setShowModal(false); setEditItem(null); load();
  }
  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">🎚️ Quản Lý Trình Độ</h2>
          <p className="mt-1 text-sm text-muted">Danh sách trình độ để nối khoá học ↔ lớp học. Không xoá được nếu còn lớp/khoá đang dùng.</p>
        </div>
        <button onClick={() => { setEditItem({ code: "", label: "", order: levels.length }); setShowModal(true); }} className="btn-primary">
          <Plus size={16} />Thêm trình độ
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-silver/30 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
        ) : levels.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">Chưa có trình độ nào.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b bg-cream">
              <th className="px-4 py-3 font-semibold text-royal">Mã</th>
              <th className="px-4 py-3 font-semibold text-royal">Nhãn hiển thị</th>
              <th className="px-4 py-3 text-center font-semibold text-royal">Thứ tự</th>
              <th className="px-4 py-3 text-right font-semibold text-royal">Thao tác</th>
            </tr></thead>
            <tbody>
              {levels.map((lv) => (
                <tr key={lv.id} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-4 py-3 font-bold text-[#1a1a2e]">{lv.code}</td>
                  <td className="px-4 py-3 text-muted">{lv.label || "—"}</td>
                  <td className="px-4 py-3 text-center text-muted">{lv.order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditItem(lv); setShowModal(true); }} className="rounded-lg px-2.5 py-1 text-xs font-medium text-royal hover:bg-cream-dark">Sửa</button>
                      <button onClick={() => handleDelete(lv)} className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showModal && editItem && (
        <LevelModal item={editItem} onClose={() => { setShowModal(false); setEditItem(null); }} onSave={handleSave} />
      )}
    </div>
  );
}
function LevelModal({ item, onClose, onSave }: { item: any; onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState<any>({ id: item.id, code: item.code || "", label: item.label || "", order: item.order ?? 0 });
  const [saving, setSaving] = useState(false);
  function set(k: string, v: any) { setForm((p: any) => ({ ...p, [k]: v })); }
  async function submit() {
    if (!form.code.trim()) { alert("Nhập mã trình độ"); return; }
    setSaving(true); await onSave(form); setSaving(false);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-royal">{item.id ? "Sửa trình độ" : "Thêm trình độ"}</h3>
          <button onClick={onClose} className="text-muted hover:text-royal"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-muted">Mã trình độ * (dùng để nối lớp, vd: 7+)</label>
            <input type="text" value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="7+" className="input-field" />
            {item.id && <p className="mt-1 text-[0.7rem] text-muted">Lưu ý: đổi mã sẽ bị chặn nếu còn lớp/khoá đang dùng mã cũ.</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted">Nhãn hiển thị (tuỳ chọn)</label>
            <input type="text" value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="IELTS 7+" className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted">Thứ tự</label>
            <input type="number" value={form.order} onChange={(e) => set("order", parseInt(e.target.value) || 0)} className="input-field" />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Huỷ</button>
          <button onClick={submit} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Lưu
          </button>
        </div>
      </div>
    </div>
  );
}