// FILE: src/components/report/SkillGrid.tsx
// Bảng tích lũy kĩ năng cho báo cáo cuối khóa (UNIT × cột kỹ năng IELTS + cột Đánh giá)
"use client";
import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

export interface SkillItem { title: string; score: number | null; note: string; }
export interface SkillUnitRow {
  key: string;
  label: string;
  sublabel: string;
  cells: Record<string, SkillItem[]>;
  rating: number | null;   // cột Đánh giá: tự tính TB nhưng sửa được
}
export interface SkillGridData { units: SkillUnitRow[]; }

// 8 cột kỹ năng theo mẫu cuối khóa
export const SKILL_COLS = [
  { key: "readingA", label: "Reading A" },
  { key: "readingB", label: "Reading B" },
  { key: "listeningA", label: "Listening A / Reading C" },
  { key: "listeningB", label: "Listening B / Transcript" },
  { key: "writing", label: "Writing", lc: true },
  { key: "speaking", label: "Speaking", lc: true },
  { key: "lectures", label: "Lectures", maroon: true },
  { key: "examPractice", label: "Exam Practice", maroon: true },
];

export function makeEmptySkillGrid(): SkillGridData {
  const emptyCells = () => {
    const c: Record<string, SkillItem[]> = {};
    SKILL_COLS.forEach((col) => { c[col.key] = []; });
    return c;
  };
  const units: SkillUnitRow[] = [];
  for (let i = 0; i <= 10; i++) {
    units.push({
      key: `UNIT${i}`,
      label: `UNIT ${i}`,
      sublabel: i === 0 ? "Foundation" : `Unit ${i}`,
      cells: emptyCells(),
      rating: null,
    });
  }
  return { units };
}

// Tính TB% các ô có điểm trong 1 unit
export function computeRating(unit: SkillUnitRow): number | null {
  const scores: number[] = [];
  SKILL_COLS.forEach((col) => {
    (unit.cells[col.key] || []).forEach((it) => {
      if (it.score !== null && !isNaN(it.score)) scores.push(it.score);
    });
  });
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function scoreColor(score: number | null): string {
  if (score === null || isNaN(score)) return "text-gray-400";
  if (score >= 85) return "text-[#162A5A]";
  if (score >= 60) return "text-[#9A7A32]";
  return "text-[#7A1020]";
}

interface Props {
  value: SkillGridData;
  onChange: (data: SkillGridData) => void;
}

export default function SkillGrid({ value, onChange }: Props) {
  const [editing, setEditing] = useState<{ u: string; c: string } | null>(null);

  function updateUnit(unitKey: string, updater: (u: SkillUnitRow) => SkillUnitRow) {
    onChange({ units: value.units.map((u) => (u.key === unitKey ? updater(u) : u)) });
  }

  function updateCell(unitKey: string, colKey: string, items: SkillItem[]) {
    updateUnit(unitKey, (u) => {
      const next = { ...u, cells: { ...u.cells, [colKey]: items } };
      next.rating = computeRating(next); // tự tính lại khi đổi điểm
      return next;
    });
  }

  function setRating(unitKey: string, val: number | null) {
    updateUnit(unitKey, (u) => ({ ...u, rating: val }));
  }

  const editUnit = editing ? value.units.find((u) => u.key === editing.u) : null;
  const editItems = editUnit && editing ? (editUnit.cells[editing.c] || []) : [];

  function addItem() {
    if (!editing) return;
    updateCell(editing.u, editing.c, [...editItems, { title: "", score: null, note: "" }]);
  }
  function updateItem(idx: number, field: keyof SkillItem, val: any) {
    if (!editing) return;
    updateCell(editing.u, editing.c, editItems.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
  }
  function removeItem(idx: number) {
    if (!editing) return;
    updateCell(editing.u, editing.c, editItems.filter((_, i) => i !== idx));
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto rounded-lg border border-silver/30">
        <table className="w-full border-collapse text-xs" style={{ minWidth: 1000 }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[#162A5A] px-2 py-2 text-gold-light" style={{ width: 80 }}>Unit</th>
              {SKILL_COLS.map((col) => (
                <th key={col.key}
                  className={`px-2 py-2 text-center text-[0.65rem] font-bold uppercase text-white ${col.maroon ? "bg-[#7A1020]" : "bg-[#162A5A]"}`}>
                  {col.label}
                </th>
              ))}
              <th className="px-2 py-2 text-center text-[0.65rem] font-bold uppercase text-[#162A5A] bg-[#D9D2C2]" style={{ width: 80 }}>Đánh giá</th>
            </tr>
          </thead>
          <tbody>
            {value.units.map((unit) => (
              <tr key={unit.key}>
                <td className="sticky left-0 z-10 bg-[#162A5A] px-2 py-2 text-center align-middle font-bold text-gold-light">
                  {unit.label}
                  <div className="text-[0.55rem] font-normal text-white/70">{unit.sublabel}</div>
                </td>
                {SKILL_COLS.map((col) => {
                  const items = unit.cells[col.key] || [];
                  return (
                    <td key={col.key}
                      onClick={() => setEditing({ u: unit.key, c: col.key })}
                      className="cursor-pointer border border-silver/20 px-1 py-1 align-top hover:bg-gold/10"
                      style={{ minWidth: 90 }}>
                      {items.length === 0 ? (
                        <div className="py-2 text-center text-[0.6rem] text-gray-300">—</div>
                      ) : (
                        items.map((it, i) => (
                          <div key={i} className="mb-1 rounded bg-white p-1 shadow-sm">
                            <div className="truncate text-[0.58rem] font-semibold text-gray-600" title={it.title}>{it.title || "(chưa tên)"}</div>
                            <div className={`text-sm font-black ${scoreColor(it.score)}`}>
                              {it.score === null ? "—" : `${it.score}%`}
                            </div>
                            {it.note && <div className="text-[0.52rem] text-[#A3243A] italic truncate" title={it.note}>{it.note}</div>}
                          </div>
                        ))
                      )}
                    </td>
                  );
                })}
                {/* Cột Đánh giá: tự tính nhưng sửa được */}
                <td className="border border-silver/20 bg-[#F8F8F6] px-1 py-1 text-center align-middle">
                  <input type="number" value={unit.rating ?? ""} onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setRating(unit.key, e.target.value === "" ? null : parseInt(e.target.value))}
                    placeholder="—"
                    className={`w-14 rounded border border-silver/30 bg-white px-1 py-1 text-center text-sm font-black ${scoreColor(unit.rating)}`} />
                  <div className="text-[0.5rem] text-gray-400">%</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Popup chỉnh ô kỹ năng */}
      {editing && editUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-royal">
                {editUnit.label} — {SKILL_COLS.find((c) => c.key === editing.c)?.label}
              </h3>
              <button onClick={() => setEditing(null)} className="text-muted hover:text-royal"><X size={18} /></button>
            </div>

            {editItems.length === 0 && <p className="mb-3 text-sm text-muted">Chưa có mục nào. Bấm "Thêm mục" để nhập.</p>}

            <div className="space-y-3">
              {editItems.map((it, idx) => (
                <div key={idx} className="rounded-lg border border-silver/30 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">Mục {idx + 1}</span>
                    <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                  </div>
                  <input type="text" value={it.title} onChange={(e) => updateItem(idx, "title", e.target.value)}
                    placeholder="Tên link/bài (vd: RA Foundation, Map Practice)" className="input-field mb-2 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[0.65rem] text-muted">Điểm %</label>
                      <input type="number" step="0.1" value={it.score ?? ""} onChange={(e) => updateItem(idx, "score", e.target.value === "" ? null : parseFloat(e.target.value))}
                        placeholder="90" className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="text-[0.65rem] text-muted">Ghi chú</label>
                      <input type="text" value={it.note} onChange={(e) => updateItem(idx, "note", e.target.value)}
                        placeholder="vd: Đạt mục tiêu" className="input-field text-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addItem} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gold/40 py-2 text-sm font-medium text-gold-dim hover:bg-gold/5">
              <Plus size={15} />Thêm mục
            </button>
            <div className="mt-2 text-center text-[0.7rem] text-muted">Đánh giá unit này tự tính lại khi bạn đổi điểm (vẫn sửa tay được ở cột Đánh giá).</div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setEditing(null)} className="btn-primary">Xong</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}