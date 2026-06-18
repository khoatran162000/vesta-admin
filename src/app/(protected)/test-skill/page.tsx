"use client";
import { useState } from "react";
import SkillGrid, { SkillGridData, makeEmptySkillGrid } from "@/components/report/SkillGrid";

export default function TestSkillPage() {
  const [grid, setGrid] = useState<SkillGridData>(makeEmptySkillGrid());
  return (
    <div className="mx-auto max-w-[1300px] p-4">
      <h1 className="mb-4 text-xl font-bold text-royal">Test Skill Grid (cuối khóa)</h1>
      <SkillGrid value={grid} onChange={setGrid} />
      <pre className="mt-6 max-h-80 overflow-auto rounded bg-gray-900 p-4 text-xs text-green-300">
        {JSON.stringify(grid, null, 2)}
      </pre>
    </div>
  );
}