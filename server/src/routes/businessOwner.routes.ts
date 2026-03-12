import { Router } from "express";
import { authenticate, requireUserType } from "../middleware/auth.middleware";
import { imageUpload } from "../middleware/upload.middleware";
import { updateOwnBusinessProfile } from "../controllers/businessOwner.controller";

const router = Router();

/**
 * PUT /api/v1/business-owner/profile
 */
router.put(
  "/profile",
  authenticate,
  requireUserType("BusinessOwner"),
  imageUpload.single("avatar"),
  updateOwnBusinessProfile
);

export default router;