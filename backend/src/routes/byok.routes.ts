import { Router } from "express";
import { auth } from "../middleware/auth";
import {
  getByokStatus,
  setByokKey,
  deleteByokKey,
} from "../controllers/byok.controller";

const router = Router();

router.get("/", auth, getByokStatus);
router.put("/", auth, setByokKey);
router.delete("/", auth, deleteByokKey);

export const byokRoutes = router;
