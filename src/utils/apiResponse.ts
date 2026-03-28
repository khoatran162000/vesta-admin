/**
 * FILE: apiResponse.ts
 * PATH: apps/api/src/utils/apiResponse.ts
 * MÔ TẢ: Format response thống nhất cho toàn bộ API
 */

import { Response } from "express";

export function success(res: Response, data: any, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function created(res: Response, data: any, message = "Created") {
  return success(res, data, message, 201);
}

export function paginated(
  res: Response,
  data: any[],
  total: number,
  page: number,
  limit: number,
  message = "Success"
) {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export function error(res: Response, message: string, statusCode = 400, errors?: any) {
  return res.status(statusCode).json({ success: false, message, errors });
}