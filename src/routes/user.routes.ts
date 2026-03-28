/**
 * FILE: user.routes.ts
 * PATH: apps/api/src/routes/user.routes.ts
 * MÔ TẢ: Routes quản lý tài khoản — ADMIN + TEACHER
 */

import { Router } from "express";
import * as user from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

// ADMIN + TEACHER có thể xem danh sách
router.get("/", authorize("ADMIN", "TEACHER"), user.listUsers);
router.get("/:id", authorize("ADMIN", "TEACHER"), user.getUserById);

// ADMIN tạo mọi loại, TEACHER chỉ tạo STUDENT
router.post("/", authorize("ADMIN", "TEACHER"), user.createUser);
router.post("/bulk-create", authorize("ADMIN", "TEACHER"), user.bulkCreateStudents);

// Chỉ ADMIN mới sửa/khoá tài khoản
router.put("/:id", authorize("ADMIN"), user.updateUser);
router.patch("/:id/toggle-status", authorize("ADMIN"), user.toggleStatus);

export default router;