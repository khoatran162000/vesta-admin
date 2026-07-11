// FILE: src/components/exercise/ExerciseMeta.tsx — Phần thông tin chung dùng cho mọi editor bài tập
"use client";
import { useLevels } from "@/lib/useLevels";
export interface MetaState {
  title: string;
  description: string;
  visibility: string;
  visibleTo: string[];
  isPublished: boolean;
}
export function emptyMeta(): MetaState {
  return { title: "", description: "", visibility: "PUBLIC", visibleTo: [], isPublished: false };
}
interface Props {
  meta: MetaState;
  onChange: (m: MetaState) => void;
}
export default function ExerciseMeta({ meta, onChange }: Props) {
  const COURSES = useLevels();
  function set<K extends keyof MetaState>(key: K, val: MetaState[K]) {
    onChange({ ...meta, [key]: val });
  }
  function toggleClass(c: string) {
    const next = meta.visibleTo.includes(c)
      ? meta.visibleTo.filter((x) => x !== c)
      : [...meta.visibleTo, c];
    set("visibleTo", next);
  }
  return (
    <div className="card mb-6 space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Tiêu đề</label>
        <input type="text" value={meta.title} onChange={(e) => set("title", e.target.value)}
          placeholder="VD: Unit 3 — Present Perfect" className="input-field" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Mô tả</label>
        <input type="text" value={meta.description} onChange={(e) => set("description", e.target.value)}
          className="input-field" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Phân quyền</label>
        <select value={meta.visibility} onChange={(e) => set("visibility", e.target.value)} className="input-field">
          <option value="PUBLIC">Công khai (ai cũng thấy)</option>
          <option value="CLASS">Theo lớp</option>
        </select>
      </div>
      {meta.visibility === "CLASS" && (
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Chọn lớp</label>
          <div className="flex flex-wrap gap-2">
            {COURSES.map((c) => (
              <button key={c} type="button" onClick={() => toggleClass(c)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  meta.visibleTo.includes(c) ? "border-gold bg-gold/15 text-royal" : "border-silver/40 text-muted hover:border-gold/50"
                }`}>{c}</button>
            ))}
          </div>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm text-[#1a1a2e]">
        <input type="checkbox" checked={meta.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="h-4 w-4" />
        Đăng ngay (nếu không tick sẽ lưu nháp)
      </label>
    </div>
  );
}