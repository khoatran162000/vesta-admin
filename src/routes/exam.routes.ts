/**
 * FILE: exam.routes.ts
 * PATH: apps/api/src/routes/exam.routes.ts
 * MÔ TẢ: Routes quản lý đề thi — ADMIN + TEACHER
 */

import { Router } from "express";
import * as exam from "../controllers/exam.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const roles = ["ADMIN", "TEACHER"];

router.use(authenticate, authorize(...roles));

router.get("/", exam.listExams);
router.get("/:id", exam.getExamById);
router.post("/", exam.createExam);
router.put("/:id", exam.updateExam);
router.delete("/:id", exam.deleteExam);

export default router;