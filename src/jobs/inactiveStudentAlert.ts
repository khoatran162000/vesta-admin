// FILE: src/jobs/inactiveStudentAlert.ts — Cronjob: quet hoc vien 7 ngay khong lam bai

import prisma from "../config/database";

/**
 * Quét database tìm học viên 7 ngày không làm bài → tạo notification tự động
 * Gọi hàm này từ setInterval hoặc node-cron
 */
export async function checkInactiveStudents() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Tìm tất cả student đang active
    const activeStudents = await prisma.user.findMany({
      where: { role: "STUDENT", isActive: true },
      select: { id: true, fullName: true },
    });

    let notified = 0;

    for (const student of activeStudents) {
      // Tìm lượt thi gần nhất
      const lastAttempt = await prisma.examAttempt.findFirst({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

      // Nếu chưa bao giờ thi, hoặc lần thi cuối > 7 ngày trước
      const isInactive = !lastAttempt || lastAttempt.createdAt < sevenDaysAgo;

      if (isInactive) {
        // Kiểm tra đã gửi thông báo tự động trong 7 ngày qua chưa (tránh spam)
        const recentAutoNotif = await prisma.notification.findFirst({
          where: {
            userId: student.id,
            type: "SYSTEM_AUTO",
            createdAt: { gte: sevenDaysAgo },
          },
        });

        if (!recentAutoNotif) {
          await prisma.notification.create({
            data: {
              userId: student.id,
              title: "Nhắc nhở luyện tập",
              message: `Chào ${student.fullName}, bạn đã hơn 7 ngày không làm bài tập. Hãy quay lại luyện thi để duy trì phong độ nhé!`,
              type: "SYSTEM_AUTO",
              isRead: false,
            },
          });
          notified++;
        }
      }
    }

    console.log(`[Cronjob] Đã gửi ${notified} thông báo nhắc nhở học viên không hoạt động`);
    return notified;
  } catch (err) {
    console.error("[Cronjob] Lỗi checkInactiveStudents:", err);
    return 0;
  }
}