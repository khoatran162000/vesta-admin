/**
 * FILE: role.middleware.ts
 * PATH: apps/api/src/middlewares/role.middleware.ts
 * MÔ TẢ: Kiểm tra quyền theo role — dùng sau authenticate middleware
 */

import { Request, Response, NextFunction } from "express";
import { error } from "../utils/apiResponse";

export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return error(res, "Chưa xác thực", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(res, "Bạn không có quyền thực hiện hành động này", 403);
    }

    next();
  };
}