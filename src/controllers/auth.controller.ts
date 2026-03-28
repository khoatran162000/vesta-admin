// FILE: src/controllers/auth.controller.ts — Login bang email (Staff) HOAC studentCode (Student)

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/database";
import { generateTokenPair } from "../utils/jwt";
import * as api from "../utils/apiResponse";
import multer from "multer";
import path from "path";

// ═══════════════════════ LOGIN ═══════════════════════

/**
 * POST /api/auth/login
 * Body: { email, password } hoặc { studentCode, password }
 *
 * - Staff (Admin, Teacher, MKT): đăng nhập bằng email
 * - Student: đăng nhập bằng studentCode (VD: VS2025001)
 * - Hệ thống tự nhận diện: nếu gửi studentCode → tìm theo studentCode, nếu gửi email → tìm theo email
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, studentCode, password } = req.body;

    if (!password) {
      return api.error(res, "Mật khẩu không được để trống");
    }

    if (!email && !studentCode) {
      return api.error(res, "Vui lòng nhập Email hoặc Mã học viên");
    }

    let user;

    if (studentCode) {
      // Login bằng mã học viên
      user = await prisma.user.findUnique({ where: { studentCode } });
      if (!user) return api.error(res, "Mã học viên không tồn tại", 401);
    } else {
      // Login bằng email — tìm chính xác
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) return api.error(res, "Email không tồn tại", 401);
    }

    // Kiểm tra tài khoản bị khoá
    if (!user.isActive) {
      return api.error(res, "Tài khoản đã bị khoá. Liên hệ quản trị viên.", 403);
    }

    // Kiểm tra mật khẩu
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return api.error(res, "Mật khẩu không đúng", 401);

    // Kiểm tra quyền truy cập CMS/Admin (chỉ Staff mới vào Admin Portal)
    // Student vẫn login được nhưng sẽ vào Student Portal

    const tokens = generateTokenPair({ userId: user.id, role: user.role });

    return api.success(res, {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        studentCode: user.studentCode,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// ═══════════════════════ REFRESH TOKEN ═══════════════════════

export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return api.error(res, "Refresh token không được để trống");

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "refresh-secret");

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) return api.error(res, "Token không hợp lệ", 401);

    const tokens = generateTokenPair({ userId: user.id, role: user.role });
    return api.success(res, tokens);
  } catch (err) {
    return api.error(res, "Refresh token không hợp lệ hoặc đã hết hạn", 401);
  }
}

// ═══════════════════════ GET CURRENT USER ═══════════════════════

export async function getMe(req: Request, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, email: true, studentCode: true, fullName: true,
        phone: true, address: true, role: true, avatarUrl: true,
        isActive: true, createdAt: true,
      },
    });
    if (!user) return api.error(res, "Không tìm thấy tài khoản", 404);
    return api.success(res, user);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// ═══════════════════════ UPDATE PROFILE ═══════════════════════

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/avatars"),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Chỉ chấp nhận file ảnh") as any, false);
  },
}).single("avatar");

export async function updateProfile(req: Request, res: Response) {
  try {
    const { fullName, phone, address } = req.body;
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone || null;
    if (address !== undefined) updateData.address = address || null;
    if (req.file) updateData.avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: updateData,
      select: {
        id: true, email: true, studentCode: true, fullName: true,
        phone: true, address: true, role: true, avatarUrl: true,
      },
    });
    return api.success(res, user, "Cập nhật profile thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// ═══════════════════════ CHANGE PASSWORD ═══════════════════════

export async function changePassword(req: Request, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return api.error(res, "Mật khẩu cũ và mới không được để trống");
    if (newPassword.length < 6) return api.error(res, "Mật khẩu mới tối thiểu 6 ký tự");

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return api.error(res, "Không tìm thấy tài khoản", 404);

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return api.error(res, "Mật khẩu hiện tại không đúng", 400);

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

    return api.success(res, null, "Đổi mật khẩu thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}
