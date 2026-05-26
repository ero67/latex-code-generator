import { Router } from "express";
import {
  getAvailableModels,
  getAllModels,
  createModel,
  updateModel,
} from "../controllers/models.controller";
import { auth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = Router();

// Authenticated: list enabled OpenRouter models
router.get("/", auth, getAvailableModels);

// Admin: manage models
router.get("/all", auth, requireAdmin, getAllModels);
router.post("/", auth, requireAdmin, createModel);
router.patch("/:id", auth, requireAdmin, updateModel);

export const modelsRoutes = router;
