/**
 * FILE: attempt.routes.ts
 * PATH: apps/api/src/routes/attempt.routes.ts
 * MÔ TẢ: Routes xem lịch sử thi — ADMIN + TEACHER
 */

import { Router } from "express";
import * as attempt from "../controllers/attempt.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const roles = ["ADMIN", "TEACHER"];

router.use(authenticate, authorize(...roles));

router.get("/", attempt.listAttempts);
router.get("/:id", attempt.getAttemptById);
router.get("/student/:studentId/stats", attempt.getStudentStats);

export default router;