/**
 * FILE: auth.middleware.ts
 * PATH: apps/api/src/middlewares/auth.middleware.ts
 * MÔ TẢ: Xác thực JWT token — gắn user info vào req.user
 */

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";
import { error } from "../utils/apiResponse";

// Extend Express Request để thêm user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return error(res, "Không có token xác thực", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return error(res, "Token không hợp lệ hoặc đã hết hạn", 401);
  }
}