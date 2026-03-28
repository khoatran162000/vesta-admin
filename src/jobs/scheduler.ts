// FILE: src/jobs/scheduler.ts — Khoi dong cac cronjob

import { checkInactiveStudents } from "./inactiveStudentAlert";

/**
 * Khởi động scheduler
 * Chạy checkInactiveStudents mỗi 24 giờ (lúc khởi động + mỗi ngày)
 */
export function startScheduler() {
  // Chạy lần đầu sau 10 giây (đợi server khởi động xong)
  setTimeout(async () => {
    console.log("[Scheduler] Chạy lần đầu...");
    await checkInactiveStudents();
  }, 10000);

  // Chạy lặp lại mỗi 24 giờ
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    console.log(`[Scheduler] Chạy cronjob lúc ${new Date().toISOString()}`);
    await checkInactiveStudents();
  }, TWENTY_FOUR_HOURS);

  console.log("[Scheduler] Đã đăng ký cronjob: checkInactiveStudents (mỗi 24h)");
}