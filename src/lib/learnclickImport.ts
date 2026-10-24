// FILE: src/lib/learnclickImport.ts
// Nap HTML tu LearnClick / VESTA:
//   <a|span class="cloze">dap an</a>                       -> O dien (TEXT); nhieu dap an ngan boi '#'
//   <a|span class="clozedrop" href="#d1 0i0 d2">dap an</a> -> Dropdown: dap an = chu hien thi; d1,d2 = phuong an nhieu trong href (ngan boi "0i0")
export type GapType = "TEXT" | "DROPDOWN" | "DRAG";
export interface ImportedGap { type: GapType; answers: string[]; options?: string[] }
export interface ImportResult {
  content: string;
  gaps: Record<string, ImportedGap>;
  count: number;
  skipped: number;
}

function sanitize(root: HTMLElement) {
  root.querySelectorAll("script").forEach((el) => el.remove());
  root.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
    }
  });
}

function parseAnswers(raw: string): string[] {
  return raw.split("#").map((x) => x.trim()).filter(Boolean);
}

// Dropdown: dap an dung = chu hien thi; phuong an nhieu nam trong href, ngan boi "0i0".
function dropdownFrom(el: Element): { answers: string[]; options: string[] } {
  const answer = (el.textContent || "").replace(/\s+/g, " ").trim();
  const href = el.getAttribute("href") || "";
  let raw = href.startsWith("#") ? href.slice(1) : href;
  try { raw = decodeURIComponent(raw); } catch {}
  const distract = raw.split("0i0").map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);
  const seen = new Set<string>();
  const options: string[] = [];
  for (const o of [answer, ...distract]) {
    const k = o.toLowerCase();
    if (o && !seen.has(k)) { seen.add(k); options.push(o); }
  }
  return { answers: answer ? [answer] : [], options };
}

export function importLearnClickHtml(html: string, startId = 1): ImportResult {
  const doc = new DOMParser().parseFromString(`<div id="__vroot">${html}</div>`, "text/html");
  const root = doc.getElementById("__vroot") as HTMLElement;
  if (!root) return { content: html, gaps: {}, count: 0, skipped: 0 };

  sanitize(root);

  const gaps: Record<string, ImportedGap> = {};
  let id = startId;
  let skipped = 0;

  // Giu dung thu tu xuat hien (querySelectorAll tra theo document order).
  root.querySelectorAll("a.cloze, span.cloze, a.clozedrop, span.clozedrop").forEach((el) => {
    if (el.classList.contains("clozedrop")) {
      const { answers, options } = dropdownFrom(el);
      if (!answers.length) { el.replaceWith(doc.createTextNode("")); skipped++; return; }
      const gid = String(id++);
      gaps[gid] = { type: "DROPDOWN", answers, options };
      el.replaceWith(doc.createTextNode(`[[gap:${gid}]]`));
    } else {
      const answers = parseAnswers((el.textContent || "").replace(/\s+/g, " ").trim());
      if (!answers.length) { el.replaceWith(doc.createTextNode("")); skipped++; return; }
      const gid = String(id++);
      gaps[gid] = { type: "TEXT", answers };
      el.replaceWith(doc.createTextNode(`[[gap:${gid}]]`));
    }
  });

  return { content: root.innerHTML, gaps, count: Object.keys(gaps).length, skipped };
}

export function countCloze(html: string): number {
  const doc = new DOMParser().parseFromString(`<div id="__vroot">${html}</div>`, "text/html");
  return doc.querySelectorAll("#__vroot a.cloze, #__vroot span.cloze, #__vroot a.clozedrop, #__vroot span.clozedrop").length;
}
