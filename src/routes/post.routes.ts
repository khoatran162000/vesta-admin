/**
 * FILE: post.routes.ts
 * PATH: apps/api/src/routes/post.routes.ts
 * MÔ TẢ: Routes cho bài viết blog — public (đọc) + CMS (CRUD, upload)
 */

import { Router } from "express";
import * as post from "../controllers/post.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { uploadThumbnail, uploadImages } from "../middlewares/upload.middleware";

const router = Router();
const cmsRoles = ["ADMIN", "CONTENT_CREATOR"];

// ═══════ PUBLIC — Trang blog đọc bài ═══════
router.get("/", post.listPosts);
router.get("/detail/:slug", post.getPostBySlug);

// ═══════ CMS — Quản trị bài viết (yêu cầu đăng nhập) ═══════
router.get("/admin/all", authenticate, authorize(...cmsRoles), post.listAllPosts);
router.get("/admin/:id", authenticate, authorize(...cmsRoles), post.getPostById);
router.post("/", authenticate, authorize(...cmsRoles), uploadThumbnail, post.createPost);
router.put("/:id", authenticate, authorize(...cmsRoles), uploadThumbnail, post.updatePost);
router.delete("/:id", authenticate, authorize(...cmsRoles), post.deletePost);

// Upload ảnh trong nội dung bài viết (TipTap editor)
router.post("/upload-image", authenticate, authorize(...cmsRoles), uploadImages, post.uploadContentImage);

export default router;