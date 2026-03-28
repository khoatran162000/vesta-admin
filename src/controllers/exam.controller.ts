/**
 * FILE: exam.controller.ts
 * PATH: apps/api/src/controllers/exam.controller.ts
 * MÔ TẢ: Quản lý đề thi — list, create, update, delete, toggle publish
 */

import { Request, Response } from "express";
import prisma from "../config/database";
import * as api from "../utils/apiResponse";

type Params = { [key: string]: string };

// GET /api/exams?categoryId=xxx&status=PUBLISHED&page=1&limit=20
export async function listExams(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const categoryId = req.query.categoryId as string;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (search) where.title = { contains: search };

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { questions: true, examAttempts: true } },
        },
      }),
      prisma.exam.count({ where }),
    ]);

    return api.paginated(res, exams, total, page, limit);
  } catch (err) {
    console.error("List exams error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// GET /api/exams/:id
export async function getExamById(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        questions: { orderBy: { orderIndex: "asc" } },
        _count: { select: { examAttempts: true } },
      },
    });

    if (!exam) return api.error(res, "Đề thi không tồn tại", 404);
    return api.success(res, exam);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// POST /api/exams
export async function createExam(req: Request, res: Response) {
  try {
    const { categoryId, title, description, duration, totalScore } = req.body;

    if (!categoryId || !title || !duration || totalScore === undefined) {
      return api.error(res, "Category, tiêu đề, thời gian và tổng điểm không được để trống");
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return api.error(res, "Danh mục không tồn tại", 404);

    const exam = await prisma.exam.create({
      data: {
        categoryId,
        title,
        description: description || null,
        duration: parseInt(duration),
        totalScore: parseFloat(totalScore),
        status: "DRAFT",
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return api.created(res, exam, "Tạo đề thi thành công");
  } catch (err) {
    console.error("Create exam error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// PUT /api/exams/:id
export async function updateExam(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const { categoryId, title, description, duration, totalScore, status } = req.body;

    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing) return api.error(res, "Đề thi không tồn tại", 404);

    const updateData: any = {};
    if (categoryId) updateData.categoryId = categoryId;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (duration) updateData.duration = parseInt(duration);
    if (totalScore !== undefined) updateData.totalScore = parseFloat(totalScore);
    if (status) updateData.status = status;

    const exam = await prisma.exam.update({
      where: { id },
      data: updateData,
      include: { category: { select: { id: true, name: true } } },
    });

    return api.success(res, exam, "Cập nhật đề thi thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// DELETE /api/exams/:id
export async function deleteExam(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const existing = await prisma.exam.findUnique({
      where: { id },
      include: { _count: { select: { examAttempts: true } } },
    });
    if (!existing) return api.error(res, "Đề thi không tồn tại", 404);

    if (existing._count.examAttempts > 0) {
      return api.error(res, `Không thể xoá đề thi đã có ${existing._count.examAttempts} lượt làm bài. Hãy chuyển sang Bản nháp thay vì xoá.`);
    }

    // Cascade delete questions
    await prisma.exam.delete({ where: { id } });
    return api.success(res, null, "Xoá đề thi thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}