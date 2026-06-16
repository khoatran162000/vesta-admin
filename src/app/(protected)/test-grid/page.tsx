"use client";
import { useState } from "react";
import ReportGrid, { ReportGridData, makeEmptyGrid } from "@/components/report/ReportGrid";

export default function TestGridPage() {
  const [grid, setGrid] = useState<ReportGridData>(makeEmptyGrid());
  return (
    <div className="mx-auto max-w-[1200px] p-4">
      <h1 className="mb-4 text-xl font-bold text-royal">Test Report Grid</h1>
      <ReportGrid value={grid} onChange={setGrid} />
      <h2 className="mt-6 mb-2 font-bold">Dữ liệu grid (JSON):</h2>
      <pre className="max-h-80 overflow-auto rounded bg-gray-900 p-4 text-xs text-green-300">
        {JSON.stringify(grid, null, 2)}
      </pre>
    </div>
  );
}