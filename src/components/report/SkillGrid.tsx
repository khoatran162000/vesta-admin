// FILE: src/components/report/SkillGrid.tsx
// Bảng tích lũy kĩ năng cuối khóa — CỘT & HÀNG tùy biến; cột "Đánh giá" auto-tính giữ nguyên
"use client";
import { useState } from "react";
import { Plus, Trash2, X, Settings2, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

export interface SkillItem { title: string; score: number | null; note: string; }
export interface SkillColumn { key: string; label: string; maroon?: boolean; }
export interface SkillUnitRow {
  key: string;
  label: string;
  sublabel: string;
  cells: Record<string, SkillItem[]>;
  rating: number | null;
}
export interface SkillGridData {
  columns?: SkillColumn[];   // NEW
  units: SkillUnitRow[];
}

export const DEFAULT_SKILL_COLS: SkillColumn[] = [
  { key: "readingA", label: "Reading A" },
  { key: "readingB", label: "Reading B" },
  { key: "listeningA", label: "Listening A / Reading C" },
  { key: "listeningB", label: "Listening B / Transcript" },
  { key: "writing", label: "Writing" },
  { key: "speaking", label: "Speaking" },
  { key: "lectures", label: "Lectures", maroon: true },
  { key: "examPractice", label: "Exam Practice", maroon: true },
];
export const SKILL_COLS = DEFAULT_SKILL_COLS; // giữ export cũ

export function getSkillColumns(grid: SkillGridData | undefined): SkillColumn[] {
  if (grid?.columns && grid.columns.length > 0) return grid.columns;
  return DEFAULT_SKILL_COLS;
}
function genColKey(): string { return "sk_" + Math.random().toString(36).slice(2, 8); }

export function makeEmptySkillGrid(): SkillGridData {
  const columns = DEFAULT_SKILL_COLS.map((c) => ({ ...c }));
  const emptyCells = () => {
    const c: Record<string, SkillItem[]> = {};
    columns.forEach((col) => { c[col.key] = []; });
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
  return { columns, units };
}

// TB% trên các cột hiện có của unit (dựa vào columns động)
export function computeRating(unit: SkillUnitRow, columns: SkillColumn[]): number | null {
  const scores: number[] = [];
  columns.forEach((col) => {
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
  const [manageCols, setManageCols] = useState(false);

  const columns = getSkillColumns(value);
  const units = value.units || [];
  function ensureColumns(): SkillColumn[] {
    return value.columns && value.columns.length > 0 ? value.columns : DEFAULT_SKILL_COLS.map((c) => ({ ...c }));
  }
  function commit(next: SkillGridData) { onChange(next); }

  function updateUnit(unitKey: string, updater: (u: SkillUnitRow) => SkillUnitRow) {
    commit({ columns: ensureColumns(), units: units.map((u) => (u.key === unitKey ? updater(u) : u)) });
  }
  function updateCell(unitKey: string, colKey: string, items: SkillItem[]) {
    const cols = ensureColumns();
    updateUnit(unitKey, (u) => {
      const next = { ...u, cells: { ...u.cells, [colKey]: items } };
      next.rating = computeRating(next, cols);
      return next;
    });
  }
  function setRating(unitKey: string, val: number | null) {
    updateUnit(unitKey, (u) => ({ ...u, rating: val }));
  }

  // ── CỘT ──
  function addColumn() {
    const cols = ensureColumns();
    const newCol: SkillColumn = { key: genColKey(), label: "Cột mới" };
    const nextUnits = units.map((u) => ({ ...u, cells: { ...u.cells, [newCol.key]: [] } }));
    commit({ columns: [...cols, newCol], units: nextUnits });
  }
  function renameColumn(key: string, label: string) {
    commit({ columns: ensureColumns().map((c) => (c.key === key ? { ...c, label } : c)), units });
  }
  function toggleColumnColor(key: string) {
    commit({ columns: ensureColumns().map((c) => (c.key === key ? { ...c, maroon: !c.maroon } : c)), units });
  }
  function moveColumn(key: string, dir: -1 | 1) {
    const cols = [...ensureColumns()];
    const i = cols.findIndex((c) => c.key === key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cols.length) return;
    [cols[i], cols[j]] = [cols[j], cols[i]];
    commit({ columns: cols, units });
  }
  function removeColumn(key: string) {
    const hasData = units.some((u) => (u.cells[key] || []).length > 0);
    if (hasData && !confirm("Cột này đang có dữ liệu. Xoá cột sẽ mất dữ liệu trong cột. Tiếp tục?")) return;
    const cols = ensureColumns().filter((c) => c.key !== key);
    const nextUnits = units.map((u) => {
      const { [key]: _drop, ...rest } = u.cells;
      const nu = { ...u, cells: rest };
      nu.rating = computeRating(nu, cols); // tính lại vì bớt cột
      return nu;
    });
    commit({ columns: cols, units: nextUnits });
  }

  // ── HÀNG ──
  function addRow() {
    const cols = ensureColumns();
    const cells: Record<string, SkillItem[]> = {};
    cols.forEach((c) => { cells[c.key] = []; });
    const newRow: SkillUnitRow = { key: "row_" + Math.random().toString(36).slice(2, 8), label: "UNIT mới", sublabel: "", cells, rating: null };
    commit({ columns: cols, units: [...units, newRow] });
  }
  function updateRow(key: string, field: "label" | "sublabel", val: string) {
    updateUnit(key, (u) => ({ ...u, [field]: val }));
  }
  function moveRow(key: string, dir: -1 | 1) {
    const rows = [...units];
    const i = rows.findIndex((u) => u.key === key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j], rows[i]];
    commit({ columns: ensureColumns(), units: rows });
  }
  function removeRow(key: string) {
    const u = units.find((x) => x.key === key);
    const hasData = u ? Object.values(u.cells).some((arr) => arr.length > 0) : false;
    if (hasData && !confirm("Hàng này đang có dữ liệu. Xoá hàng sẽ mất dữ liệu của hàng. Tiếp tục?")) return;
    commit({ columns: ensureColumns(), units: units.filter((x) => x.key !== key) });
  }
  function resetToDefault() {
    if (!confirm("Khôi phục bộ cột & hàng mẫu chuẩn? Toàn bộ cột/hàng và dữ liệu hiện tại sẽ bị thay thế.")) return;
    commit(makeEmptySkillGrid());
  }

  const editUnit = editing ? units.find((u) => u.key === editing.u) : null;
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
      {/* Thanh công cụ */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setManageCols((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${manageCols ? "border-royal bg-royal text-white" : "border-silver/40 bg-white text-muted hover:border-royal/40"}`}>
          <Settings2 size={13} />{manageCols ? "Xong tùy chỉnh cột" : "Tùy chỉnh cột"}
        </button>
        <button type="button" onClick={addColumn}
          className="inline-flex items-center gap-1.5 rounded-lg border border-silver/40 bg-white px-3 py-1.5 text-xs font-semibold text-muted hover:border-royal/40">
          <Plus size={13} />Thêm cột
        </button>
        <button type="button" onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-lg border border-silver/40 bg-white px-3 py-1.5 text-xs font-semibold text-muted hover:border-royal/40">
          <Plus size={13} />Thêm hàng
        </button>
        <button type="button" onClick={resetToDefault}
          className="inline-flex items-center gap-1.5 rounded-lg border border-silver/40 bg-white px-3 py-1.5 text-xs font-semibold text-muted hover:border-red-300 hover:text-red-600">
          <RotateCcw size={13} />Khôi phục mẫu chuẩn
        </button>
      </div>

      {manageCols && (
        <div className="mb-3 rounded-lg border border-royal/20 bg-royal/5 p-3">
          <p className="mb-2 text-xs font-semibold text-royal">Quản lý cột kỹ năng — đổi tên, đổi màu, sắp xếp, xoá (cột "Đánh giá" luôn ở cuối, không đổi được):</p>
          <div className="space-y-2">
            {columns.map((col, i) => (
              <div key={col.key} className="flex flex-wrap items-center gap-2">
                <input value={col.label} onChange={(e) => renameColumn(col.key, e.target.value)}
                  className="min-w-[140px] flex-1 rounded border border-silver/40 bg-white px-2 py-1 text-xs" placeholder="Tên cột" />
                <button type="button" onClick={() => toggleColumnColor(col.key)}
                  className="rounded px-2 py-1 text-[0.65rem] font-bold text-white"
                  style={{ background: col.maroon ? "#7A1020" : "#162A5A" }} title="Bấm để đổi màu tiêu đề cột">
                  {col.maroon ? "Đỏ đô" : "Navy"}
                </button>
                <button type="button" onClick={() => moveColumn(col.key, -1)} disabled={i === 0}
                  className="rounded border border-silver/40 p-1 text-muted disabled:opacity-30 hover:text-royal"><ChevronLeft size={13} /></button>
                <button type="button" onClick={() => moveColumn(col.key, 1)} disabled={i === columns.length - 1}
                  className="rounded border border-silver/40 p-1 text-muted disabled:opacity-30 hover:text-royal"><ChevronRight size={13} /></button>
                <button type="button" onClick={() => removeColumn(col.key)}
                  className="rounded border border-silver/40 p-1 text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-silver/30">
        <table className="w-full border-collapse text-xs" style={{ minWidth: 1000 }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[#162A5A] px-2 py-2 text-gold-light" style={{ width: 110 }}>Unit</th>
              {columns.map((col) => (
                <th key={col.key}
                  className={`px-2 py-2 text-center text-[0.65rem] font-bold uppercase text-white ${col.maroon ? "bg-[#7A1020]" : "bg-[#162A5A]"}`}>
                  {col.label}
                </th>
              ))}
              <th className="px-2 py-2 text-center text-[0.65rem] font-bold uppercase text-[#162A5A] bg-[#D9D2C2]" style={{ width: 80 }}>Đánh giá</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit, ri) => (
              <tr key={unit.key}>
                <td className="sticky left-0 z-10 bg-[#162A5A] px-2 py-2 text-center align-middle font-bold text-gold-light">
                  {manageCols ? (
                    <div className="space-y-1">
                      <input value={unit.label} onChange={(e) => updateRow(unit.key, "label", e.target.value)}
                        className="w-full rounded bg-white/90 px-1 py-0.5 text-center text-[0.6rem] font-bold text-[#162A5A]" placeholder="Tên hàng" />
                      <input value={unit.sublabel} onChange={(e) => updateRow(unit.key, "sublabel", e.target.value)}
                        className="w-full rounded bg-white/70 px-1 py-0.5 text-center text-[0.52rem] text-[#162A5A]" placeholder="Ghi chú nhỏ" />
                      <div className="flex justify-center gap-1 pt-0.5">
                        <button type="button" onClick={() => moveRow(unit.key, -1)} disabled={ri === 0}
                          className="rounded bg-white/80 p-0.5 text-[#162A5A] disabled:opacity-30" title="Lên">↑</button>
                        <button type="button" onClick={() => moveRow(unit.key, 1)} disabled={ri === units.length - 1}
                          className="rounded bg-white/80 p-0.5 text-[#162A5A] disabled:opacity-30" title="Xuống">↓</button>
                        <button type="button" onClick={() => removeRow(unit.key)}
                          className="rounded bg-white/80 p-0.5 text-red-600" title="Xoá hàng"><Trash2 size={11} /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {unit.label}
                      <div className="text-[0.55rem] font-normal text-white/70">{unit.sublabel}</div>
                    </>
                  )}
                </td>
                {columns.map((col) => {
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

      {/* Popup chỉnh ô (giữ nguyên) */}
      {editing && editUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-royal">
                {editUnit.label} — {columns.find((c) => c.key === editing.c)?.label}
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