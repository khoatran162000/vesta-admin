// FILE: src/controllers/user.controller.ts — Quan ly tai khoan voi studentCode, phone, address

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/database";
import * as api from "../utils/apiResponse";

type Params = { [key: string]: string };

/**
 * Tự động tạo mã học viên tiếp theo
 * Format: VS + năm + số thứ tự 3 chữ số (VD: VS2025001, VS2025002, ...)
 */
async function generateStudentCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `VS${year}`;

  const lastStudent = await prisma.user.findFirst({
    where: { studentCode: { startsWith: prefix } },
    orderBy: { studentCode: "desc" },
    select: { studentCode: true },
  });

  let nextNumber = 1;
  if (lastStudent?.studentCode) {
    const numPart = lastStudent.studentCode.replace(prefix, "");
    nextNumber = parseInt(numPart) + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}

// GET /api/users?role=STUDENT&page=1&limit=20&search=nguyen
export async function listUsers(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const role = req.query.role as string;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { studentCode: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true, email: true, studentCode: true, fullName: true,
          phone: true, address: true, role: true, avatarUrl: true,
          isActive: true, createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return api.paginated(res, users, total, page, limit);
  } catch (err) {
    console.error("List users error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// GET /api/users/:id
export async function getUserById(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, studentCode: true, fullName: true,
        phone: true, address: true, role: true, avatarUrl: true,
        isActive: true, createdAt: true, updatedAt: true,
        _count: { select: { posts: true, examAttempts: true } },
      },
    });

    if (!user) return api.error(res, "Tài khoản không tồn tại", 404);
    return api.success(res, user);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// POST /api/users
export async function createUser(req: Request, res: Response) {
  try {
    const { email, password, fullName, role, phone, address, studentCode } = req.body;

    if (!fullName || !role) {
      return api.error(res, "Họ tên và vai trò không được để trống");
    }

    // Phân quyền tạo tài khoản
    const currentRole = req.user!.role;
    if (currentRole === "TEACHER" && role !== "STUDENT") {
      return api.error(res, "Giáo viên chỉ có thể tạo tài khoản học viên", 403);
    }
    if (currentRole !== "ADMIN" && (role === "ADMIN" || role === "TEACHER" || role === "CONTENT_CREATOR")) {
      return api.error(res, "Chỉ Admin mới có thể tạo tài khoản nhân sự", 403);
    }

    // Validate theo role
    if (role === "STUDENT") {
      // Student: tự động tạo studentCode nếu không cung cấp
      let code = studentCode;
      if (!code) code = await generateStudentCode();

      // Kiểm tra trùng studentCode
      const existingCode = await prisma.user.findUnique({ where: { studentCode: code } });
      if (existingCode) return api.error(res, `Mã học viên ${code} đã tồn tại`, 409);

      // Kiểm tra trùng email nếu có
      if (email) {
        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) return api.error(res, "Email đã được sử dụng", 409);
      }

      const passwordHash = await bcrypt.hash(password || "Student@123", 12);

      const user = await prisma.user.create({
        data: {
          email: email || null,
          studentCode: code,
          passwordHash,
          fullName,
          phone: phone || null,
          address: address || null,
          role: "STUDENT",
          isActive: true,
        },
        select: {
          id: true, email: true, studentCode: true, fullName: true,
          phone: true, address: true, role: true, isActive: true, createdAt: true,
        },
      });

      return api.created(res, user, `Tạo học viên thành công. Mã HV: ${code}`);
    } else {
      // Staff: bắt buộc có email
      if (!email) return api.error(res, "Email bắt buộc cho tài khoản nhân sự");
      if (!password) return api.error(res, "Mật khẩu không được để trống");

      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) return api.error(res, "Email đã được sử dụng", 409);

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: { email, passwordHash, fullName, phone: phone || null, role, isActive: true },
        select: {
          id: true, email: true, fullName: true, phone: true,
          role: true, isActive: true, createdAt: true,
        },
      });

      return api.created(res, user, "Tạo tài khoản thành công");
    }
  } catch (err) {
    console.error("Create user error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// PUT /api/users/:id
export async function updateUser(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const { fullName, role, password, phone, address, email } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return api.error(res, "Tài khoản không tồn tại", 404);

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (role) updateData.role = role;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);
    if (phone !== undefined) updateData.phone = phone || null;
    if (address !== undefined) updateData.address = address || null;
    if (email !== undefined) updateData.email = email || null;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, email: true, studentCode: true, fullName: true,
        phone: true, address: true, role: true, isActive: true, createdAt: true,
      },
    });

    return api.success(res, user, "Cập nhật tài khoản thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// PATCH /api/users/:id/toggle-status
export async function toggleStatus(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return api.error(res, "Tài khoản không tồn tại", 404);

    if (id === req.user!.userId) {
      return api.error(res, "Không thể khoá tài khoản của chính mình", 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: !existing.isActive },
      select: { id: true, fullName: true, isActive: true },
    });

    const status = user.isActive ? "mở khoá" : "khoá";
    return api.success(res, user, `Đã ${status} tài khoản ${user.fullName}`);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// POST /api/users/bulk-create — Import hàng loạt (chỉ Student)
export async function bulkCreateStudents(req: Request, res: Response) {
  try {
    const { students } = req.body;
    // students: [{ fullName, email?, phone?, address?, password?, studentCode? }]

    if (!Array.isArray(students) || students.length === 0) {
      return api.error(res, "Danh sách học viên không hợp lệ");
    }
    if (students.length > 200) {
      return api.error(res, "Tối đa 200 học viên mỗi lần import");
    }

    const results = { created: 0, skipped: 0, errors: [] as string[], createdStudents: [] as any[] };

    for (const s of students) {
      if (!s.fullName) {
        results.errors.push(`Thiếu họ tên: ${JSON.stringify(s)}`);
        results.skipped++;
        continue;
      }

      // Kiểm tra trùng email
      if (s.email) {
        const existingEmail = await prisma.user.findUnique({ where: { email: s.email } });
        if (existingEmail) {
          results.errors.push(`Email đã tồn tại: ${s.email}`);
          results.skipped++;
          continue;
        }
      }

      // Kiểm tra trùng studentCode
      let code = s.studentCode;
      if (code) {
        const existingCode = await prisma.user.findUnique({ where: { studentCode: code } });
        if (existingCode) {
          results.errors.push(`Mã HV đã tồn tại: ${code}`);
          results.skipped++;
          continue;
        }
      } else {
        code = await generateStudentCode();
      }

      const password = s.password || "Student@123";
      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email: s.email || null,
          studentCode: code,
          passwordHash,
          fullName: s.fullName,
          phone: s.phone || null,
          address: s.address || null,
          role: "STUDENT",
          isActive: true,
        },
        select: { id: true, studentCode: true, fullName: true },
      });

      results.createdStudents.push({ studentCode: code, fullName: s.fullName, password });
      results.created++;
    }

    return api.success(res, results, `Đã tạo ${results.created} tài khoản, bỏ qua ${results.skipped}`);
  } catch (err) {
    console.error("Bulk create error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}
