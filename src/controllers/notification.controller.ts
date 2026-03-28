// FILE: src/controllers/notification.controller.ts — Gui thong bao: ca nhan, nhom, tat ca

import { Request, Response } from "express";
import prisma from "../config/database";
import * as api from "../utils/apiResponse";

type Params = { [key: string]: string };

// GET /api/notifications?userId=xxx&page=1&limit=20
export async function listNotifications(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const userId = req.query.userId as string || req.user!.userId;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return res.json({
      success: true,
      data: notifications,
      unreadCount,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// POST /api/notifications/send
// Body: { title, message, type?, userIds?, sendToAll? }
export async function sendNotification(req: Request, res: Response) {
  try {
    const { userIds, title, message, type, sendToAll } = req.body;

    if (!title || !message) {
      return api.error(res, "Tiêu đề và nội dung không được để trống");
    }

    let targetIds: string[] = [];

    if (sendToAll) {
      // Gửi tất cả học viên đang hoạt động
      const students = await prisma.user.findMany({
        where: { role: "STUDENT", isActive: true },
        select: { id: true },
      });
      targetIds = students.map((s) => s.id);
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Gửi cho danh sách cụ thể
      targetIds = userIds;
    } else {
      return api.error(res, "Chưa chọn người nhận. Chọn userIds hoặc sendToAll.");
    }

    if (targetIds.length === 0) {
      return api.error(res, "Không tìm thấy người nhận nào");
    }

    const notifications = await prisma.notification.createMany({
      data: targetIds.map((userId) => ({
        userId,
        title,
        message,
        type: type || "TEACHER_WARNING",
        isRead: false,
      })),
    });

    return api.created(res, { sent: notifications.count }, `Đã gửi thông báo đến ${notifications.count} người`);
  } catch (err) {
    console.error("Send notification error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// PATCH /api/notifications/:id/read
export async function markAsRead(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return api.success(res, null, "Đã đánh dấu đã đọc");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// PATCH /api/notifications/read-all
export async function markAllAsRead(req: Request, res: Response) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });
    return api.success(res, null, "Đã đánh dấu tất cả đã đọc");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// GET /api/notifications/admin/sent — Xem lịch sử thông báo đã gửi (Admin/Teacher)
export async function listSentNotifications(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { type: "TEACHER_WARNING" },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { fullName: true, email: true } },
        },
      }),
      prisma.notification.count({ where: { type: "TEACHER_WARNING" } }),
    ]);

    return api.paginated(res, notifications, total, page, limit);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}