"use client";
import { useState } from "react";
import GapEditor, { GapData } from "@/components/exercise/GapEditor";

// Data mẫu giả lập "bài đã lưu trong DB" để test deserialize
const SAMPLE: GapData = {
  content: "The sky is [[gap:1]] and grass is [[gap:2]] in [[gap:3]].",
  gaps: {
    "1": { type: "TEXT", answers: ["blue", "azure"] },
    "2": { type: "DROPDOWN", answers: ["green"], options: ["green", "red", "yellow"] },
    "3": { type: "DRAG", answers: ["spring"] },
  },
};

export default function TestGapPage() {
  const [data, setData] = useState<GapData>({ content: "", gaps: {} });
  const [loadSample, setLoadSample] = useState(false);
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-xl font-bold">Test Gap Editor</h1>
      <button
        onClick={() => setLoadSample((v) => !v)}
        className="mb-4 rounded bg-green-600 px-3 py-1 text-sm font-bold text-white"
      >
        {loadSample ? "Tạo mới (rỗng)" : "Load bài mẫu (test deserialize)"}
      </button>

      {/* key đổi để remount editor khi đổi chế độ */}
      <GapEditor
        key={loadSample ? "sample" : "empty"}
        initial={loadSample ? SAMPLE : undefined}
        onChange={setData}
      />

      <h2 className="mt-6 mb-2 font-bold">Serialize output:</h2>
      <pre className="overflow-auto rounded bg-gray-900 p-4 text-xs text-green-300">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}