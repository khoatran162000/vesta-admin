// FILE: src/routes/auth.routes.ts — Login email (Staff) + studentCode (Student)

import { Router } from "express";
import * as auth from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Public — login hỗ trợ cả email và studentCode
router.post("/login", auth.login);
router.post("/refresh", auth.refreshToken);

// Protected
router.get("/me", authenticate, auth.getMe);
router.put("/profile", authenticate, auth.uploadAvatar, auth.updateProfile);
router.put("/change-password", authenticate, auth.changePassword);

export default router;
