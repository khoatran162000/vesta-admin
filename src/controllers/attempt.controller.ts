// FILE: src/controllers/attempt.controller.ts — Xem lich su thi + chi tiet bai lam + phan tich loi sai

import { Request, Response } from "express";
import prisma from "../config/database";
import * as api from "../utils/apiResponse";

type Params = { [key: string]: string };

// GET /api/attempts?studentId=xxx&examId=xxx&page=1
export async function listAttempts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const studentId = req.query.studentId as string;
    const examId = req.query.examId as string;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (examId) where.examId = examId;
    if (status) where.status = status;

    const [attempts, total] = await Promise.all([
      prisma.examAttempt.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          student: { select: { id: true, fullName: true, email: true } },
          exam: { select: { id: true, title: true, duration: true, totalScore: true } },
        },
      }),
      prisma.examAttempt.count({ where }),
    ]);

    return api.paginated(res, attempts, total, page, limit);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// GET /api/attempts/:id — Chi tiết 1 lượt thi kèm câu hỏi + đáp án đúng/sai
export async function getAttemptById(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const attempt = await prisma.examAttempt.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        exam: {
          include: {
            questions: { orderBy: { orderIndex: "asc" } },
          },
        },
      },
    });

    if (!attempt) return api.error(res, "Lượt thi không tồn tại", 404);

    // Parse answers và so sánh với correctAnswer để biết đúng/sai
    const studentAnswers = attempt.answers ? (typeof attempt.answers === "string" ? JSON.parse(attempt.answers as string) : attempt.answers) as Record<string, any> : {};
    const studentNotes = attempt.studentNotes ? (typeof attempt.studentNotes === "string" ? JSON.parse(attempt.studentNotes as string) : attempt.studentNotes) as Record<string, any> : {};

    const questionsWithResult = attempt.exam.questions.map((q, i) => {
      const studentAnswer = studentAnswers[q.id] ?? null;
      const correctAnswer = q.correctAnswer;

      // So sánh đáp án
      let isCorrect: boolean | null = null;
      if (q.type === "ESSAY") {
        isCorrect = null; // Chấm thủ công
      } else if (studentAnswer !== null && studentAnswer !== undefined && studentAnswer !== "") {
        const correct = typeof correctAnswer === "string" ? correctAnswer : JSON.stringify(correctAnswer);
        const student = typeof studentAnswer === "string" ? studentAnswer : JSON.stringify(studentAnswer);
        isCorrect = correct.toLowerCase().trim() === student.toLowerCase().trim();
      }

      return {
        questionNumber: i + 1,
        questionId: q.id,
        type: q.type,
        content: q.content,
        mediaUrl: q.mediaUrl,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        score: q.score,
        studentAnswer,
        isCorrect,
        studentNote: studentNotes[q.id] || null,
      };
    });

    // Thống kê
    const totalQuestions = questionsWithResult.length;
    const answered = questionsWithResult.filter((q) => q.studentAnswer !== null && q.studentAnswer !== "").length;
    const correct = questionsWithResult.filter((q) => q.isCorrect === true).length;
    const wrong = questionsWithResult.filter((q) => q.isCorrect === false).length;
    const essay = questionsWithResult.filter((q) => q.isCorrect === null && q.type === "ESSAY").length;

    // Phân tích lỗi sai theo dạng câu hỏi
    const errorByType: Record<string, { total: number; wrong: number }> = {};
    questionsWithResult.forEach((q) => {
      if (!errorByType[q.type]) errorByType[q.type] = { total: 0, wrong: 0 };
      errorByType[q.type].total++;
      if (q.isCorrect === false) errorByType[q.type].wrong++;
    });

    return api.success(res, {
      id: attempt.id,
      student: attempt.student,
      exam: {
        id: attempt.exam.id,
        title: attempt.exam.title,
        duration: attempt.exam.duration,
        totalScore: attempt.exam.totalScore,
      },
      startTime: attempt.startTime,
      endTime: attempt.endTime,
      status: attempt.status,
      score: attempt.score,
      summary: { totalQuestions, answered, correct, wrong, essay },
      errorByType,
      questions: questionsWithResult,
    });
  } catch (err) {
    console.error("Get attempt detail error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// GET /api/attempts/student/:studentId/stats
export async function getStudentStats(req: Request<Params>, res: Response) {
  try {
    const studentId = req.params.studentId as string;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true },
    });
    if (!student) return api.error(res, "Học viên không tồn tại", 404);

    const [totalAttempts, submittedAttempts, avgScore, recentAttempts, lastActivity] = await Promise.all([
      prisma.examAttempt.count({ where: { studentId } }),
      prisma.examAttempt.count({ where: { studentId, status: "SUBMITTED" } }),
      prisma.examAttempt.aggregate({
        where: { studentId, status: "SUBMITTED", score: { not: null } },
        _avg: { score: true },
        _max: { score: true },
        _min: { score: true },
      }),
      prisma.examAttempt.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          exam: { select: { title: true, totalScore: true, duration: true } },
        },
      }),
      prisma.examAttempt.findFirst({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    // Tính số ngày không hoạt động
    const daysSinceLastActivity = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return api.success(res, {
      student,
      stats: {
        totalAttempts,
        submittedAttempts,
        averageScore: avgScore._avg.score ? Math.round(avgScore._avg.score * 100) / 100 : null,
        highestScore: avgScore._max.score,
        lowestScore: avgScore._min.score,
        daysSinceLastActivity,
        lastActivityDate: lastActivity?.createdAt || null,
      },
      recentAttempts,
    });
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}