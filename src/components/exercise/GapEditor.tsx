// FILE: src/components/exercise/GapEditor.tsx
// Editor tạo bài tập kiểu LearnClick: gõ văn bản, bôi đen từ → tạo gap
"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useCallback } from "react";
import { GapNode } from "./GapNode";

export interface GapDef {
  type: "TEXT" | "DROPDOWN" | "DRAG";
  answers: string[];
  options?: string[];
}
export interface GapData {
  content: string;            // "Yellow is [[gap:1]]..."
  gaps: Record<string, GapDef>;
}

interface Props {
  initial?: GapData;          // để load bài cũ (sửa)
  onChange?: (data: GapData) => void;
}

// ─── Serialize: TipTap doc → { content, gaps } ───
function serialize(editor: any): GapData {
  const gaps: Record<string, GapDef> = {};
  let content = "";

  editor.state.doc.descendants((node: any) => {
    if (node.type.name === "gap") {
      const id = String(node.attrs.gapId);
      content += `[[gap:${id}]]`;
      gaps[id] = {
        type: node.attrs.type || "TEXT",
        answers: String(node.attrs.answers || "")
          .split("#").map((s: string) => s.trim()).filter(Boolean),
        ...(node.attrs.type === "DROPDOWN"
          ? { options: String(node.attrs.options || "").split(",").map((s: string) => s.trim()).filter(Boolean) }
          : {}),
      };
      return false; // không đi sâu vào trong gap (atom)
    }
    if (node.isText) {
      content += node.text;
    }
    // Xuống dòng giữa các paragraph
    if (node.type.name === "paragraph" && content && !content.endsWith("\n")) {
      // thêm newline SAU mỗi paragraph (xử lý ở leave — đơn giản hoá: thêm khi gặp paragraph kế)
    }
    return true;
  });

  return { content: content.trim(), gaps };
}

// ─── Deserialize: { content, gaps } → TipTap JSON content ───
function buildInitialContent(data?: GapData): any {
  if (!data || !data.content) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  // Tách content theo token [[gap:N]]
  const parts = data.content.split(/(\[\[gap:[^\]]+\]\])/g);
  const inline: any[] = [];
  for (const part of parts) {
    const m = part.match(/^\[\[gap:([^\]]+)\]\]$/);
    if (m) {
      const id = m[1];
      const g = data.gaps[id] || { type: "TEXT", answers: [] };
      inline.push({
        type: "gap",
        attrs: {
          gapId: id,
          type: g.type || "TEXT",
          answers: (g.answers || []).join("#"),
          options: (g.options || []).join(", "),
        },
      });
    } else if (part.length > 0) {
      inline.push({ type: "text", text: part });
    }
  }
  return { type: "doc", content: [{ type: "paragraph", content: inline.length ? inline : undefined }] };
}

export default function GapEditor({ initial, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, GapNode],
    content: buildInitialContent(initial),
    immediatelyRender: false,   // tránh hydration mismatch Next.js
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[160px] rounded-lg border border-gray-300 p-4 focus:outline-none focus:border-amber-400",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(serialize(editor));
    },
  });

  // Tạo gap từ phần text đang bôi đen
  const makeGap = useCallback((type: "TEXT" | "DROPDOWN" | "DRAG") => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ").trim();
    if (!selectedText) {
      alert("Hãy bôi đen một từ/cụm từ trước khi tạo chỗ trống");
      return;
    }
    // Tính gapId kế tiếp
    let maxId = 0;
    editor.state.doc.descendants((node: any) => {
      if (node.type.name === "gap") {
        const n = parseInt(node.attrs.gapId, 10);
        if (!isNaN(n) && n > maxId) maxId = n;
      }
    });
    const newId = String(maxId + 1);

    editor.chain().focus()
      .deleteSelection()
      .insertContent({
        type: "gap",
        attrs: {
          gapId: newId,
          type,
          answers: selectedText,          // đáp án mặc định = từ vừa bôi
          options: type === "DROPDOWN" ? selectedText : "",
        },
      })
      .run();
  }, [editor]);

  // Đánh lại số gap liên tục (1,2,3...) sau khi xoá gap giữa chừng
  const renumber = useCallback(() => {
    if (!editor) return;
    let i = 0;
    const tr = editor.state.tr;
    editor.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === "gap") {
        i++;
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, gapId: String(i) });
      }
    });
    editor.view.dispatch(tr);
    onChange?.(serialize(editor));
  }, [editor, onChange]);

  useEffect(() => {
    return () => { editor?.destroy(); };
  }, [editor]);

  if (!editor) return <div className="text-sm text-gray-400">Đang tải editor…</div>;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <span className="text-xs font-medium text-gray-500">Bôi đen từ rồi bấm:</span>
        <button type="button" onClick={() => makeGap("TEXT")}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700">
          + Ô điền
        </button>
        <button type="button" onClick={() => makeGap("DROPDOWN")}
          className="rounded bg-purple-600 px-3 py-1 text-xs font-bold text-white hover:bg-purple-700">
          + Dropdown
        </button>
        <button type="button" onClick={() => makeGap("DRAG")}
          className="rounded bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-700">
          + Kéo-thả
        </button>
        <span className="mx-1 h-4 w-px bg-gray-300" />
        <button type="button" onClick={renumber}
          className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">
          Đánh lại số
        </button>
      </div>
      <EditorContent editor={editor} />
      <p className="mt-2 text-xs text-gray-400">
        Mẹo: bấm vào chip để sửa đáp án / loại. Nhiều đáp án ngăn bằng dấu #.
      </p>
    </div>
  );
}