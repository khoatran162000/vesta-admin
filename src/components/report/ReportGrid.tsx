// FILE: src/components/report/ReportGrid.tsx
// Lưới nhập điểm báo cáo định kỳ (UNIT × cột Bài/Exam/Lectures)
"use client";
import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

export interface CellItem {
  title: string;
  score: number | null;
  attempts: number | null;
  date: string;       // "2026-06-03" hoặc ""
  note: string;
}
export interface UnitRow {
  key: string;
  label: string;
  sublabel: string;
  cells: Record<string, CellItem[]>;
}
export interface ReportGridData {
  units: UnitRow[];
}

// 8 cột cố định khớp mẫu
export const COLS = [
  { key: "bai1", label: "Bài .1" },
  { key: "bai2", label: "Bài .2" },
  { key: "bai3", label: "Bài .3" },
  { key: "bai4", label: "Bài .4" },
  { key: "bai5", label: "Bài .5" },
  { key: "bai6", label: "Bài .6" },
  { key: "examPractice", label: "Exam Practice", maroon: true },
  { key: "lectures", label: "Lectures", maroon: true },
];

// Tạo lưới mặc định: UNIT 0-9 + TESTS
export function makeEmptyGrid(): ReportGridData {
  const emptyCells = () => {
    const c: Record<string, CellItem[]> = {};
    COLS.forEach((col) => { c[col.key] = []; });
    return c;
  };
  const units: UnitRow[] = [];
  for (let i = 0; i <= 9; i++) {
    units.push({
      key: `UNIT${i}`,
      label: `UNIT ${i}`,
      sublabel: i === 0 ? "Foundation / Orientation" : `Unit ${i}`,
      cells: emptyCells(),
    });
  }
  units.push({ key: "TESTS", label: "TESTS", sublabel: "Extra / Mock / Topic", cells: emptyCells() });
  return { units };
}

// Màu điểm theo mức
function scoreLevel(score: number | null): "hi" | "mi" | "lo" | "" {
  if (score === null || isNaN(score)) return "";
  if (score >= 85) return "hi";
  if (score >= 60) return "mi";
  return "lo";
}
const levelColor: Record<string, string> = {
  hi: "text-[#1B2A5B]", mi: "text-[#9A7A32]", lo: "text-[#A3243A]", "": "text-gray-400",
};

interface Props {
  value: ReportGridData;
  onChange: (data: ReportGridData) => void;
}

export default function ReportGrid({ value, onChange }: Props) {
  // Ô đang mở popup chỉnh: { unitKey, colKey } hoặc null
  const [editing, setEditing] = useState<{ u: string; c: string } | null>(null);

  function updateCell(unitKey: string, colKey: string, items: CellItem[]) {
    const units = value.units.map((u) =>
      u.key === unitKey ? { ...u, cells: { ...u.cells, [colKey]: items } } : u
    );
    onChange({ units });
  }

  const editUnit = editing ? value.units.find((u) => u.key === editing.u) : null;
  const editItems = editUnit && editing ? (editUnit.cells[editing.c] || []) : [];

  function addItem() {
    if (!editing) return;
    updateCell(editing.u, editing.c, [...editItems, { title: "", score: null, attempts: null, date: "", note: "" }]);
  }
  function updateItem(idx: number, field: keyof CellItem, val: any) {
    if (!editing) return;
    const items = editItems.map((it, i) => i === idx ? { ...it, [field]: val } : it);
    updateCell(editing.u, editing.c, items);
  }
  function removeItem(idx: number) {
    if (!editing) return;
    updateCell(editing.u, editing.c, editItems.filter((_, i) => i !== idx));
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto rounded-lg border border-silver/30">
        <table className="w-full border-collapse text-xs" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[#1B2A5B] px-2 py-2 text-gold-light" style={{ width: 90 }}>Unit</th>
              {COLS.map((col) => (
                <th key={col.key}
                  className={`px-2 py-2 text-center text-[0.7rem] font-bold uppercase text-white ${col.maroon ? "bg-[#7B1A26]" : "bg-[#1B2A5B]"}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value.units.map((unit) => (
              <tr key={unit.key} className={unit.key === "TESTS" ? "bg-[#7B1A26]/5" : ""}>
                <td className="sticky left-0 z-10 bg-[#1B2A5B] px-2 py-2 text-center align-middle font-bold text-gold-light">
                  {unit.label}
                  <div className="text-[0.6rem] font-normal text-white/70">{unit.sublabel}</div>
                </td>
                {COLS.map((col) => {
                  const items = unit.cells[col.key] || [];
                  return (
                    <td key={col.key}
                      onClick={() => setEditing({ u: unit.key, c: col.key })}
                      className="cursor-pointer border border-silver/20 px-1 py-1 align-top hover:bg-gold/10"
                      style={{ minWidth: 90 }}>
                      {items.length === 0 ? (
                        <div className="py-2 text-center text-[0.65rem] text-gray-300">Chưa làm</div>
                      ) : (
                        items.map((it, i) => (
                          <div key={i} className="mb-1 rounded bg-white p-1 shadow-sm">
                            <div className="truncate text-[0.6rem] font-semibold text-gray-600" title={it.title}>{it.title || "(chưa có tên)"}</div>
                            <div className={`text-sm font-black ${levelColor[scoreLevel(it.score)]}`}>
                              {it.score === null ? "—" : `${it.score}%`}
                            </div>
                            <div className="text-[0.55rem] text-gray-400">
                              {it.attempts ?? 0} lần{it.date ? ` · ${it.date}` : ""}
                            </div>
                          </div>
                        ))
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Popup chỉnh ô */}
      {editing && editUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-royal">
                {editUnit.label} — {COLS.find((c) => c.key === editing.c)?.label}
              </h3>
              <button onClick={() => setEditing(null)} className="text-muted hover:text-royal"><X size={18} /></button>
            </div>

            {editItems.length === 0 && (
              <p className="mb-3 text-sm text-muted">Chưa có mục nào. Bấm "Thêm mục" để nhập điểm.</p>
            )}

            <div className="space-y-3">
              {editItems.map((it, idx) => (
                <div key={idx} className="rounded-lg border border-silver/30 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">Mục {idx + 1}</span>
                    <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                  </div>
                  <input type="text" value={it.title} onChange={(e) => updateItem(idx, "title", e.target.value)}
                    placeholder="Tên bài (vd: 7+ 0.1 - LISTENING)" className="input-field mb-2 text-sm" />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[0.65rem] text-muted">Điểm %</label>
                      <input type="number" step="0.1" value={it.score ?? ""} onChange={(e) => updateItem(idx, "score", e.target.value === "" ? null : parseFloat(e.target.value))}
                        placeholder="85" className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="text-[0.65rem] text-muted">Số lần</label>
                      <input type="number" value={it.attempts ?? ""} onChange={(e) => updateItem(idx, "attempts", e.target.value === "" ? null : parseInt(e.target.value))}
                        placeholder="1" className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="text-[0.65rem] text-muted">Ngày</label>
                      <input type="date" value={it.date} onChange={(e) => updateItem(idx, "date", e.target.value)}
                        className="input-field text-sm" />
                    </div>
                  </div>
                  <input type="text" value={it.note} onChange={(e) => updateItem(idx, "note", e.target.value)}
                    placeholder="Ghi chú (vd: Cần nghe lại và sửa lỗi)" className="input-field mt-2 text-sm" />
                </div>
              ))}
            </div>

            <button onClick={addItem} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gold/40 py-2 text-sm font-medium text-gold-dim hover:bg-gold/5">
              <Plus size={15} />Thêm mục
            </button>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setEditing(null)} className="btn-primary">Xong</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}