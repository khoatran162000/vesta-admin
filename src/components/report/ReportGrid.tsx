// FILE: src/components/report/ReportGrid.tsx
// Lưới nhập điểm báo cáo định kỳ — CỘT & HÀNG tùy biến (thêm/bớt/đổi tên/đổi màu)
"use client";
import { useState } from "react";
import { Plus, Trash2, X, Settings2, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

export interface CellItem {
  title: string;
  score: number | null;
  attempts: number | null;
  date: string;
  note: string;
}
export interface GridColumn {
  key: string;
  label: string;
  maroon?: boolean;
}
export interface UnitRow {
  key: string;
  label: string;
  sublabel: string;
  cells: Record<string, CellItem[]>;
}
export interface ReportGridData {
  columns?: GridColumn[];   // NEW: định nghĩa cột (report cũ không có → fallback DEFAULT_COLS)
  units: UnitRow[];
}

// Bộ cột mặc định (khớp mẫu cũ) — cũng dùng làm fallback cho report cũ
export const DEFAULT_COLS: GridColumn[] = [
  { key: "bai1", label: "Bài .1" },
  { key: "bai2", label: "Bài .2" },
  { key: "bai3", label: "Bài .3" },
  { key: "bai4", label: "Bài .4" },
  { key: "bai5", label: "Bài .5" },
  { key: "bai6", label: "Bài .6" },
  { key: "examPractice", label: "Exam Practice", maroon: true },
  { key: "lectures", label: "Lectures", maroon: true },
];
// Giữ export cũ để nơi khác import không vỡ
export const COLS = DEFAULT_COLS;

// Lấy cột từ grid, fallback sang mặc định nếu report cũ không có columns
export function getColumns(grid: ReportGridData | undefined): GridColumn[] {
  if (grid?.columns && grid.columns.length > 0) return grid.columns;
  return DEFAULT_COLS;
}

function genColKey(): string {
  return "col_" + Math.random().toString(36).slice(2, 8);
}

export function makeEmptyGrid(): ReportGridData {
  const columns = DEFAULT_COLS.map((c) => ({ ...c }));
  const emptyCells = () => {
    const c: Record<string, CellItem[]> = {};
    columns.forEach((col) => { c[col.key] = []; });
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
  return { columns, units };
}

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
  const [editing, setEditing] = useState<{ u: string; c: string } | null>(null);
  const [manageCols, setManageCols] = useState(false);

  const columns = getColumns(value);
  const units = value.units || [];

  // Đảm bảo value.columns luôn tồn tại khi thao tác (nâng cấp report cũ tại chỗ, không đụng data)
  function ensureColumns(): GridColumn[] {
    return value.columns && value.columns.length > 0 ? value.columns : DEFAULT_COLS.map((c) => ({ ...c }));
  }

  function commit(next: ReportGridData) { onChange(next); }

  function updateCell(unitKey: string, colKey: string, items: CellItem[]) {
    const nextUnits = units.map((u) =>
      u.key === unitKey ? { ...u, cells: { ...u.cells, [colKey]: items } } : u
    );
    commit({ columns: ensureColumns(), units: nextUnits });
  }

  // ── Quản lý CỘT ──
  function addColumn() {
    const cols = ensureColumns();
    const newCol: GridColumn = { key: genColKey(), label: "Cột mới" };
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
    if (hasData && !confirm("Cột này đang có dữ liệu. Xoá cột sẽ mất toàn bộ dữ liệu trong cột. Tiếp tục?")) return;
    const nextUnits = units.map((u) => {
      const { [key]: _drop, ...rest } = u.cells;
      return { ...u, cells: rest };
    });
    commit({ columns: ensureColumns().filter((c) => c.key !== key), units: nextUnits });
  }

  // ── Quản lý HÀNG ──
  function addRow() {
    const cols = ensureColumns();
    const cells: Record<string, CellItem[]> = {};
    cols.forEach((c) => { cells[c.key] = []; });
    const newRow: UnitRow = { key: "row_" + Math.random().toString(36).slice(2, 8), label: "UNIT mới", sublabel: "", cells };
    commit({ columns: cols, units: [...units, newRow] });
  }
  function updateRow(key: string, field: "label" | "sublabel", val: string) {
    commit({ columns: ensureColumns(), units: units.map((u) => (u.key === key ? { ...u, [field]: val } : u)) });
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
    commit(makeEmptyGrid());
  }

  const editUnit = editing ? units.find((u) => u.key === editing.u) : null;
  const editItems = editUnit && editing ? (editUnit.cells[editing.c] || []) : [];
  function addItem() {
    if (!editing) return;
    updateCell(editing.u, editing.c, [...editItems, { title: "", score: null, attempts: null, date: "", note: "" }]);
  }
  function updateItem(idx: number, field: keyof CellItem, val: any) {
    if (!editing) return;
    updateCell(editing.u, editing.c, editItems.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
  }
  function removeItem(idx: number) {
    if (!editing) return;
    updateCell(editing.u, editing.c, editItems.filter((_, i) => i !== idx));
  }

  return (
    <div className="relative">
      {/* Thanh công cụ tùy biến */}
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

      {/* Bảng quản lý cột (hiện khi bật Tùy chỉnh cột) */}
      {manageCols && (
        <div className="mb-3 rounded-lg border border-royal/20 bg-royal/5 p-3">
          <p className="mb-2 text-xs font-semibold text-royal">Quản lý cột — đổi tên, đổi màu, sắp xếp, xoá:</p>
          <div className="space-y-2">
            {columns.map((col, i) => (
              <div key={col.key} className="flex flex-wrap items-center gap-2">
                <input value={col.label} onChange={(e) => renameColumn(col.key, e.target.value)}
                  className="min-w-[140px] flex-1 rounded border border-silver/40 bg-white px-2 py-1 text-xs" placeholder="Tên cột" />
                <button type="button" onClick={() => toggleColumnColor(col.key)}
                  className="rounded px-2 py-1 text-[0.65rem] font-bold text-white"
                  style={{ background: col.maroon ? "#7B1A26" : "#1B2A5B" }}
                  title="Bấm để đổi màu tiêu đề cột">
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
        <table className="w-full border-collapse text-xs" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[#1B2A5B] px-2 py-2 text-gold-light" style={{ width: 120 }}>Unit</th>
              {columns.map((col) => (
                <th key={col.key}
                  className={`px-2 py-2 text-center text-[0.7rem] font-bold uppercase text-white ${col.maroon ? "bg-[#7B1A26]" : "bg-[#1B2A5B]"}`}>
                  {col.label}
                </th>
              ))}
              {manageCols && <th className="bg-[#1B2A5B] px-2 py-2 text-gold-light" style={{ width: 40 }}></th>}
            </tr>
          </thead>
          <tbody>
            {units.map((unit, ri) => (
              <tr key={unit.key} className={unit.key === "TESTS" ? "bg-[#7B1A26]/5" : ""}>
                <td className="sticky left-0 z-10 bg-[#1B2A5B] px-2 py-2 text-center align-middle font-bold text-gold-light">
                  {manageCols ? (
                    <div className="space-y-1">
                      <input value={unit.label} onChange={(e) => updateRow(unit.key, "label", e.target.value)}
                        className="w-full rounded bg-white/90 px-1 py-0.5 text-center text-[0.65rem] font-bold text-[#1B2A5B]" placeholder="Tên hàng" />
                      <input value={unit.sublabel} onChange={(e) => updateRow(unit.key, "sublabel", e.target.value)}
                        className="w-full rounded bg-white/70 px-1 py-0.5 text-center text-[0.55rem] text-[#1B2A5B]" placeholder="Ghi chú nhỏ" />
                      <div className="flex justify-center gap-1 pt-0.5">
                        <button type="button" onClick={() => moveRow(unit.key, -1)} disabled={ri === 0}
                          className="rounded bg-white/80 p-0.5 text-[#1B2A5B] disabled:opacity-30" title="Lên">↑</button>
                        <button type="button" onClick={() => moveRow(unit.key, 1)} disabled={ri === units.length - 1}
                          className="rounded bg-white/80 p-0.5 text-[#1B2A5B] disabled:opacity-30" title="Xuống">↓</button>
                        <button type="button" onClick={() => removeRow(unit.key)}
                          className="rounded bg-white/80 p-0.5 text-red-600" title="Xoá hàng"><Trash2 size={11} /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {unit.label}
                      <div className="text-[0.6rem] font-normal text-white/70">{unit.sublabel}</div>
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
                {manageCols && <td className="border border-silver/20 bg-gray-50"></td>}
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