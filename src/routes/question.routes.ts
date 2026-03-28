/**
 * FILE: question.routes.ts
 * PATH: apps/api/src/routes/question.routes.ts
 * MÔ TẢ: Routes quản lý câu hỏi — ADMIN + TEACHER
 */

import { Router } from "express";
import * as question from "../controllers/question.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const roles = ["ADMIN", "TEACHER"];

router.use(authenticate, authorize(...roles));

router.get("/", question.listQuestions);
router.get("/:id", question.getQuestionById);
router.post("/", question.createQuestion);
router.put("/reorder", question.reorderQuestions);
router.put("/:id", question.updateQuestion);
router.delete("/:id", question.deleteQuestion);

export default router;