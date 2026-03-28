/**
 * FILE: category.controller.ts
 * PATH: apps/api/src/controllers/category.controller.ts
 * MÔ TẢ: Quản lý Categories (cấu trúc cây) — list tree, create, update, delete
 */

import { Request, Response } from "express";
import prisma from "../config/database";
import * as api from "../utils/apiResponse";

type Params = { [key: string]: string };

// GET /api/categories — trả về cây danh mục
export async function listCategories(_req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        children: {
          include: {
            children: {
              include: { children: true, _count: { select: { exams: true } } },
            },
            _count: { select: { exams: true } },
          },
        },
        _count: { select: { exams: true } },
      },
      where: { parentId: null }, // Chỉ lấy root categories
      orderBy: { createdAt: "asc" },
    });

    return api.success(res, categories);
  } catch (err) {
    console.error("List categories error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// GET /api/categories/flat — danh sách phẳng (cho dropdown select)
export async function listCategoriesFlat(_req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: { select: { name: true } },
        _count: { select: { exams: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return api.success(res, categories);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// GET /api/categories/:id
export async function getCategoryById(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        exams: {
          select: { id: true, title: true, status: true, duration: true, totalScore: true, _count: { select: { questions: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!category) return api.error(res, "Danh mục không tồn tại", 404);
    return api.success(res, category);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// POST /api/categories
export async function createCategory(req: Request, res: Response) {
  try {
    const { name, description, parentId } = req.body;
    if (!name) return api.error(res, "Tên danh mục không được để trống");

    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) return api.error(res, "Danh mục cha không tồn tại", 404);
    }

    const category = await prisma.category.create({
      data: { name, description: description || null, parentId: parentId || null },
    });

    return api.created(res, category, "Tạo danh mục thành công");
  } catch (err) {
    console.error("Create category error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// PUT /api/categories/:id
export async function updateCategory(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const { name, description, parentId } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return api.error(res, "Danh mục không tồn tại", 404);

    // Không cho đặt parent là chính nó
    if (parentId === id) return api.error(res, "Danh mục không thể là cha của chính nó");

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (parentId !== undefined) updateData.parentId = parentId || null;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return api.success(res, category, "Cập nhật danh mục thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// DELETE /api/categories/:id
export async function deleteCategory(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { children: true, exams: true },
    });
    if (!existing) return api.error(res, "Danh mục không tồn tại", 404);

    if (existing.children.length > 0) {
      return api.error(res, "Không thể xoá danh mục đang có danh mục con. Xoá danh mục con trước.");
    }
    if (existing.exams.length > 0) {
      return api.error(res, "Không thể xoá danh mục đang có đề thi. Di chuyển hoặc xoá đề thi trước.");
    }

    await prisma.category.delete({ where: { id } });
    return api.success(res, null, "Xoá danh mục thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}