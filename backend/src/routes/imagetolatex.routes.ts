import express, { Router } from "express";
import { convertImageToLatex } from "../controllers/imagetolatex.controller";
import upload from "../middleware/upload";

const router: Router = express.Router();

router.post("/generate", upload.single("image"), convertImageToLatex);

export const imageToLatexRoutes = router;
