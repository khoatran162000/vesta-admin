/**
 * FILE: category.routes.ts
 * PATH: apps/api/src/routes/category.routes.ts
 * MÔ TẢ: Routes quản lý danh mục đề thi — ADMIN + TEACHER
 */

import { Router } from "express";
import * as category from "../controllers/category.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const roles = ["ADMIN", "TEACHER"];

router.use(authenticate, authorize(...roles));

router.get("/", category.listCategories);
router.get("/flat", category.listCategoriesFlat);
router.get("/:id", category.getCategoryById);
router.post("/", category.createCategory);
router.put("/:id", category.updateCategory);
router.delete("/:id", category.deleteCategory);

export default router;