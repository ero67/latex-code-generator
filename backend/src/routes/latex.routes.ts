import { Router } from "express";
import { compileLaTeXCode, compileLaTeXToSVG } from "../controllers/latex.controller";

const router = Router();

router.post("/compile", compileLaTeXCode);
router.post("/compile-svg", compileLaTeXToSVG);

export const latexRoutes = router;

