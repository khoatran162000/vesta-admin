// FILE: src/components/exercise/HtmlGapEditor.tsx
// Editor gap giữ NGUYÊN HTML (bảng, màu, iframe) — contentEditable thuần, giống LearnClick.
// Không dùng TipTap vì StarterKit nuốt sạch table/style/iframe.
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { importLearnClickHtml } from "@/lib/learnclickImport";
import { api, getImageUrl } from "@/lib/api";
export type GapType = "TEXT" | "DROPDOWN" | "DRAG";
export interface GapDef { type: GapType; answers: string[]; options?: string[] }
export interface GapData { content: string; gaps: Record<string, GapDef> }
interface Props {
  initial?: GapData;
  onChange?: (d: GapData) => void;
}
const TOKEN_RE = /\[\[gap:([^\]]+)\]\]/g;
function escAttr(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escText(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// Style inline (không dùng class Tailwind — chip nằm trong innerHTML, tránh bị purge)
const CHIP_STYLE: Record<GapType, string> = {
  TEXT: "background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;",
  DROPDOWN: "background:#f3e8ff;color:#7e22ce;border:1px solid #d8b4fe;",
  DRAG: "background:#fef3c7;color:#b45309;border:1px solid #fcd34d;",
};
function chipHtml(id: string, type: GapType, answers: string, options: string) {
  const first = (answers.split("#")[0] || "").trim() || "___";
  return `<span class="vgap" contenteditable="false" data-gap-id="${escAttr(id)}" data-gtype="${type}" data-answers="${escAttr(answers)}" data-options="${escAttr(options)}" style="${CHIP_STYLE[type]}display:inline-flex;align-items:center;gap:4px;border-radius:4px;padding:1px 6px;margin:0 2px;font-size:0.9em;font-weight:600;cursor:pointer;user-select:none;vertical-align:baseline;"><b style="font-size:0.7em;opacity:0.55;">${escText(id)}</b>${escText(first)}</span>`;
}
function contentToChipHtml(content: string, gaps: Record<string, GapDef>) {
  return content.replace(TOKEN_RE, (_m, id) => {
    const g = gaps[String(id)] || { type: "TEXT" as GapType, answers: [] };
    return chipHtml(String(id), (g.type || "TEXT") as GapType, (g.answers || []).join("#"), (g.options || []).join(", "));
  });
}
function serializeHost(host: HTMLElement): GapData {
  const clone = host.cloneNode(true) as HTMLElement;
  const gaps: Record<string, GapDef> = {};
  clone.querySelectorAll<HTMLElement>("span.vgap").forEach((el) => {
    const id = el.getAttribute("data-gap-id") || "";
    const type = (el.getAttribute("data-gtype") as GapType) || "TEXT";
    const answers = String(el.getAttribute("data-answers") || "").split("#").map((s) => s.trim()).filter(Boolean);
    const options = String(el.getAttribute("data-options") || "").split(",").map((s) => s.trim()).filter(Boolean);
    gaps[id] = { type, answers, ...(type === "DROPDOWN" ? { options } : {}) };
    el.replaceWith(document.createTextNode(`[[gap:${id}]]`));
  });
  return { content: clone.innerHTML, gaps };
}
interface Editing { id: string; type: GapType; answers: string; options: string }
export default function HtmlGapEditor({ initial, onChange }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const savedRange = useRef<Range | null>(null);   // lưu vị trí con trỏ trước khi mở dialog ảnh
  const [pasteBox, setPasteBox] = useState("");
  const [showPaste, setShowPaste] = useState(!initial?.content);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [count, setCount] = useState(0);
  const [uploadingImg, setUploadingImg] = useState(false);
  const emit = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    const data = serializeHost(host);
    setCount(Object.keys(data.gaps).length);
    onChange?.(data);
  }, [onChange]);
  // Nạp nội dung ban đầu (1 lần) — React KHÔNG quản lý innerHTML của vùng này
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = initial?.content ? contentToChipHtml(initial.content, initial.gaps || {}) : "";
    emit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function nextId(host: HTMLElement) {
    let max = 0;
    host.querySelectorAll<HTMLElement>("span.vgap").forEach((el) => {
      const n = parseInt(el.getAttribute("data-gap-id") || "0", 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return max + 1;
  }
  function buildChipEl(id: string, type: GapType, answers: string, options: string) {
    const tmp = document.createElement("div");
    tmp.innerHTML = chipHtml(id, type, answers, options);
    return tmp.firstElementChild as HTMLElement;
  }
  // Bôi đen → tạo gap (Cmd+G / Ctrl+G hoặc bấm nút)
  const makeGap = useCallback((type: GapType) => {
    const host = hostRef.current;
    if (!host) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      alert("Hãy bôi đen một từ/cụm từ trước khi tạo chỗ trống");
      return;
    }
    const range = sel.getRangeAt(0);
    if (!host.contains(range.commonAncestorContainer)) return;
    const text = sel.toString().trim();
    if (!text) return;
    const id = String(nextId(host));
    const chip = buildChipEl(id, type, text, type === "DROPDOWN" ? text : "");
    range.deleteContents();
    range.insertNode(chip);
    sel.removeAllRanges();
    emit();
  }, [emit]);
  // Phím tắt Cmd+G / Ctrl+G
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        makeGap("TEXT");
      }
    }
    host.addEventListener("keydown", onKey);
    return () => host.removeEventListener("keydown", onKey);
  }, [makeGap]);
  // Lưu vị trí con trỏ hiện tại (trong editor) — gọi trước khi mở file dialog
  function rememberCursor() {
    const host = hostRef.current;
    const sel = window.getSelection();
    if (host && sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      if (host.contains(r.commonAncestorContainer)) savedRange.current = r.cloneRange();
      else savedRange.current = null;
    } else {
      savedRange.current = null;
    }
  }
  // Bấm nút "Chèn ảnh" → nhớ vị trí con trỏ rồi mở file dialog
  function pickImage() {
    rememberCursor();
    imgInputRef.current?.click();
  }
  // Upload ảnh → chèn <img> vào vị trí con trỏ đã lưu (hoặc cuối bài nếu không có)
  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const host = hostRef.current;
    if (!host) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post("/posts/upload-image", fd);
      if (!res.success) { alert(res.message || "Lỗi upload ảnh"); return; }
      const url = getImageUrl(res.data.url);
      // Tạo <img> — max-width 100% để không tràn khung, khối riêng cho dễ nhìn
      const img = document.createElement("img");
      img.src = url;
      img.setAttribute("style", "max-width:100%;height:auto;display:block;margin:8px auto;");
      // Chèn vào vị trí con trỏ đã lưu; nếu không có thì thêm cuối bài
      const range = savedRange.current;
      if (range && host.contains(range.commonAncestorContainer)) {
        range.collapse(false);
        range.insertNode(img);
        // đưa con trỏ ra sau ảnh
        range.setStartAfter(img);
        range.setEndAfter(img);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      } else {
        host.appendChild(img);
      }
      savedRange.current = null;
      emit();
    } catch {
      alert("Lỗi upload ảnh");
    } finally {
      setUploadingImg(false);
    }
  }
  // Dán trực tiếp vào editor: nếu có <a class="cloze"> thì tự đổi thành chip
  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const host = hostRef.current;
    if (!host) return;
    const html = e.clipboardData.getData("text/html");
    if (!html || !/class=["'][^"']*cloze/.test(html)) return; // dán thường → để trình duyệt lo
    e.preventDefault();
    const r = importLearnClickHtml(html, nextId(host));
    const frag = document.createRange().createContextualFragment(contentToChipHtml(r.content, r.gaps as any));
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(frag);
      sel.removeAllRanges();
    } else {
      host.appendChild(frag);
    }
    emit();
  }
  // Nạp từ ô dán HTML
  function loadFromPaste(mode: "replace" | "append") {
    const host = hostRef.current;
    if (!host) return;
    const raw = pasteBox.trim();
    if (!raw) return alert("Chưa dán HTML vào ô");
    const start = mode === "replace" ? 1 : nextId(host);
    const r = importLearnClickHtml(raw, start);
    const chips = contentToChipHtml(r.content, r.gaps as any);
    if (mode === "replace") host.innerHTML = chips;
    else host.insertAdjacentHTML("beforeend", chips);
    setPasteBox("");
    setShowPaste(false);
    emit();
    alert(
      r.count > 0
        ? `Đã nạp ${r.count} chỗ trống từ HTML.${r.skipped ? ` (${r.skipped} thẻ cloze rỗng bị bỏ qua)` : ""}`
        : "Đã nạp HTML nhưng KHÔNG thấy thẻ <a class=\"cloze\"> nào — bài sẽ chưa có chỗ trống. Bôi đen + Cmd+G để tự tạo."
    );
  }
  // Bấm chip → mở bảng sửa
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const chip = (e.target as HTMLElement).closest?.("span.vgap") as HTMLElement | null;
    if (!chip) return;
    setEditing({
      id: chip.getAttribute("data-gap-id") || "",
      type: (chip.getAttribute("data-gtype") as GapType) || "TEXT",
      answers: chip.getAttribute("data-answers") || "",
      options: chip.getAttribute("data-options") || "",
    });
  }
  function findChip(id: string): HTMLElement | null {
    return hostRef.current?.querySelector<HTMLElement>(`span.vgap[data-gap-id="${CSS.escape(id)}"]`) || null;
  }
  function applyEdit() {
    if (!editing) return;
    const chip = findChip(editing.id);
    if (!chip) { setEditing(null); return; }
    const fresh = buildChipEl(editing.id, editing.type, editing.answers, editing.options);
    chip.replaceWith(fresh);
    setEditing(null);
    emit();
  }
  function deleteGap() {
    if (!editing) return;
    const chip = findChip(editing.id);
    if (chip) chip.replaceWith(document.createTextNode(editing.answers.split("#")[0] || ""));
    setEditing(null);
    emit();
  }
  // Đánh lại số 1..n theo thứ tự xuất hiện
  function renumber() {
    const host = hostRef.current;
    if (!host) return;
    let i = 0;
    host.querySelectorAll<HTMLElement>("span.vgap").forEach((el) => {
      i++;
      const fresh = buildChipEl(
        String(i),
        (el.getAttribute("data-gtype") as GapType) || "TEXT",
        el.getAttribute("data-answers") || "",
        el.getAttribute("data-options") || ""
      );
      el.replaceWith(fresh);
    });
    emit();
  }
  return (
    <div>
      {/* Ô dán HTML từ LearnClick */}
      <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-800">Dán HTML từ LearnClick</span>
          <button type="button" onClick={() => setShowPaste((v) => !v)} className="text-xs font-medium text-blue-700 hover:underline">
            {showPaste ? "Thu gọn" : "Mở ô dán"}
          </button>
        </div>
        {showPaste && (
          <>
            <p className="mt-1 text-[0.7rem] text-blue-700">
              Bên LearnClick bấm <b>Edit HTML Source</b> → copy toàn bộ → dán vào đây. Thẻ <code>&lt;a class="cloze"&gt;</code> sẽ tự thành chỗ trống.
            </p>
            <textarea
              value={pasteBox}
              onChange={(e) => setPasteBox(e.target.value)}
              rows={5}
              placeholder='<p>In many cities, <a class="cloze" href="#">transport</a> is ...'
              className="mt-2 w-full rounded-lg border border-blue-300 p-2 font-mono text-xs"
            />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => loadFromPaste("replace")} className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700">
                Nạp (thay toàn bộ)
              </button>
              <button type="button" onClick={() => loadFromPaste("append")} className="rounded border border-blue-400 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                Nạp thêm vào cuối
              </button>
            </div>
          </>
        )}
      </div>
      {/* Thanh công cụ */}
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <span className="text-xs font-medium text-gray-500">Bôi đen rồi bấm (hoặc <b>⌘G / Ctrl+G</b>):</span>
        <button type="button" onClick={() => makeGap("TEXT")} className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700">+ Ô điền</button>
        <button type="button" onClick={() => makeGap("DROPDOWN")} className="rounded bg-purple-600 px-3 py-1 text-xs font-bold text-white hover:bg-purple-700">+ Dropdown</button>
        <button type="button" onClick={() => makeGap("DRAG")} className="rounded bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-700">+ Kéo-thả</button>
        <span className="mx-1 h-4 w-px bg-gray-300" />
        <button type="button" onClick={pickImage} disabled={uploadingImg} className="rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
          {uploadingImg ? "Đang tải ảnh..." : "🖼 Chèn ảnh"}
        </button>
        <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
        <span className="mx-1 h-4 w-px bg-gray-300" />
        <button type="button" onClick={renumber} className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">Đánh lại số</button>
        <span className="ml-auto text-xs text-gray-500">Đang có <b>{count}</b> chỗ trống</span>
      </div>
      {/* Vùng soạn — giữ nguyên HTML */}
      <style>{`
        /* HTML từ LearnClick fix cứng width="1300" → ép co vừa khung khi soạn, hết kéo ngang.
           CHỈ là CSS hiển thị — nội dung lưu xuống DB vẫn giữ nguyên width gốc. */
        .gap-edit-host table { width: 100% !important; max-width: 100% !important; }
        .gap-edit-host td, .gap-edit-host th { overflow-wrap: anywhere; }
        .gap-edit-host img, .gap-edit-host iframe, .gap-edit-host video { max-width: 100%; }
      `}</style>
      <div className="overflow-x-auto rounded-lg border border-gray-300 focus-within:border-amber-400">
        <div
          ref={hostRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onPaste={handlePaste}
          onClick={handleClick}
          onKeyUp={rememberCursor}
          onMouseUp={rememberCursor}
          className="gap-edit-host min-h-[220px] p-4 focus:outline-none"
        />
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Bấm vào chip để sửa đáp án / đổi dạng. Nhiều đáp án ngăn bằng dấu #. Đặt con trỏ vào chỗ cần rồi bấm <b>Chèn ảnh</b> để thêm hình.
      </p>
      {/* Bảng sửa chip */}
      {editing && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Chỗ trống #{editing.id}</div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Loại</label>
          <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as GapType })}
            className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm">
            <option value="TEXT">Điền đáp án (gõ)</option>
            <option value="DROPDOWN">Dropdown (chọn)</option>
            <option value="DRAG">Kéo-thả</option>
          </select>
          <label className="mb-1 block text-xs font-medium text-gray-600">Đáp án đúng (nhiều đáp án ngăn bằng #)</label>
          <input type="text" value={editing.answers} onChange={(e) => setEditing({ ...editing, answers: e.target.value })}
            placeholder="vd: color#colour" className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm" />
          {editing.type === "DROPDOWN" && (
            <>
              <label className="mb-1 block text-xs font-medium text-gray-600">Lựa chọn dropdown (ngăn bằng dấu ,)</label>
              <input type="text" value={editing.options} onChange={(e) => setEditing({ ...editing, options: e.target.value })}
                placeholder="vd: here, there, at home" className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm" />
            </>
          )}
          <div className="flex items-center justify-between">
            <button type="button" onClick={deleteGap} className="text-xs font-medium text-red-600 hover:underline">Xoá chỗ trống</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded border border-gray-300 px-3 py-1 text-xs">Huỷ</button>
              <button type="button" onClick={applyEdit} className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white">Xong</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}