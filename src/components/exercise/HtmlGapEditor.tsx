// FILE: src/components/exercise/HtmlGapEditor.tsx
// Editor gap giữ NGUYÊN HTML (bảng, màu, iframe) — contentEditable thuần, giống LearnClick.
"use client";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { importLearnClickHtml } from "@/lib/learnclickImport";
import { api, getImageUrl } from "@/lib/api";
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, RemoveFormatting, Undo2 } from "lucide-react";
export type GapType = "TEXT" | "DROPDOWN" | "DRAG";
export interface GapDef { type: GapType; answers: string[]; options?: string[]; hint?: string }
export interface GapData { content: string; gaps: Record<string, GapDef> }
export interface HtmlGapEditorHandle { getData: () => GapData }
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
const CHIP_STYLE: Record<GapType, string> = {
  TEXT: "background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;",
  DROPDOWN: "background:#f3e8ff;color:#7e22ce;border:1px solid #d8b4fe;",
  DRAG: "background:#fef3c7;color:#b45309;border:1px solid #fcd34d;",
};
function chipHtml(id: string, type: GapType, answers: string, options: string, hint = "") {
  const first = (answers.split("#")[0] || "").trim() || "___";
  const hintMark = hint.trim() ? `<span style="font-size:0.7em;">💡</span>` : "";
  return `<span class="vgap" contenteditable="false" data-gap-id="${escAttr(id)}" data-gtype="${type}" data-answers="${escAttr(answers)}" data-options="${escAttr(options)}" data-hint="${escAttr(hint)}" style="${CHIP_STYLE[type]}display:inline-flex;align-items:center;gap:4px;border-radius:4px;padding:1px 6px;margin:0 2px;font-size:0.9em;font-weight:600;cursor:pointer;user-select:none;vertical-align:baseline;"><b style="font-size:0.7em;opacity:0.55;">${escText(id)}</b>${escText(first)}${hintMark}</span>`;
}
function contentToChipHtml(content: string, gaps: Record<string, GapDef>) {
  return content.replace(TOKEN_RE, (_m, id) => {
    const g = gaps[String(id)] || { type: "TEXT" as GapType, answers: [] };
    return chipHtml(String(id), (g.type || "TEXT") as GapType, (g.answers || []).join("#"), (g.options || []).join(", "), g.hint || "");
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
    const hint = String(el.getAttribute("data-hint") || "").trim();
    gaps[id] = { type, answers, ...(type === "DROPDOWN" ? { options } : {}), ...(hint ? { hint } : {}) };
    el.replaceWith(document.createTextNode(`[[gap:${id}]]`));
  });
  return { content: clone.innerHTML, gaps };
}
interface Editing { id: string; type: GapType; answers: string; options: string; hint: string }
const HtmlGapEditor = forwardRef<HtmlGapEditorHandle, Props>(function HtmlGapEditor({ initial, onChange }, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const savedRange = useRef<Range | null>(null);
  const [pasteBox, setPasteBox] = useState("");
  const [showPaste, setShowPaste] = useState(!initial?.content);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [count, setCount] = useState(0);
  const [uploadingImg, setUploadingImg] = useState(false);
  // ── Undo stack (thao tác gap không vào undo của trình duyệt → tự quản) ──
  const undoStack = useRef<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  useImperativeHandle(ref, () => ({
    getData: () => {
      const host = hostRef.current;
      if (!host) return { content: "", gaps: {} };
      return serializeHost(host);
    },
  }), []);
  const emit = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    const data = serializeHost(host);
    setCount(Object.keys(data.gaps).length);
    onChange?.(data);
  }, [onChange]);
  const pushUndo = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    undoStack.current.push(host.innerHTML);
    if (undoStack.current.length > 40) undoStack.current.shift();
    setCanUndo(true);
  }, []);
  const undo = useCallback(() => {
    const host = hostRef.current;
    if (!host || undoStack.current.length === 0) return;
    const prev = undoStack.current.pop()!;
    host.innerHTML = prev;
    setCanUndo(undoStack.current.length > 0);
    emit();
  }, [emit]);
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
  function buildChipEl(id: string, type: GapType, answers: string, options: string, hint = "") {
    const tmp = document.createElement("div");
    tmp.innerHTML = chipHtml(id, type, answers, options, hint);
    return tmp.firstElementChild as HTMLElement;
  }
  function exec(command: string, value?: string) {
    const host = hostRef.current;
    if (!host) return;
    host.focus();
    try { document.execCommand(command, false, value); } catch {}
    emit();
  }
  function applyFontSize(px: string) {
    const host = hostRef.current;
    if (!host || !px) return;
    host.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!host.contains(range.commonAncestorContainer)) return;
    const span = document.createElement("span");
    span.style.fontSize = `${px}px`;
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      sel.removeAllRanges();
    } catch {}
    emit();
  }
  // Bôi đen → tạo gap
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
    pushUndo();
    const id = String(nextId(host));
    const chip = buildChipEl(id, type, text, type === "DROPDOWN" ? text : "");
    range.deleteContents();
    range.insertNode(chip);
    sel.removeAllRanges();
    emit();
  }, [emit, pushUndo]);
  // ── #2 Đổi dạng TẤT CẢ chip nằm trong vùng bôi đen ──
  const changeSelectedGaps = useCallback((type: GapType) => {
    const host = hostRef.current;
    if (!host) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      alert("Hãy bôi đen vùng chứa các chỗ trống cần đổi dạng");
      return;
    }
    const range = sel.getRangeAt(0);
    if (!host.contains(range.commonAncestorContainer)) return;
    const chips = Array.from(host.querySelectorAll<HTMLElement>("span.vgap")).filter((el) => range.intersectsNode(el));
    if (!chips.length) { alert("Vùng chọn không có chỗ trống nào"); return; }
    if (!confirm(`Đổi ${chips.length} chỗ trống sang dạng ${type === "TEXT" ? "Ô điền" : type === "DROPDOWN" ? "Dropdown" : "Kéo-thả"}?`)) return;
    pushUndo();
    chips.forEach((el) => {
      const id = el.getAttribute("data-gap-id") || "";
      const answers = el.getAttribute("data-answers") || "";
      const options = el.getAttribute("data-options") || (type === "DROPDOWN" ? answers : "");
      const hint = el.getAttribute("data-hint") || "";
      el.replaceWith(buildChipEl(id, type, answers, options, hint));
    });
    sel.removeAllRanges();
    emit();
  }, [emit, pushUndo]);
  // ── #1 Tạo gap HÀNG LOẠT từ [đáp án] hoặc [đáp án|opt1,opt2] trong vùng chọn (hoặc cả bài nếu không bôi) ──
  const makeGapsFromBrackets = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    const sel = window.getSelection();
    let container: HTMLElement = host;
    const hasSelection = !!(sel && sel.rangeCount > 0 && !sel.isCollapsed && host.contains(sel.getRangeAt(0).commonAncestorContainer));
    if (hasSelection) {
      const anc = sel!.getRangeAt(0).commonAncestorContainer;
      container = (anc.nodeType === 1 ? (anc as HTMLElement) : anc.parentElement) as HTMLElement || host;
    }
    const BR_TEST = /\[([^\[\]]+)\]/;
    // Duyệt các text node — KHÔNG đụng bên trong chip (span.vgap)
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.parentElement?.closest("span.vgap")) return NodeFilter.FILTER_REJECT;
        if (hasSelection && !sel!.getRangeAt(0).intersectsNode(node)) return NodeFilter.FILTER_REJECT;
        return BR_TEST.test(node.nodeValue || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const targets: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) targets.push(node as Text);
    if (!targets.length) {
      alert("Không tìm thấy [đáp án] nào.\nHãy bọc đáp án trong dấu ngoặc vuông, vd: [transport] hoặc dropdown [freezes|melts, freezes, boils]");
      return;
    }
    pushUndo();
    let created = 0;
    let id = nextId(host);
    for (const textNode of targets) {
      const raw = textNode.nodeValue || "";
      const frag = document.createDocumentFragment();
      let last = 0;
      const re = /\[([^\[\]]+)\]/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(raw))) {
        if (m.index > last) frag.appendChild(document.createTextNode(raw.slice(last, m.index)));
        const inner = m[1].trim();
        let type: GapType = "TEXT";
        let answers = inner;
        let options = "";
        if (inner.includes("|")) {
          const [ans, opts] = inner.split("|");
          answers = ans.trim();
          options = (opts || "").trim();
          type = "DROPDOWN";
        }
        frag.appendChild(buildChipEl(String(id++), type, answers, options));
        created++;
        last = m.index + m[0].length;
      }
      if (last < raw.length) frag.appendChild(document.createTextNode(raw.slice(last)));
      textNode.replaceWith(frag);
    }
    if (sel) sel.removeAllRanges();
    emit();
    alert(`Đã tạo ${created} chỗ trống từ [ ].`);
  }, [emit, pushUndo]);
  // Phím tắt: ⌘G/⌘D/⌘K tạo gap; ⌘⇧Z hoàn tác gap
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (e.shiftKey && k === "z") { e.preventDefault(); undo(); return; }
      if (e.shiftKey) return;
      if (k === "g") { e.preventDefault(); makeGap("TEXT"); }
      else if (k === "d") { e.preventDefault(); makeGap("DROPDOWN"); }
      else if (k === "k") { e.preventDefault(); makeGap("DRAG"); }
    }
    host.addEventListener("keydown", onKey);
    return () => host.removeEventListener("keydown", onKey);
  }, [makeGap, undo]);
  function rememberCursor() {
    const host = hostRef.current;
    const sel = window.getSelection();
    if (host && sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      if (host.contains(r.commonAncestorContainer) && r.commonAncestorContainer !== host.parentNode) {
        savedRange.current = r.cloneRange();
        return;
      }
    }
    savedRange.current = null;
  }
  function pickImage() {
    rememberCursor();
    imgInputRef.current?.click();
  }
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
      pushUndo();
      const img = document.createElement("img");
      img.src = url;
      img.setAttribute("style", "max-width:100%;height:auto;display:block;margin:8px auto;cursor:pointer;");
      const range = savedRange.current;
      const validRange = range && host.contains(range.commonAncestorContainer) && range.commonAncestorContainer !== host.parentNode;
      if (validRange) {
        range!.collapse(false);
        range!.insertNode(img);
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
  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const host = hostRef.current;
    if (!host) return;
    const html = e.clipboardData.getData("text/html");
    if (!html || !/class=["'][^"']*cloze/.test(html)) return;
    e.preventDefault();
    pushUndo();
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
  function loadFromPaste(mode: "replace" | "append") {
    const host = hostRef.current;
    if (!host) return;
    const raw = pasteBox.trim();
    if (!raw) return alert("Chưa dán HTML vào ô");
    pushUndo();
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
        : "Đã nạp HTML nhưng KHÔNG thấy thẻ cloze nào (a.cloze / span.cloze) — bài sẽ chưa có chỗ trống. Bôi đen + Cmd+G để tự tạo."
    );
  }
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      if (confirm("Xoá ảnh này khỏi bài?")) {
        pushUndo();
        savedRange.current = null;
        target.remove();
        emit();
      }
      return;
    }
    const chip = target.closest?.("span.vgap") as HTMLElement | null;
    if (!chip) return;
    setEditing({
      id: chip.getAttribute("data-gap-id") || "",
      type: (chip.getAttribute("data-gtype") as GapType) || "TEXT",
      answers: chip.getAttribute("data-answers") || "",
      options: chip.getAttribute("data-options") || "",
      hint: chip.getAttribute("data-hint") || "",
    });
  }
  function findChip(id: string): HTMLElement | null {
    return hostRef.current?.querySelector<HTMLElement>(`span.vgap[data-gap-id="${CSS.escape(id)}"]`) || null;
  }
  function applyEdit() {
    if (!editing) return;
    const chip = findChip(editing.id);
    if (!chip) { setEditing(null); return; }
    pushUndo();
    const fresh = buildChipEl(editing.id, editing.type, editing.answers, editing.options, editing.hint);
    chip.replaceWith(fresh);
    setEditing(null);
    emit();
  }
  function deleteGap() {
    if (!editing) return;
    const chip = findChip(editing.id);
    if (chip) { pushUndo(); chip.replaceWith(document.createTextNode(editing.answers.split("#")[0] || "")); }
    setEditing(null);
    emit();
  }
  function renumber() {
    const host = hostRef.current;
    if (!host) return;
    pushUndo();
    let i = 0;
    host.querySelectorAll<HTMLElement>("span.vgap").forEach((el) => {
      i++;
      const fresh = buildChipEl(
        String(i),
        (el.getAttribute("data-gtype") as GapType) || "TEXT",
        el.getAttribute("data-answers") || "",
        el.getAttribute("data-options") || "",
        el.getAttribute("data-hint") || ""
      );
      el.replaceWith(fresh);
    });
    emit();
  }
  const fmtBtn = "flex items-center justify-center rounded p-1.5 text-gray-600 hover:bg-gray-200";
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
              Bên LearnClick bấm <b>Edit HTML Source</b> → copy toàn bộ → dán vào đây. Thẻ <code>cloze</code> (a hoặc span) sẽ tự thành chỗ trống. Nhiều đáp án ngăn bằng <b>#</b>.
            </p>
            <textarea
              value={pasteBox}
              onChange={(e) => setPasteBox(e.target.value)}
              rows={5}
              placeholder='<p>In many cities, <span class="cloze">transport</span> is ...'
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
      {/* Thanh công cụ tạo gap + chèn ảnh */}
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <span className="text-xs font-medium text-gray-500">Bôi đen rồi bấm (hoặc phím tắt):</span>
        <button type="button" onClick={() => makeGap("TEXT")} className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700">+ Ô điền <span className="opacity-60">⌘G</span></button>
        <button type="button" onClick={() => makeGap("DROPDOWN")} className="rounded bg-purple-600 px-3 py-1 text-xs font-bold text-white hover:bg-purple-700">+ Dropdown <span className="opacity-60">⌘D</span></button>
        <button type="button" onClick={() => makeGap("DRAG")} className="rounded bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-700">+ Kéo-thả <span className="opacity-60">⌘K</span></button>
        <span className="mx-1 h-4 w-px bg-gray-300" />
        {/* #1 Tạo gap hàng loạt từ [đáp án] */}
        <button type="button" onClick={makeGapsFromBrackets} className="rounded bg-teal-600 px-3 py-1 text-xs font-bold text-white hover:bg-teal-700" title="Bọc đáp án trong [ ] rồi bấm để tạo hàng loạt. Có dấu | thành dropdown.">⚡ Tạo gap từ [ ]</button>
        <span className="mx-1 h-4 w-px bg-gray-300" />
        {/* #2 Đổi dạng cả vùng chọn */}
        <select defaultValue="" onChange={(e) => { const v = e.target.value as GapType; e.currentTarget.value = ""; if (v) changeSelectedGaps(v); }}
          className="rounded border border-gray-400 bg-white px-2 py-1 text-xs font-medium text-gray-700" title="Bôi đen vùng nhiều chỗ trống rồi chọn để đổi cả loạt">
          <option value="">↻ Đổi dạng vùng chọn…</option>
          <option value="TEXT">→ Ô điền</option>
          <option value="DROPDOWN">→ Dropdown</option>
          <option value="DRAG">→ Kéo-thả</option>
        </select>
        <span className="mx-1 h-4 w-px bg-gray-300" />
        <button type="button" onClick={pickImage} disabled={uploadingImg} className="rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
          {uploadingImg ? "Đang tải ảnh..." : "🖼 Chèn ảnh"}
        </button>
        <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
        <span className="mx-1 h-4 w-px bg-gray-300" />
        <button type="button" onClick={undo} disabled={!canUndo} className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="Hoàn tác thao tác chỗ trống gần nhất (⌘⇧Z)"><Undo2 size={13} />Hoàn tác</button>
        <button type="button" onClick={renumber} className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">Đánh lại số</button>
        <span className="ml-auto text-xs text-gray-500">Đang có <b>{count}</b> chỗ trống</span>
      </div>
      {/* Thanh ĐỊNH DẠNG CHỮ */}
      <div className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white p-1.5">
        <button type="button" title="Đậm" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} className={`${fmtBtn} font-bold`}><Bold size={15} /></button>
        <button type="button" title="Nghiêng" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} className={fmtBtn}><Italic size={15} /></button>
        <button type="button" title="Gạch chân" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} className={fmtBtn}><Underline size={15} /></button>
        <span className="mx-0.5 h-5 w-px bg-gray-300" />
        <select title="Cỡ chữ" defaultValue="" onMouseDown={(e) => e.stopPropagation()} onChange={(e) => { applyFontSize(e.target.value); e.currentTarget.value = ""; }}
          className="rounded border border-gray-300 px-1.5 py-1 text-xs text-gray-600">
          <option value="">Cỡ chữ</option>
          <option value="12">12</option><option value="14">14</option><option value="16">16</option>
          <option value="18">18</option><option value="20">20</option><option value="24">24</option>
          <option value="28">28</option><option value="32">32</option>
        </select>
        <label title="Màu chữ" className={`${fmtBtn} relative cursor-pointer`}>
          <span className="text-xs font-bold" style={{ borderBottom: "3px solid #dc2626" }}>A</span>
          <input type="color" onChange={(e) => exec("foreColor", e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
        <span className="mx-0.5 h-5 w-px bg-gray-300" />
        <button type="button" title="Canh trái" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyLeft")} className={fmtBtn}><AlignLeft size={15} /></button>
        <button type="button" title="Canh giữa" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyCenter")} className={fmtBtn}><AlignCenter size={15} /></button>
        <button type="button" title="Canh phải" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyRight")} className={fmtBtn}><AlignRight size={15} /></button>
        <button type="button" title="Canh đều" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyFull")} className={fmtBtn}><AlignJustify size={15} /></button>
        <span className="mx-0.5 h-5 w-px bg-gray-300" />
        <button type="button" title="Danh sách chấm" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} className={fmtBtn}><List size={15} /></button>
        <button type="button" title="Danh sách số" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertOrderedList")} className={fmtBtn}><ListOrdered size={15} /></button>
        <span className="mx-0.5 h-5 w-px bg-gray-300" />
        <button type="button" title="Xoá định dạng" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("removeFormat")} className={fmtBtn}><RemoveFormatting size={15} /></button>
      </div>
      {/* Vùng soạn */}
      <style>{`
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
        Phím tắt: <b>⌘G</b> ô điền · <b>⌘D</b> dropdown · <b>⌘K</b> kéo-thả · <b>⌘⇧Z</b> hoàn tác. <b>Tự gõ bài:</b> bọc đáp án trong <code>[ ]</code> rồi bấm <b>⚡ Tạo gap từ [ ]</b> (vd <code>[transport]</code> hoặc dropdown <code>[freezes|melts, freezes, boils]</code>). Bôi vùng nhiều ô rồi <b>↻ Đổi dạng vùng chọn</b> để đổi loạt. Bấm chip để sửa.
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
          <label className="mb-1 block text-xs font-medium text-gray-600">Gợi ý (tuỳ chọn — để trống nếu không cần)</label>
          <input type="text" value={editing.hint} onChange={(e) => setEditing({ ...editing, hint: e.target.value })}
            placeholder="vd: động từ, 1 từ, bắt đầu bằng r..." className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm" />
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
});
export default HtmlGapEditor;