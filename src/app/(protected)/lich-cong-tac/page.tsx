// FILE: src/app/(protected)/lich-cong-tac/page.tsx — Lịch công tác nội bộ (TKB tuần + nhiệm vụ đội ngũ)
// ADMIN sửa (thêm/sửa/xoá/tick), mọi tài khoản đăng nhập đều xem. Font to, tông VESTA. Xuất PNG.
// Desktop/tablet-ngang (≥lg): lưới ca×phòng×ngày. Mobile/tablet-dọc (<lg): view chọn 1 ngày, liệt kê dọc.
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Download, Loader2, X, Check, Copy, Calendar as CalIcon } from "lucide-react";
import { api } from "@/lib/api";
import EditableHtmlCalendar from "@/components/EditableHtmlCalendar";
import { useAuth } from "@/hooks/useAuth";

type S = { id: string; weekStart: string; dayIndex: number; slot: string; room: string; className: string; teacher: string; assistant: string; tags: string; note: string };
type T = { id: string; weekStart: string; title: string; owner: string; tags: string; deadline: string; note: string; completed: boolean };

const GV = ["MS. LY", "MR. TÀI", "MR. D.A.", "MR. TIẾN"];
const TA = ["MS. NGÂN", "MR. DUY", "MS. QUỲNH"];
const STAFF_PEOPLE = [...GV, ...TA, "MS. NGỌC"];
const ROOMS = ["Phòng 1 · To", "Phòng 2 · VIP", "Phòng 3 · Ngoài"];
const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const SLOTS = [
  { id: "h8", name: "08:00", time: "08:00–09:00" },
  { id: "h9", name: "09:00", time: "09:00–10:00" },
  { id: "h10", name: "10:00", time: "10:00–11:00" },
  { id: "h11", name: "11:00", time: "11:00–12:00" },
  { id: "h12", name: "12:00", time: "12:00–13:00" },
  { id: "h13", name: "13:00", time: "13:00–14:00" },
  { id: "h14", name: "14:00", time: "14:00–15:00" },
  { id: "h15", name: "15:00", time: "15:00–16:00" },
  { id: "h16", name: "16:00", time: "16:00–17:00" },
  { id: "h17", name: "17:00", time: "17:00–18:00" },
  { id: "h18", name: "18:00", time: "18:00–19:00" },
  { id: "h19", name: "19:00", time: "19:00–20:00" },
  { id: "h20", name: "20:00", time: "20:00–21:00" },
  { id: "h21", name: "21:00", time: "21:00–22:00" },
];
const DAY_PRESETS = [
  { label: "T2·T4·T6", days: [0, 2, 4] },
  { label: "T3·T5·T7", days: [1, 3, 5] },
  { label: "T2→T6", days: [0, 1, 2, 3, 4] },
  { label: "Cả tuần", days: [0, 1, 2, 3, 4, 5, 6] },
];
const PERSON_TONES: Record<string, number> = { "MS. LY": 0, "MR. TÀI": 1, "MR. D.A.": 2, "MR. TIẾN": 3, "MS. NGÂN": 4, "MR. DUY": 5, "MS. QUỲNH": 6, "MS. NGỌC": 7 };
const TONE_BG = ["#1B2A5B", "#A6882E", "#B22234", "#2A7D6F", "#7A4E9E", "#3B6FB0", "#C0653A", "#5A6570"];
function toneIdx(name: string): number {
  const k = name.trim().toUpperCase();
  if (PERSON_TONES[k] !== undefined) return PERSON_TONES[k];
  let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 8;
}
function parseTags(v: unknown): string[] {
  if (Array.isArray(v)) return [...new Set(v.map(String).map((x) => x.trim()).filter(Boolean))];
  if (typeof v !== "string" || !v) return [];
  try { return parseTags(JSON.parse(v)); } catch { return v.split(",").map((x) => x.trim()).filter(Boolean); }
}
const uniq = (a: string[]) => [...new Set(a.map((x) => x.trim()).filter(Boolean))];
const isoLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d, 12); };
const monday = (d = new Date()) => { const x = new Date(d), n = x.getDay() || 7; x.setDate(x.getDate() - n + 1); return isoLocal(x); };
const addDays = (iso: string, n: number) => { const d = fromIso(iso); d.setDate(d.getDate() + n); return isoLocal(d); };
const fmt = (iso: string) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(fromIso(iso));
// hôm nay là dayIndex nào trong tuần đang xem (0-6), hoặc -1 nếu không thuộc tuần này
function todayIndexIn(week: string): number {
  const today = isoLocal();
  for (let i = 0; i < 7; i++) if (addDays(week, i) === today) return i;
  return -1;
}

function PersonChip({ name, small }: { name: string; small?: boolean }) {
  return <span style={{ background: TONE_BG[toneIdx(name)] }}
    className={`inline-flex items-center gap-1 rounded-full font-semibold text-white ${small ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs"}`}>{name}</span>;
}

export default function LichCongTacPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [week, setWeek] = useState(monday());
  const [schedule, setSchedule] = useState<S[]>([]);
  const [tasks, setTasks] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [toast, setToast] = useState("");
  const [exporting, setExporting] = useState(false);
  const [carrying, setCarrying] = useState(false);   // đang chép từ tuần trước
  // Mobile: ngày đang chọn (mặc định hôm nay nếu trong tuần, không thì T2)
  const [mDay, setMDay] = useState(0);
  const exportRef = useRef<HTMLDivElement>(null);
  const [workHtml, setWorkHtml] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    (async () => {
      try { const r = await api.get("/site-content/schedule_work_html"); setWorkHtml(r?.data?.data?.html || null); }
      catch { setWorkHtml(null); }
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    const res = await api.get(`/planner?week=${week}`);
    if (res.success) { setSchedule(res.data.schedule || []); setTasks(res.data.tasks || []); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [week]);
  // khi đổi tuần, nhảy ngày mobile về hôm nay (nếu thuộc tuần) hoặc T2
  useEffect(() => { const ti = todayIndexIn(week); setMDay(ti >= 0 ? ti : 0); }, [week]);

  const title = useMemo(() => `${fmt(week)} – ${fmt(addDays(week, 6))}`, [week]);
  const done = tasks.filter((x) => x.completed).length;
  function notify(m: string) { setToast(m); setTimeout(() => setToast(""), 2600); }

  async function del(type: string, id: string) {
    if (!isAdmin || !confirm("Xoá mục này?")) return;
    const res = await api.delete(`/planner?type=${type}&id=${id}`);
    if (!res.success) return notify(res.message || "Không xoá được");
    load();
  }
  async function toggle(t: T) {
    if (!isAdmin) return;
    const res = await api.patch(`/planner`, { type: "task", ...t, completed: !t.completed });
    if (!res.success) return notify(res.message || "Không có quyền");
    setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, completed: !x.completed } : x));
  }
  // Chép lịch dạy + việc chưa xong từ tuần liền trước
  async function carryOver() {
    if (!isAdmin) return;
    setCarrying(true);
    const res = await api.post(`/planner/carry-over`, { week });
    setCarrying(false);
    if (!res.success) return notify(res.message || "Không chép được");
    const s = res.data?.schedule ?? 0, t = res.data?.tasks ?? 0;
    if (s === 0 && t === 0) notify(res.message || "Tuần trước không có gì để chép");
    else notify(`Đã chép ${s} buổi dạy${t ? ` + ${t} việc chưa xong` : ""} từ tuần trước`);
    load();
  }
  async function exportPNG() {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 120));
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `VESTA_LichCongTac_${week}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      notify("Đã xuất ảnh");
    } catch (e) { notify("Lỗi xuất ảnh"); console.error(e); }
    setExporting(false);
  }

  // các buổi của 1 ngày (mobile), gom theo ca
  const dayEntries = (day: number) => SLOTS.map((slot) => ({
    slot,
    rooms: ROOMS.map((room) => schedule.find((v) => v.dayIndex === day && v.slot === slot.id && v.room === room)).filter(Boolean) as S[],
  })).filter((g) => g.rooms.length > 0);

  if (workHtml) return <EditableHtmlCalendar initialTemplate={workHtml} dataEndpoint="/work-calendar" />;
  return (
    <div className="mx-auto max-w-[1600px]">
      {/* Thanh điều khiển */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-royal/10 text-royal"><CalIcon size={22} /></span>
          <div>
            <h1 className="font-display text-3xl font-bold text-royal">Lịch công tác</h1>
            <p className="text-sm text-muted">{isAdmin ? "Quản trị — sửa được" : "Chỉ xem"} · Tuần {title}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-silver/30 bg-white p-1">
            <button onClick={() => setWeek(addDays(week, -7))} className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ChevronLeft size={18} /></button>
            <button onClick={() => setWeek(monday())} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-royal hover:bg-cream-dark">Tuần này</button>
            <button onClick={() => setWeek(addDays(week, 7))} className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ChevronRight size={18} /></button>
          </div>
          {/* Xuất ảnh chỉ hợp trên bản lưới (desktop) — ẩn ở mobile để tránh ảnh vỡ */}
          <button onClick={exportPNG} disabled={exporting} className="btn-secondary hidden text-base lg:inline-flex"><Download size={17} />{exporting ? "Đang xuất..." : "Xuất ảnh"}</button>
        </div>
      </div>

      {/* Vùng xuất ảnh: stats + lịch + nhiệm vụ */}
      <div ref={exportRef} className="rounded-2xl bg-white p-4">
        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Buổi đã xếp", schedule.length],
            ["Lớp trong tuần", new Set(schedule.map((x) => x.className)).size],
            ["Nhiệm vụ", tasks.length],
            ["Hoàn thành", `${tasks.length ? Math.round(done / tasks.length * 100) : 0}%`],
          ].map(([label, val]) => (
            <div key={label as string} className="min-w-0 rounded-xl bg-gradient-to-br from-royal to-[#2A3F7A] px-3 py-2.5 text-white sm:px-4 sm:py-3">
              <div className="text-xl font-extrabold sm:text-2xl">{val}</div>
              <div className="break-words text-[10px] font-semibold uppercase leading-tight text-white/70 sm:text-xs">{label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gold" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
            {/* ═══════ LỊCH ═══════ */}
            <div>
              {/* Tuần trống → mời kế thừa tuần trước (chỉ admin) */}
              {isAdmin && !exporting && schedule.length === 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-gold/40 bg-gold/5 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-royal">Tuần này chưa có lịch</div>
                    <div className="text-xs text-muted">Chép lịch dạy + việc chưa xong từ tuần trước sang, rồi chỉnh lại nếu cần.</div>
                  </div>
                  <button onClick={carryOver} disabled={carrying}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-bold text-royal hover:bg-gold/90 disabled:opacity-50">
                    {carrying ? <Loader2 size={15} className="animate-spin" /> : <Copy size={15} />}
                    {carrying ? "Đang chép..." : "Kế thừa tuần trước"}
                  </button>
                </div>
              )}

              {/* --- LƯỚI: chỉ hiện từ lg trở lên. Hộp cuộn 2 chiều có trần cao (tắt khi xuất ảnh để không cắt cụt). --- */}
              <div className={`hidden rounded-xl border border-silver/30 lg:block ${exporting ? "" : "max-h-[75vh] overflow-auto"}`}>
                <div className="min-w-[900px]">
                  {/* HÀNG HEADER — ghim đứng yên khi cuộn dọc (sticky top) */}
                  <div className="sticky top-0 z-20 grid bg-cream" style={{ gridTemplateColumns: "150px repeat(7, 1fr)" }}>
                    {/* Ô góc — ghim cả trên lẫn trái */}
                    <div className="sticky left-0 z-10 border-b border-r border-silver/30 bg-cream px-2 py-2.5 text-xs font-bold uppercase text-muted">Ca / Phòng</div>
                    {DAYS.map((d, i) => (
                      <div key={d} className="border-b border-silver/30 bg-cream px-2 py-2.5 text-center">
                        <div className="text-sm font-bold text-royal">{d}</div>
                        <div className="text-xs text-muted">{fmt(addDays(week, i))}</div>
                      </div>
                    ))}
                  </div>
                  {SLOTS.map((slot) => ROOMS.map((room, ri) => (
                    <div key={slot.id + room} className="grid border-b border-silver/10" style={{ gridTemplateColumns: "150px repeat(7, 1fr)" }}>
                      {/* Cột giờ/phòng bên trái — ghim khi cuộn ngang (sticky left), nền đục để không lộ ô dưới */}
                      <div className="sticky left-0 z-10 border-r border-silver/30 bg-cream px-2 py-2">
                        {ri === 0 && <div className="text-sm font-bold text-royal">{slot.name}</div>}
                        {ri === 0 && <div className="text-[11px] text-muted">{slot.time}</div>}
                        <div className="text-[11px] text-muted">{room}</div>
                      </div>
                      {DAYS.map((_, day) => {
                        const x = schedule.find((v) => v.dayIndex === day && v.slot === slot.id && v.room === room);
                        const people = x ? uniq([x.teacher, x.assistant, ...parseTags(x.tags)]) : [];
                        return (
                          <div key={day} className="border-r border-silver/10 p-1">
                            {x ? (
                              <div className="group relative rounded-lg border-l-4 bg-cream/40 p-1.5" style={{ borderColor: TONE_BG[toneIdx(x.teacher)] }}>
                                <button disabled={!isAdmin} onClick={() => isAdmin && setModal({ type: "schedule", item: x })} className="block w-full text-left">
                                  <div className="text-sm font-bold text-[#1a1a2e]">{x.className}</div>
                                  <div className="mt-1 flex flex-wrap gap-1">{people.slice(0, 3).map((n) => <PersonChip key={n} name={n} small />)}{people.length > 3 && <span className="text-[11px] text-muted">+{people.length - 3}</span>}</div>
                                </button>
                                {isAdmin && !exporting && <button onClick={() => del("schedule", x.id)} className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white shadow-md"><X size={12} /></button>}
                              </div>
                            ) : isAdmin && !exporting ? (
                              <button onClick={() => setModal({ type: "schedule", day, slot: slot.id, room })}
                                className="flex h-full min-h-[44px] w-full items-center justify-center rounded-lg border border-dashed border-silver/40 text-xs text-muted hover:border-gold/50 hover:bg-gold/5"><Plus size={13} /></button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )))}
                </div>
              </div>

              {/* --- VIEW DỌC: chỉ hiện dưới lg (điện thoại / tablet dọc) --- */}
              <div className="lg:hidden">
                {/* Chọn ngày — GHIM dưới header mobile (sticky), cuộn xuống vẫn thấy & đổi được ngày. */}
                <div className="sticky top-[49px] z-20 -mx-4 mb-3 bg-white px-4 pb-2 pt-1 sm:-mx-6 sm:px-6">
                  <div className="grid grid-cols-7 gap-1">
                    {DAYS.map((d, i) => {
                      const isToday = todayIndexIn(week) === i;
                      const count = schedule.filter((v) => v.dayIndex === i).length;
                      return (
                        <button key={d} onClick={() => setMDay(i)}
                          className={`rounded-lg border py-1.5 text-center ${mDay === i ? "border-royal bg-royal text-white" : "border-silver/30 bg-white text-muted"}`}>
                          <div className={`text-xs font-bold ${mDay === i ? "text-white" : isToday ? "text-gold-dark" : "text-royal"}`}>{d.replace("Thứ ", "T").replace("Chủ nhật", "CN")}</div>
                          <div className={`text-[10px] ${mDay === i ? "text-white/70" : "text-muted"}`}>{fmt(addDays(week, i))}</div>
                          {count > 0 && <div className={`mx-auto mt-0.5 h-1.5 w-1.5 rounded-full ${mDay === i ? "bg-white" : "bg-gold"}`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Buổi của ngày đã chọn, gom theo ca */}
                {isAdmin && (
                  <button onClick={() => setModal({ type: "schedule", day: mDay, slot: "h18", room: ROOMS[0] })}
                    className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gold/50 bg-gold/5 py-2 text-sm font-semibold text-gold-dark">
                    <Plus size={15} />Thêm buổi cho {DAYS[mDay]}
                  </button>
                )}
                {dayEntries(mDay).length === 0 ? (
                  <div className="rounded-xl border border-silver/30 bg-white py-10 text-center text-sm text-muted">Chưa có buổi nào trong {DAYS[mDay]}.</div>
                ) : (
                  <div className="space-y-3">
                    {dayEntries(mDay).map(({ slot, rooms }) => (
                      <div key={slot.id} className="rounded-xl border border-silver/30 bg-white p-3">
                        <div className="mb-2 flex items-baseline justify-between">
                          <span className="text-sm font-bold text-royal">{slot.name}</span>
                          <span className="text-xs text-muted">{slot.time}</span>
                        </div>
                        <div className="space-y-2">
                          {rooms.map((x) => {
                            const people = uniq([x.teacher, x.assistant, ...parseTags(x.tags)]);
                            return (
                              <div key={x.id} className="relative rounded-lg border-l-4 bg-cream/40 p-2.5" style={{ borderColor: TONE_BG[toneIdx(x.teacher)] }}>
                                <button disabled={!isAdmin} onClick={() => isAdmin && setModal({ type: "schedule", item: x })} className="block w-full pr-6 text-left">
                                  <div className="break-words text-base font-bold text-[#1a1a2e]">{x.className}</div>
                                  <div className="mt-0.5 text-xs text-muted">{x.room}</div>
                                  <div className="mt-1.5 flex flex-wrap gap-1">{people.map((n) => <PersonChip key={n} name={n} small />)}</div>
                                  {x.note && <div className="mt-1 text-xs text-muted">{x.note}</div>}
                                </button>
                                {isAdmin && <button onClick={() => del("schedule", x.id)} className="absolute right-1.5 top-1.5 rounded-full bg-red-500 p-1 text-white shadow-md"><Trash2 size={13} /></button>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ═══════ NHIỆM VỤ ═══════ */}
            <div className="rounded-xl border border-silver/30 bg-white p-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-muted">Nhiệm vụ tuần</div>
                  <div className="text-lg font-bold text-royal">Công việc đội ngũ</div>
                  <div className="text-xs text-muted">{tasks.filter((x) => !x.completed).length} việc đang chờ</div>
                </div>
                {isAdmin && !exporting && <button onClick={() => setModal({ type: "task" })} className="btn-primary text-sm"><Plus size={15} />Thêm</button>}
              </div>
              <div className="space-y-2">
                {tasks.length === 0 ? <div className="py-8 text-center text-sm text-muted">Chưa có nhiệm vụ.</div> :
                  [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed) || a.deadline.localeCompare(b.deadline)).map((t) => (
                    <div key={t.id} className={`rounded-lg border p-2.5 ${t.completed ? "border-silver/20 bg-cream/30 opacity-60" : "border-silver/30 bg-white"}`}>
                      <div className="flex items-start gap-2">
                        <button disabled={!isAdmin} onClick={() => toggle(t)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${t.completed ? "border-green-600 bg-green-600 text-white" : "border-silver/50"}`}>
                          {t.completed && <Check size={13} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className={`break-words text-sm font-bold text-[#1a1a2e] ${t.completed ? "line-through" : ""}`}>{t.title}</div>
                          {t.note && <div className="break-all text-xs text-muted">{t.note}</div>}
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {uniq([t.owner, ...parseTags(t.tags)]).map((n) => <PersonChip key={n} name={n} small />)}
                            <span className={`ml-auto text-[11px] font-semibold ${t.deadline < isoLocal() && !t.completed ? "text-red-600" : "text-muted"}`}>DL {fmt(t.deadline)}</span>
                          </div>
                        </div>
                        {isAdmin && !exporting && (
                          <div className="flex shrink-0 flex-col gap-1">
                            <button onClick={() => setModal({ type: "task", item: t })} className="rounded p-1 text-xs text-muted hover:text-royal">Sửa</button>
                            <button onClick={() => del("task", t.id)} className="rounded p-1 text-muted hover:text-red-600"><Trash2 size={13} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {modal && isAdmin && <Editor modal={modal} week={week} close={() => setModal(null)} saved={() => { setModal(null); load(); notify("Đã lưu"); }} notify={notify} />}
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-royal px-5 py-2.5 text-sm font-semibold text-white shadow-xl">{toast}</div>}
    </div>
  );
}

// ───────── Editor modal: xếp lớp / giao nhiệm vụ ─────────
function Editor({ modal, week, close, saved, notify }: { modal: any; week: string; close: () => void; saved: () => void; notify: (m: string) => void }) {
  const isS = modal.type === "schedule";
  const old = modal.item ?? {};
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [f, setF] = useState<any>(isS
    ? { weekStart: week, dayIndices: [modal.day ?? old.dayIndex ?? 0], slot: modal.slot ?? old.slot ?? "h8", room: modal.room ?? old.room ?? ROOMS[0], className: old.className ?? "", teacher: old.teacher ?? GV[0], assistant: old.assistant ?? "", tags: parseTags(old.tags), note: old.note ?? "" }
    : { weekStart: week, title: old.title ?? "", owner: old.owner ?? STAFF_PEOPLE[0], tags: parseTags(old.tags), deadline: old.deadline ?? isoLocal(), note: old.note ?? "", completed: old.completed ?? false });
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const toggleDay = (i: number) => set("dayIndices", f.dayIndices.includes(i) ? f.dayIndices.filter((x: number) => x !== i) : [...f.dayIndices, i].sort());
  const toggleTag = (name: string) => set("tags", f.tags.includes(name) ? f.tags.filter((x: string) => x !== name) : [...f.tags, name]);
  function addCustomTag() {
    const name = customTag.trim();
    if (!name) return;
    set("tags", uniq([...f.tags, name]));
    setCustomTag("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isS && !f.dayIndices.length) return setError("Chọn ít nhất một ngày");
    setSaving(true); setError("");
    const body = isS ? { ...f, dayIndex: f.dayIndices[0], dayIndices: old.id ? undefined : f.dayIndices } : { ...f };
    const payload = { type: modal.type, id: old.id, ...body };
    const res = old.id ? await api.patch(`/planner`, payload) : await api.post(`/planner`, payload);
    setSaving(false);
    if (!res.success) return setError(res.message || "Không lưu được");
    saved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{old.id ? "Chỉnh sửa" : "Thêm mới"}</p>
            <h2 className="font-display text-xl font-bold text-royal">{isS ? "Xếp lớp vào lịch" : "Giao nhiệm vụ tuần"}</h2>
          </div>
          <button type="button" onClick={close} className="text-muted hover:text-royal"><X size={20} /></button>
        </div>

        {isS ? (
          <>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-bold text-muted">Tên lớp / hoạt động</span>
              <input autoFocus value={f.className} onChange={(e) => set("className", e.target.value)} placeholder="VD: IELTS 6+ 0726" required className="input-field" />
            </label>
            <fieldset className="mb-3 rounded-lg border border-silver/30 p-3">
              <legend className="px-1 text-xs font-bold text-muted">{old.id ? "Ngày học (đang sửa 1 buổi)" : "Chọn ngày học"}</legend>
              {!old.id && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {DAY_PRESETS.map((p) => (
                    <button type="button" key={p.label} onClick={() => set("dayIndices", p.days)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${p.days.length === f.dayIndices.length && p.days.every((x) => f.dayIndices.includes(x)) ? "bg-royal text-white" : "bg-cream text-muted hover:bg-cream-dark"}`}>{p.label}</button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                {DAYS.map((d, i) => (
                  <label key={d} className={`cursor-pointer rounded-lg border px-1 py-1.5 text-center ${f.dayIndices.includes(i) ? "border-royal bg-royal/10" : "border-silver/30"} ${old.id && !f.dayIndices.includes(i) ? "opacity-40" : ""}`}>
                    <input type="checkbox" checked={f.dayIndices.includes(i)} onChange={() => !old.id ? toggleDay(i) : set("dayIndices", [i])} className="hidden" />
                    <div className="text-xs font-bold text-royal">{d.replace("Thứ ", "T").replace("Chủ nhật", "CN")}</div>
                    <div className="text-[10px] text-muted">{fmt(addDays(week, i))}</div>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label><span className="mb-1 block text-xs font-bold text-muted">Ca</span>
                <select value={f.slot} onChange={(e) => set("slot", e.target.value)} className="input-field">{SLOTS.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.time}</option>)}</select></label>
              <label><span className="mb-1 block text-xs font-bold text-muted">Phòng</span>
                <select value={f.room} onChange={(e) => set("room", e.target.value)} className="input-field">{ROOMS.map((x) => <option key={x}>{x}</option>)}</select></label>
              <label><span className="mb-1 block text-xs font-bold text-muted">Giáo viên chính</span>
                <input list="gv-opts" value={f.teacher} onChange={(e) => set("teacher", e.target.value)} placeholder="Chọn hoặc gõ tên" required className="input-field" />
                <datalist id="gv-opts">{GV.map((x) => <option key={x} value={x} />)}</datalist></label>
              <label><span className="mb-1 block text-xs font-bold text-muted">Trợ giảng</span>
                <input list="ta-opts" value={f.assistant} onChange={(e) => set("assistant", e.target.value)} placeholder="Không có / gõ tên" className="input-field" />
                <datalist id="ta-opts">{TA.map((x) => <option key={x} value={x} />)}</datalist></label>
            </div>
          </>
        ) : (
          <>
            <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-muted">Nhiệm vụ</span>
              <input autoFocus value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="VD: Report lớp 5+ và 6+" required className="input-field" /></label>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label><span className="mb-1 block text-xs font-bold text-muted">Người phụ trách</span>
                <input list="staff-opts" value={f.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Chọn hoặc gõ tên" required className="input-field" />
                <datalist id="staff-opts">{STAFF_PEOPLE.map((x) => <option key={x} value={x} />)}</datalist></label>
              <label><span className="mb-1 block text-xs font-bold text-muted">Deadline</span>
                <input type="date" value={f.deadline} onChange={(e) => set("deadline", e.target.value)} required className="input-field" /></label>
            </div>
          </>
        )}

        {/* Tag người (chung cho cả 2) — chọn sẵn + thêm tên mới */}
        <fieldset className="mb-3 rounded-lg border border-silver/30 p-3">
          <legend className="px-1 text-xs font-bold text-muted">Tag thêm nhân sự</legend>
          <div className="flex flex-wrap gap-1.5">
            {uniq([...STAFF_PEOPLE, ...f.tags]).map((name) => (
              <button type="button" key={name} onClick={() => toggleTag(name)}
                style={f.tags.includes(name) ? { background: TONE_BG[toneIdx(name)] } : {}}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${f.tags.includes(name) ? "text-white" : "bg-cream text-muted hover:bg-cream-dark"}`}>{name}</button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input value={customTag} onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
              placeholder="Nhập tên nhân sự mới..." className="input-field flex-1 !py-1.5 text-sm" />
            <button type="button" onClick={addCustomTag} className="btn-secondary shrink-0 text-sm"><Plus size={14} />Thêm</button>
          </div>
        </fieldset>

        <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-muted">Ghi chú</span>
          <textarea value={f.note} onChange={(e) => set("note", e.target.value)} rows={2} placeholder="Lưu ý..." className="input-field" /></label>

        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={close} className="btn-secondary">Huỷ</button>
          <button className="btn-primary" disabled={saving}>{saving ? "Đang lưu..." : old.id ? "Lưu thay đổi" : isS && f.dayIndices.length > 1 ? `Thêm ${f.dayIndices.length} buổi` : "Thêm"}</button>
        </div>
      </form>
    </div>
  );
}