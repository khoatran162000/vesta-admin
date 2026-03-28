/**
 * FILE: question.controller.ts
 * PATH: apps/api/src/controllers/question.controller.ts
 * MÔ TẢ: Quản lý câu hỏi — list by exam, create, update, delete, reorder
 */

import { Request, Response } from "express";
import prisma from "../config/database";
import * as api from "../utils/apiResponse";

type Params = { [key: string]: string };

// GET /api/questions?examId=xxx
export async function listQuestions(req: Request, res: Response) {
  try {
    const examId = req.query.examId as string;
    if (!examId) return api.error(res, "examId là bắt buộc");

    const questions = await prisma.question.findMany({
      where: { examId },
      orderBy: { orderIndex: "asc" },
    });

    return api.success(res, questions);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// GET /api/questions/:id
export async function getQuestionById(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const question = await prisma.question.findUnique({
      where: { id },
      include: { exam: { select: { id: true, title: true } } },
    });

    if (!question) return api.error(res, "Câu hỏi không tồn tại", 404);
    return api.success(res, question);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// POST /api/questions
export async function createQuestion(req: Request, res: Response) {
  try {
    const { examId, type, content, mediaUrl, options, correctAnswer, explanation, score } = req.body;

    if (!examId || !type || !content || correctAnswer === undefined) {
      return api.error(res, "examId, loại câu hỏi, nội dung và đáp án đúng không được để trống");
    }

    // Kiểm tra exam tồn tại
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return api.error(res, "Đề thi không tồn tại", 404);

    // Lấy orderIndex tiếp theo
    const lastQuestion = await prisma.question.findFirst({
      where: { examId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    const nextOrder = (lastQuestion?.orderIndex ?? -1) + 1;

    const question = await prisma.question.create({
      data: {
        examId,
        type,
        content,
        mediaUrl: mediaUrl || null,
        options: options ? (typeof options === "string" ? JSON.parse(options) : options) : null,
        correctAnswer: typeof correctAnswer === "string" ? JSON.parse(correctAnswer) : correctAnswer,
        explanation: explanation || null,
        orderIndex: nextOrder,
        score: score ? parseFloat(score) : 1,
      },
    });

    return api.created(res, question, "Tạo câu hỏi thành công");
  } catch (err) {
    console.error("Create question error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// PUT /api/questions/:id
export async function updateQuestion(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const { type, content, mediaUrl, options, correctAnswer, explanation, score } = req.body;

    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) return api.error(res, "Câu hỏi không tồn tại", 404);

    const updateData: any = {};
    if (type) updateData.type = type;
    if (content) updateData.content = content;
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl || null;
    if (options !== undefined) {
      updateData.options = typeof options === "string" ? JSON.parse(options) : options;
    }
    if (correctAnswer !== undefined) {
      updateData.correctAnswer = typeof correctAnswer === "string" ? JSON.parse(correctAnswer) : correctAnswer;
    }
    if (explanation !== undefined) updateData.explanation = explanation;
    if (score !== undefined) updateData.score = parseFloat(score);

    const question = await prisma.question.update({
      where: { id },
      data: updateData,
    });

    return api.success(res, question, "Cập nhật câu hỏi thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// DELETE /api/questions/:id
export async function deleteQuestion(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) return api.error(res, "Câu hỏi không tồn tại", 404);

    await prisma.question.delete({ where: { id } });
    return api.success(res, null, "Xoá câu hỏi thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// PUT /api/questions/reorder
export async function reorderQuestions(req: Request, res: Response) {
  try {
    const { orders } = req.body;
    // orders: [{ id: "xxx", orderIndex: 0 }, { id: "yyy", orderIndex: 1 }, ...]

    if (!Array.isArray(orders)) return api.error(res, "Dữ liệu không hợp lệ");

    for (const item of orders) {
      await prisma.question.update({
        where: { id: item.id },
        data: { orderIndex: item.orderIndex },
      });
    }

    return api.success(res, null, "Sắp xếp lại câu hỏi thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}