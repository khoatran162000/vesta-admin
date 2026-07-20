// FILE: src/components/exercise/GapNode.tsx
// Custom TipTap inline node cho "chỗ trống" kiểu LearnClick
"use client";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";
export type GapType = "TEXT" | "DROPDOWN" | "DRAG";
// ─── React view: hiển thị chip + popup chỉnh sửa ───
function GapView(props: any) {
  const { node, updateAttributes, deleteNode, editor } = props;
  const [open, setOpen] = useState(false);
  const gapId: string = node.attrs.gapId;
  const type: GapType = node.attrs.type || "TEXT";
  const answers: string = node.attrs.answers || "";
  const options: string = node.attrs.options || "";
  const hint: string = node.attrs.hint || "";
  const editable = editor?.isEditable;
  const typeColor =
    type === "TEXT" ? "bg-blue-100 text-blue-700 border-blue-300"
    : type === "DROPDOWN" ? "bg-purple-100 text-purple-700 border-purple-300"
    : "bg-amber-100 text-amber-700 border-amber-300";
  const typeLabel = type === "TEXT" ? "Điền" : type === "DROPDOWN" ? "Dropdown" : "Kéo-thả";
  const firstAnswer = answers.split("#")[0]?.trim() || "___";
  return (
    <NodeViewWrapper as="span" className="inline-block align-baseline">
      <span className="relative inline-block">
        <button
          type="button"
          contentEditable={false}
          onClick={() => editable && setOpen((o) => !o)}
          className={`mx-0.5 inline-flex items-center gap-1 rounded border px-2 py-0.5 text-sm font-medium ${typeColor} ${editable ? "cursor-pointer hover:brightness-95" : "cursor-default"}`}
          title={`Gap #${gapId} (${typeLabel})`}
        >
          <span className="text-[0.65rem] font-bold opacity-60">{gapId}</span>
          <span>{firstAnswer}</span>
          {hint && <span className="text-[0.7rem]" title="Có gợi ý">💡</span>}
        </button>
        {open && editable && (
          <span
            contentEditable={false}
            className="absolute left-0 top-full z-50 mt-1 block w-72 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-xl"
          >
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Chỗ trống #{gapId}
            </span>
            <label className="mb-1 block text-xs font-medium text-gray-600">Loại</label>
            <select
              value={type}
              onChange={(e) => updateAttributes({ type: e.target.value })}
              className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="TEXT">Điền đáp án (gõ)</option>
              <option value="DROPDOWN">Dropdown (chọn)</option>
              <option value="DRAG">Kéo-thả</option>
            </select>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Đáp án đúng (nhiều đáp án ngăn bằng #)
            </label>
            <input
              type="text"
              value={answers}
              onChange={(e) => updateAttributes({ answers: e.target.value })}
              placeholder="vd: color#colour"
              className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
            {type === "DROPDOWN" && (
              <>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Lựa chọn dropdown (ngăn bằng dấu ,)
                </label>
                <input
                  type="text"
                  value={options}
                  onChange={(e) => updateAttributes({ options: e.target.value })}
                  placeholder="vd: here, there, at home"
                  className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </>
            )}
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Gợi ý (tuỳ chọn — để trống sẽ tự gợi ý chữ cái đầu)
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => updateAttributes({ hint: e.target.value })}
              placeholder="vd: động từ chỉ xu hướng tăng"
              className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <span className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { deleteNode(); }}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Xoá chỗ trống
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white"
              >
                Xong
              </button>
            </span>
          </span>
        )}
      </span>
    </NodeViewWrapper>
  );
}
// ─── Node definition ───
export const GapNode = Node.create({
  name: "gap",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      gapId: { default: "1" },
      type: { default: "TEXT" },
      answers: { default: "" },
      options: { default: "" },
      hint: { default: "" },    // gợi ý tay (để trống → tự sinh khi render cho HS)
    };
  },
  parseHTML() {
    return [{ tag: "span[data-gap]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-gap": "" })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(GapView);
  },
});