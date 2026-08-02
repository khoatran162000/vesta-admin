// FILE: src/lib/learnclickImport.ts
// Nạp HTML từ LearnClick: <a class="cloze"> HOẶC <span class="cloze">đáp án</span> → [[gap:N]] + gaps map
// Đáp án nhiều phương án đúng ngăn bởi '#': "respiratory movements#signals" → ["respiratory movements","signals"]
export type GapType = "TEXT" | "DROPDOWN" | "DRAG";
export interface ImportedGap { type: GapType; answers: string[]; options?: string[] }
export interface ImportResult {
  content: string;                        // HTML, gap đã thay bằng [[gap:N]]
  gaps: Record<string, ImportedGap>;
  count: number;                          // số gap nạp được
  skipped: number;                        // thẻ cloze rỗng bị bỏ
}

/** Dọn nhẹ: bỏ <script> và các thuộc tính on* (onclick...) — HTML do GV dán vào. */
function sanitize(root: HTMLElement) {
  root.querySelectorAll("script").forEach((el) => el.remove());
  root.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
    }
  });
}

/** Tách đáp án theo '#': "a#b#c" → ["a","b","c"] (bỏ rỗng, trim) */
function parseAnswers(raw: string): string[] {
  return raw.split("#").map((x) => x.trim()).filter(Boolean);
}

/**
 * @param html   HTML dán từ LearnClick (Edit HTML Source)
 * @param startId số thứ tự gap bắt đầu (khi chèn thêm vào bài đang có)
 */
export function importLearnClickHtml(html: string, startId = 1): ImportResult {
  const doc = new DOMParser().parseFromString(`<div id="__vroot">${html}</div>`, "text/html");
  const root = doc.getElementById("__vroot") as HTMLElement;
  if (!root) return { content: html, gaps: {}, count: 0, skipped: 0 };

  sanitize(root);

  const gaps: Record<string, ImportedGap> = {};
  let id = startId;
  let skipped = 0;

  // Nhận CẢ <a class="cloze"> LẪN <span class="cloze"> (LearnClick xuất ra cả 2 dạng).
  // Giữ nguyên các <a>/<span> thường (link, video, styling).
  root.querySelectorAll("a.cloze, span.cloze").forEach((el) => {
    const raw = (el.textContent || "").trim();
    const answers = parseAnswers(raw);
    if (!answers.length) { el.replaceWith(doc.createTextNode("")); skipped++; return; }
    const gid = String(id++);
    gaps[gid] = { type: "TEXT", answers };   // mặc định ô điền; đổi dạng trong editor
    el.replaceWith(doc.createTextNode(`[[gap:${gid}]]`));
  });

  return { content: root.innerHTML, gaps, count: Object.keys(gaps).length, skipped };
}

/** Đếm nhanh số gap trong HTML (xem trước, không đổi gì) — nhận cả a.cloze và span.cloze */
export function countCloze(html: string): number {
  const doc = new DOMParser().parseFromString(`<div id="__vroot">${html}</div>`, "text/html");
  return doc.querySelectorAll("#__vroot a.cloze, #__vroot span.cloze").length;
}