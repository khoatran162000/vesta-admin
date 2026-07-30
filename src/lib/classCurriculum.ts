// FILE: src/lib/classCurriculum.ts
// Dữ liệu lộ trình 5 chương trình VESTA (dựng lại từ mẫu Nhật ký lớp).
// Đã BỎ nhãn "tuần mấy" — mỗi mục chỉ còn Unit + title. Mỗi unit có các bài học trên lớp.

export interface Lesson {
  n: number;        // số buổi chạy suốt chương trình (1,2,3,...)
  label: string;    // tên bài học trên lớp (vd "Ngữ pháp")
}
export interface UnitGroup {
  title: string;    // "Unit 1: Danh từ & Mạo từ" / "Mid-test" / ...
  url?: string;     // link LearnClick (nếu có)
  lessons: Lesson[];// các bài trong unit (thường 3)
}
export interface FlatLesson {
  n: number;
  label: string;    // với lớp theo unit: "Unit 1: ... — Ngữ pháp"; với lớp theo buổi: nguyên label
  unitTitle?: string;
  url?: string;
}
export interface Program {
  key: string;         // p4/p5/p6/p7/p789
  name: string;        // "VESTA 4+"
  meta: string;        // "36 buổi"
  totalWeeks?: number; // số tuần (hiển thị phụ)
  byLesson?: boolean;  // true = list phẳng theo buổi (7+, 789), không theo unit
  units?: UnitGroup[]; // với lớp theo unit
  flatItems?: string[];// với lớp theo buổi (7+ theo khối, 789 đánh số)
  sections?: { title: string; items: string[] }[]; // 7+ chia 3 khối
  resources?: { label: string; url: string }[];
}

// 3 bài trên lớp mỗi unit (khác nhau theo lớp)
const UNIT_4 = ["Ngữ pháp", "Viết", "Ôn tập & kiểm tra"];
const UNIT_5 = ["Ngữ pháp câu", "Viết", "Đọc · Nghe · Từ vựng"];
const UNIT_6 = ["Ôn tập & thi thử", "Viết", "Nói"];
const MID = ["Ôn tập giữa khóa", "Kiểm tra giữa khóa 1", "Kiểm tra giữa khóa 2"];
const END = ["Ôn tập cuối khóa", "Kiểm tra cuối khóa 1", "Kiểm tra cuối khóa 2"];

// Helper tạo UnitGroup
function U(title: string, lessons: string[], url?: string): { title: string; url?: string; lessons: string[] } {
  return { title, url, lessons };
}

// ─── Định nghĩa "thô" 5 chương trình (chưa đánh số n) ───
const RAW: Record<string, {
  name: string; meta: string; totalWeeks?: number; byLesson?: boolean;
  unitDefs?: { title: string; url?: string; lessons: string[] }[];
  sections?: { title: string; items: string[] }[];
  numbered?: number;
  resources?: { label: string; url: string }[];
}> = {
  p4: {
    name: "VESTA 4+", meta: "36 buổi", totalWeeks: 12,
    unitDefs: [
      U("Unit 1: Danh từ & Mạo từ", UNIT_4, "https://www.learnclick.com/members/main/9061/0#9061"),
      U("Unit 2: Trạng từ & Tính từ", UNIT_4, "https://www.learnclick.com/members/main/9062/0#9062"),
      U("Unit 3: Động từ", UNIT_4, "https://www.learnclick.com/members/main/9063/0#9063"),
      U("Unit 4: Giới từ", UNIT_4, "https://www.learnclick.com/members/main/9064/0#9064"),
      U("Unit 5: Câu đơn", UNIT_4, "https://www.learnclick.com/members/main/9065/0#9065"),
      U("Mid-test", MID, "https://www.learnclick.com/members/main/9077/0#9077"),
      U("Unit 6: Ôn tập ngữ pháp 1", UNIT_4, "https://www.learnclick.com/members/main/9075/0#9075"),
      U("Unit 7: Câu chủ động & bị động", UNIT_4, "https://www.learnclick.com/members/main/9066/0#9066"),
      U("Unit 8: Câu phức", UNIT_4, "https://www.learnclick.com/members/main/9068/0#9068"),
      U("Unit 9: Câu ghép", UNIT_4, "https://www.learnclick.com/members/main/9067/0#9067"),
      U("Unit 10: Ôn tập ngữ pháp 2", UNIT_4, "https://www.learnclick.com/members/main/9076/0#9076"),
      U("End-test & Ôn tập", END, "https://www.learnclick.com/members/main/9077/0#9077"),
    ],
    resources: [
      { label: "Grammar Boosts", url: "https://www.learnclick.com/members/main/9069/0#9069" },
      { label: "Revision and Tests", url: "https://www.learnclick.com/members/main/9077/0#9077" },
    ],
  },
  p5: {
    name: "VESTA 5+", meta: "30 buổi", totalWeeks: 10,
    unitDefs: [
      U("Unit 1: Weather & Climate", UNIT_5),
      U("Unit 2: Cities & Transportation", UNIT_5),
      U("Unit 3: Entertainment", UNIT_5),
      U("Unit 4: Technology", UNIT_5),
      U("Mid-test", MID),
      U("Unit 5: Media & Communication", UNIT_5),
      U("Unit 6: Language & Education", UNIT_5),
      U("Unit 7: Business", UNIT_5),
      U("Unit 8: Sports & Health", UNIT_5),
      U("End-test", END),
      U("Unit 9: Relationships", UNIT_5),
      U("Unit 10: The Universe", UNIT_5),
    ],
    resources: [
      { label: "Revisions & Mini-tests", url: "" },
    ],
  },
  p6: {
    name: "VESTA 6+", meta: "36 buổi", totalWeeks: 12,
    unitDefs: [
      U("Unit 0: The Basics", UNIT_6, "https://www.learnclick.com/members/main/7535/0#7535"),
      U("Unit 1: Environment", UNIT_6, "https://www.learnclick.com/members/main/7212/0#7212"),
      U("Unit 2: Employment", UNIT_6, "https://www.learnclick.com/members/main/7213/0#7213"),
      U("Unit 3: Relationship", UNIT_6, "https://www.learnclick.com/members/main/7214/0#7214"),
      U("Unit 4: Entertainment", UNIT_6, "https://www.learnclick.com/members/main/7242/0#7242"),
      U("Mid-test: Revisions", MID, "https://www.learnclick.com/members/main/7243/0#7243"),
      U("Unit 6: Food & Health", UNIT_6, "https://www.learnclick.com/members/main/7370/0#7370"),
      U("Unit 7: Tourism", UNIT_6, "https://www.learnclick.com/members/main/7371/0#7371"),
      U("Unit 8: Science & Technology", UNIT_6, "https://www.learnclick.com/members/main/7372/0#7372"),
      U("Unit 9: Language & Learning", UNIT_6, "https://www.learnclick.com/members/main/7373/0#7373"),
      U("Unit 10: Listening Boost", UNIT_6, "https://www.learnclick.com/members/main/7991/0#7991"),
      U("End-test", END, "https://www.learnclick.com/members/main/7739/0#7739"),
    ],
    resources: [
      { label: "Lectures & Test", url: "https://www.learnclick.com/members/main/7739/0#7739" },
      { label: "Grammar Plus", url: "https://www.learnclick.com/members/main/7642/0#7642" },
    ],
  },
  p7: {
    name: "VESTA 7+", meta: "45 buổi", totalWeeks: 15, byLesson: true,
    sections: [
      { title: "📝 WRITING TASK 1", items: [
        "Course Introduction", "W1 — Line Graph", "W1 — Line Graph Practice", "W1 — Bar Chart", "W1 — Table",
        "Mini Test — Bar & Table", "W1 — Pie Chart", "Mini Test — Pie Chart", "Mini Test — Revision W1",
        "⚡ MID-TEST 1", "W1 — Process", "Mini Test — Process", "W1 — Map", "Mini Test — Map", "⚡ MID-TEST 2",
      ]},
      { title: "📝 WRITING TASK 2", items: [
        "W2 — Writing Basics", "W2 — Introduction", "Mini Test — Introduction", "W2 — Argumentative 100",
        "W2 — Argumentative 80", "W2 — Argumentative Practice", "W2 — Discussion", "Mini Test — Discussion",
        "W2 — Revision Opinion", "⚡ MID-TEST 3", "W2 — Account 1", "Mini Test — Account 1",
        "W2 — Account 2", "Mini Test — Account 2",
      ]},
      { title: "🎤 SPEAKING", items: [
        "S Part 1 (a)", "S Part 1 (b)", "S P2 — People (a)", "⚡ END-TEST 1", "S P2 — People (b)", "S P2 — Places",
        "⚡ END-TEST 2", "S P2 — Event 1", "S P2 — Event 2", "S P2 — Objects", "Mini Test — Speaking P2",
        "S Part 3a", "S Part 3c", "S Part 3d", "⚡ END-TEST 3", "🎓 FINAL TEST",
      ]},
    ],
  },
  p789: {
    name: "ĐỀ 789 INTENSIVE", meta: "60 buổi", byLesson: true, numbered: 60,
  },
};

// ─── Dựng danh sách chương trình đã đánh số n chạy suốt ───
function buildProgram(key: string): Program {
  const r = RAW[key];
  const prog: Program = { key, name: r.name, meta: r.meta, totalWeeks: r.totalWeeks, byLesson: r.byLesson, resources: r.resources };
  let n = 0;

  if (r.numbered) {
    // 789: đánh số buổi 1..60
    prog.flatItems = [];
    for (let i = 1; i <= r.numbered; i++) prog.flatItems.push(`Buổi ${i}`);
    return prog;
  }
  if (r.sections) {
    // 7+: 3 khối theo buổi
    prog.sections = r.sections.map((s) => ({ title: s.title, items: s.items }));
    return prog;
  }
  // theo unit (4+/5+/6+)
  prog.units = (r.unitDefs || []).map((u) => ({
    title: u.title,
    url: u.url,
    lessons: u.lessons.map((lb) => { n++; return { n, label: lb }; }),
  }));
  return prog;
}

export const PROGRAMS: Record<string, Program> = {
  p4: buildProgram("p4"),
  p5: buildProgram("p5"),
  p6: buildProgram("p6"),
  p7: buildProgram("p7"),
  p789: buildProgram("p789"),
};

// Danh sách để render tab chọn lớp
export const PROGRAM_LIST = [
  { key: "p4", label: "IELTS 4+" },
  { key: "p5", label: "IELTS 5+" },
  { key: "p6", label: "IELTS 6+" },
  { key: "p7", label: "IELTS 7+" },
  { key: "p789", label: "789 Intensive" },
];

// Làm phẳng toàn bộ bài học của 1 chương trình (dùng để tick "bài hiện tại")
export function flatten(prog: Program): FlatLesson[] {
  const out: FlatLesson[] = [];
  let n = 0;
  if (prog.flatItems) {
    prog.flatItems.forEach((lb) => { n++; out.push({ n, label: lb }); });
  } else if (prog.sections) {
    prog.sections.forEach((s) => s.items.forEach((lb) => { n++; out.push({ n, label: lb, unitTitle: s.title }); }));
  } else if (prog.units) {
    prog.units.forEach((u) => u.lessons.forEach((l) => { n++; out.push({ n, label: `${u.title} — ${l.label}`, unitTitle: u.title, url: u.url }); }));
  }
  return out;
}