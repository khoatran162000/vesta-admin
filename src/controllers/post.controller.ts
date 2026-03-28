/**
 * FILE: post.controller.ts
 * PATH: apps/api/src/controllers/post.controller.ts
 * MÔ TẢ: CRUD bài viết blog — list, detail, create, update, delete, upload image
 */

import { Request, Response } from "express";
import slugify from "slugify";
import prisma from "../config/database";
import * as api from "../utils/apiResponse";

type Params = { [key: string]: string };

// ═══════════════════════ PUBLIC ═══════════════════════

// GET /api/posts?status=PUBLISHED&page=1&limit=10&tag=Listening
export async function listPosts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const status = req.query.status as string;
    const tag = req.query.tag as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (tag) {
      where.tags = { string_contains: tag };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          thumbnailUrl: true,
          tags: true,
          status: true,
          createdAt: true,
          author: {
            select: { fullName: true, avatarUrl: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    // Parse tags JSON string thành array
    const parsed = posts.map((p) => ({
      ...p,
      tags: typeof p.tags === "string" ? JSON.parse(p.tags as string) : p.tags,
    }));

    return api.paginated(res, parsed, total, page, limit);
  } catch (err) {
    console.error("List posts error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// GET /api/posts/:slug
export async function getPostBySlug(req: Request<Params>, res: Response) {
  try {
    const { slug } = req.params;

    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: { select: { fullName: true, avatarUrl: true } },
      },
    });

    if (!post) {
      return api.error(res, "Bài viết không tồn tại", 404);
    }

    const parsed = {
      ...post,
      tags: typeof post.tags === "string" ? JSON.parse(post.tags as string) : post.tags,
    };

    return api.success(res, parsed);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// ═══════════════════════ CMS (yêu cầu đăng nhập) ═══════════════════════

// GET /api/posts/admin/all?page=1&limit=20&status=DRAFT
export async function listAllPosts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = req.query.status as string;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { tags: { string_contains: search } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          author: { select: { fullName: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const parsed = posts.map((p) => ({
      ...p,
      tags: typeof p.tags === "string" ? JSON.parse(p.tags as string) : p.tags,
    }));

    return api.paginated(res, parsed, total, page, limit);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// GET /api/posts/admin/:id
export async function getPostById(req: Request<Params>, res: Response) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: { author: { select: { fullName: true } } },
    });

    if (!post) {
      return api.error(res, "Bài viết không tồn tại", 404);
    }

    const parsed = {
      ...post,
      tags: typeof post.tags === "string" ? JSON.parse(post.tags as string) : post.tags,
    };

    return api.success(res, parsed);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// POST /api/posts
export async function createPost(req: Request, res: Response) {
  try {
    const { title, excerpt, content, tags, status } = req.body;

    if (!title || !content) {
      return api.error(res, "Tiêu đề và nội dung không được để trống");
    }

    // Tạo slug từ title
    let slug = slugify(title, { lower: true, strict: true, locale: "vi" });

    // Đảm bảo slug unique
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    // Xử lý thumbnail
    const thumbnailUrl = req.file ? `/uploads/blog/${req.file.filename}` : null;

    // Ước tính readTime
    const textOnly = content.replace(/<[^>]*>/g, "");
    const wordCount = textOnly.split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const post = await prisma.post.create({
      data: {
        authorId: req.user!.userId,
        title,
        slug,
        excerpt: excerpt || null,
        content,
        thumbnailUrl,
        tags: typeof tags === "string" ? tags : JSON.stringify(tags || []),
        status: status || "DRAFT",
      },
      include: { author: { select: { fullName: true } } },
    });

    const parsed = {
      ...post,
      tags: typeof post.tags === "string" ? JSON.parse(post.tags as string) : post.tags,
      readTime: `${readTime} phút đọc`,
    };

    return api.created(res, parsed, "Tạo bài viết thành công");
  } catch (err) {
    console.error("Create post error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// PUT /api/posts/:id
export async function updatePost(req: Request<Params>, res: Response) {
  try {
    const { id } = req.params;
    const { title, excerpt, content, tags, status } = req.body;

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      return api.error(res, "Bài viết không tồn tại", 404);
    }

    const updateData: any = {};

    if (title && title !== existing.title) {
      updateData.title = title;
      let newSlug = slugify(title, { lower: true, strict: true, locale: "vi" });
      const slugExists = await prisma.post.findFirst({
        where: { slug: newSlug, NOT: { id } },
      });
      if (slugExists) newSlug = `${newSlug}-${Date.now()}`;
      updateData.slug = newSlug;
    }

    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) {
      updateData.tags = typeof tags === "string" ? tags : JSON.stringify(tags);
    }

    // Thumbnail mới (nếu upload)
    if (req.file) {
      updateData.thumbnailUrl = `/uploads/blog/${req.file.filename}`;
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
      include: { author: { select: { fullName: true } } },
    });

    const parsed = {
      ...post,
      tags: typeof post.tags === "string" ? JSON.parse(post.tags as string) : post.tags,
    };

    return api.success(res, parsed, "Cập nhật bài viết thành công");
  } catch (err) {
    console.error("Update post error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// DELETE /api/posts/:id
export async function deletePost(req: Request<Params>, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      return api.error(res, "Bài viết không tồn tại", 404);
    }

    await prisma.post.delete({ where: { id } });

    return api.success(res, null, "Xoá bài viết thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// POST /api/posts/upload-image
export async function uploadContentImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      return api.error(res, "Không có file nào được upload");
    }

    const imageUrl = `/uploads/blog/${req.file.filename}`;
    return api.success(res, { url: imageUrl }, "Upload ảnh thành công");
  } catch (err) {
    return api.error(res, "Lỗi upload", 500);
  }
}