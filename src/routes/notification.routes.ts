// FILE: src/routes/notification.routes.ts — Routes thong bao

import { Router } from "express";
import * as notification from "../controllers/notification.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

// Tất cả user đã login có thể xem thông báo của mình
router.get("/", notification.listNotifications);
router.patch("/:id/read", notification.markAsRead);
router.patch("/read-all", notification.markAllAsRead);

// Chỉ ADMIN + TEACHER mới gửi và xem lịch sử gửi
router.post("/send", authorize("ADMIN", "TEACHER"), notification.sendNotification);
router.get("/admin/sent", authorize("ADMIN", "TEACHER"), notification.listSentNotifications);

export default router;