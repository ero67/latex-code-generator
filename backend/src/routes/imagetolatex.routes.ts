import express, { Router } from "express";
import { convertImageToLatex } from "../controllers/imagetolatex.controller";
import { runBenchmark } from "../controllers/benchmark.controller";
import upload from "../middleware/upload";
import { auth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router: Router = express.Router();

router.post("/generate", upload.single("image"), convertImageToLatex);
router.post(
  "/benchmark",
  auth,
  requireAdmin,
  upload.single("image"),
  runBenchmark
);

export const imageToLatexRoutes = router;
