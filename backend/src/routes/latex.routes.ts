import { Router } from "express";
import { compileLaTeXCode, compileLaTeXToSVG } from "../controllers/latex.controller";

const router = Router();

/**
 * POST /api/latex/compile
 * Compile LaTeX code to PDF
 * 
 * Request body:
 * {
 *   "code": "\\documentclass{article}\\begin{document}Hello!\\end{document}"
 * }
 * 
 * Success response:
 * {
 *   "status": "success",
 *   "pdf": "base64-encoded-pdf",
 *   "warnings": ["warning1", "warning2"],
 *   "message": "LaTeX compiled successfully"
 * }
 * 
 * Error response:
 * {
 *   "status": "error",
 *   "errors": ["error1", "error2"],
 *   "log": "compilation log",
 *   "message": "LaTeX compilation failed"
 * }
 */
router.post("/compile", compileLaTeXCode);
router.post("/compile-svg", compileLaTeXToSVG);

export const latexRoutes = router;

