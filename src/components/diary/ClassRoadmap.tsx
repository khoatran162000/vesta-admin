// FILE: src/components/diary/ClassRoadmap.tsx
// Lộ trình lớp hiển thị DỌC — bài hiện tại highlight, bài khác mờ. GV click để chọn bài đang học.
"use client";
import { PROGRAMS, flatten, type Program } from "@/lib/classCurriculum";

interface Props {
  programKey: string;         // p4/p5/p6/p7/p789
  currentN: number;           // số bài hiện tại (1-based); 0 = chưa chọn
  onPick?: (n: number, label: string) => void;  // click 1 bài
  compact?: boolean;          // thu gọn (dùng khi xuất PNG)
}

// Màu chủ đạo VESTA
const GOLD = "#C9A84C";
const NAVY = "#1B2A5B";

export default function ClassRoadmap({ programKey, currentN, onPick, compact }: Props) {
  const prog: Program | undefined = PROGRAMS[programKey];
  if (!prog) return <div className="text-sm text-muted">Chưa chọn chương trình.</div>;

  const flat = flatten(prog);
  const isPast = (n: number) => n < currentN;
  const isNow = (n: number) => n === currentN;

  // Style 1 dòng bài theo trạng thái
  function lessonClass(n: number) {
    if (isNow(n)) return "bg-[#1B2A5B] text-white font-semibold shadow-sm";
    if (isPast(n)) return "text-gray-400 line-through decoration-gray-300";
    return "text-gray-500";
  }

  // ─── Render: lớp theo BUỔI (789: list số; 7+: 3 khối) ───
  if (prog.flatItems) {
    // 789 — 60 buổi đánh số
    return (
      <div className={compact ? "text-[10px]" : "text-xs"}>
        <RoadmapHeader prog={prog} currentN={currentN} total={flat.length} />
        <div className="grid grid-cols-2 gap-1">
          {flat.map((l) => (
            <button key={l.n} type="button" onClick={() => onPick?.(l.n, l.label)}
              className={`rounded px-2 py-1 text-left transition-colors ${lessonClass(l.n)} ${!isNow(l.n) && !isPast(l.n) ? "hover:bg-gray-100" : ""}`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (prog.sections) {
    // 7+ — 3 khối (Writing 1 / Writing 2 / Speaking)
    let running = 0;
    return (
      <div className={compact ? "text-[10px]" : "text-xs"}>
        <RoadmapHeader prog={prog} currentN={currentN} total={flat.length} />
        <div className="space-y-3">
          {prog.sections.map((sec, si) => (
            <div key={si}>
              <div className="mb-1 border-l-4 pl-2 font-bold" style={{ borderColor: GOLD, color: NAVY }}>{sec.title}</div>
              <div className="space-y-0.5 pl-1">
                {sec.items.map((lb) => {
                  running++;
                  const n = running;
                  return (
                    <button key={n} type="button" onClick={() => onPick?.(n, lb)}
                      className={`block w-full rounded px-2 py-1 text-left transition-colors ${lessonClass(n)} ${!isNow(n) && !isPast(n) ? "hover:bg-gray-100" : ""}`}>
                      <span className="mr-1.5 opacity-50">{n}.</span>{lb}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Render: lớp theo UNIT (4+/5+/6+) ───
  let running = 0;
  return (
    <div className={compact ? "text-[10px]" : "text-xs"}>
      <RoadmapHeader prog={prog} currentN={currentN} total={flat.length} />
      <div className="space-y-2.5">
        {prog.units!.map((u, ui) => (
          <div key={ui}>
            <div className="mb-1 flex items-center gap-1.5 font-bold" style={{ color: NAVY }}>
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />
              {u.title}
            </div>
            <div className="space-y-0.5 pl-3">
              {u.lessons.map((l) => {
                running++;
                const n = running;
                return (
                  <button key={n} type="button" onClick={() => onPick?.(n, l.label)}
                    className={`block w-full rounded px-2 py-1 text-left transition-colors ${lessonClass(n)} ${!isNow(n) && !isPast(n) ? "hover:bg-gray-100" : ""}`}>
                    <span className="mr-1.5 opacity-50">{n}.</span>{l.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapHeader({ prog, currentN, total }: { prog: Program; currentN: number; total: number }) {
  return (
    <div className="mb-2 rounded-lg px-3 py-2" style={{ background: "#1B2A5B" }}>
      <div className="font-bold text-white">{prog.name}</div>
      <div className="text-[0.7rem] text-white/70">
        {prog.meta}{prog.totalWeeks ? ` · ${prog.totalWeeks} tuần` : ""} · {currentN > 0 ? `Đang ở buổi ${currentN}/${total}` : "Chưa chọn buổi"}
      </div>
    </div>
  );
}