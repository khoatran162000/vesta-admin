// FILE: src/lib/ielts.ts — Làm tròn điểm IELTS + tính Overall từ 4 kỹ năng.
// Quy tắc: phần lẻ ≥ .25 làm tròn LÊN nửa điểm gần nhất, < .25 làm tròn XUỐNG.
// VD: 6.875→7.0, 6.375→6.5, 6.25→6.5, 6.125→6.0.

/** Làm tròn 1 số về bội số 0.5 theo quy tắc IELTS (nửa-lên). */
export function roundIeltsBand(avg: number): number {
  return Math.round(avg * 2) / 2;
}

/** Đọc 1 ô điểm: "6.5" / "6,5" / "9" → số; rỗng hoặc dải ("7-7.5") → null. */
export function parseBand(raw: string): number | null {
  const s = String(raw ?? "").trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;   // chỉ nhận 1 số thuần, không nhận dải
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** Overall = trung bình 4 kỹ năng, làm tròn IELTS. Trả "7.0"; null nếu thiếu/không hợp lệ ô nào. */
export function overallFromSkills(listening: string, reading: string, writing: string, speaking: string): string | null {
  const vals = [listening, reading, writing, speaking].map(parseBand);
  if (vals.some((v) => v === null)) return null;
  const avg = (vals as number[]).reduce((a, b) => a + b, 0) / 4;
  return roundIeltsBand(avg).toFixed(1);
}