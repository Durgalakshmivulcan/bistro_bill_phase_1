import { Router } from "express";
import { authenticate, requireUserType } from "../middleware/auth.middleware";
import { imageUpload, uploadToS3Middleware } from "../middleware/upload.middleware";
import {
  deleteOwnBusinessAvatar,
  updateOwnBusinessProfile,
} from "../controllers/businessOwner.controller";

const router = Router();

/**
 * PUT /api/v1/business-owner/profile
 */
router.put(
  "/profile",
  authenticate,
  requireUserType("BusinessOwner"),
  imageUpload.single("avatar"),
  uploadToS3Middleware("business-owner"),
  updateOwnBusinessProfile
);

/**
 * DELETE /api/v1/business-owner/profile/avatar
 */
router.delete(
  "/profile/avatar",
  authenticate,
  requireUserType("BusinessOwner"),
  deleteOwnBusinessAvatar
);

export default router;
