import { Request, Response } from "express";
import { compileLaTeX } from "../services/latex.service";

/**
 * Compile LaTeX code to PDF
 * POST /api/latex/compile
 * Body: { code: string }
 */
export const compileLaTeXCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        status: "error",
        message: "LaTeX code is required",
      });
    }

    if (code.trim().length === 0) {
      return res.status(400).json({
        status: "error",
        message: "LaTeX code cannot be empty",
      });
    }

    console.log("Compiling LaTeX code...", {
      codeLength: code.length,
      preview: code.substring(0, 100) + "...",
    });

    const result = await compileLaTeX(code);

    if (result.success) {
      return res.status(200).json({
        status: "success",
        pdf: result.pdfBase64,
        warnings: result.warnings,
        message: "LaTeX compiled successfully",
      });
    } else {
      return res.status(400).json({
        status: "error",
        errors: result.errors,
        log: result.log,
        message: "LaTeX compilation failed",
      });
    }
  } catch (error: any) {
    console.error("Error in LaTeX compilation controller:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error during LaTeX compilation",
      error: error.message,
    });
  }
};

