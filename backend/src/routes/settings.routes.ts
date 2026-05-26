import { Router } from "express";
import { auth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import {
  getSettings,
  getPublicSettings,
  updateSettings,
} from "../controllers/settings.controller";

const router = Router();

router.get("/public", getPublicSettings);
router.get("/", auth, requireAdmin, getSettings);
router.patch("/", auth, requireAdmin, updateSettings);

export const settingsRoutes = router;
