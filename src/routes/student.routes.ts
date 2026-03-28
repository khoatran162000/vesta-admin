// FILE: src/routes/student.routes.ts — Routes cho Student Portal

import { Router } from "express";
import * as student from "../controllers/student.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();

// Tất cả route yêu cầu đăng nhập + role STUDENT
router.use(authenticate, authorize("STUDENT"));

// Dashboard
router.get("/dashboard", student.getDashboard);

// Browse exams
router.get("/categories", student.getCategories);
router.get("/exams", student.getExams);

// Exam engine
router.post("/exams/:examId/start", student.startExam);
router.put("/attempts/:attemptId/save", student.saveAnswers);
router.post("/attempts/:attemptId/submit", student.submitExam);

// History & review
router.get("/history", student.getHistory);
router.get("/history/:attemptId", student.getAttemptReview);

// Notifications
router.get("/notifications", student.getNotifications);
router.patch("/notifications/read-all", student.markAllRead);

export default router;