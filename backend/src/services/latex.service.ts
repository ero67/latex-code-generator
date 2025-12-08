import axios from "axios";

const LATEX_COMPILER_URL =
  process.env.LATEX_COMPILER_URL || "http://latex-compiler:8080";
const COMPILATION_TIMEOUT_MS = Number(
  process.env.LATEX_COMPILATION_TIMEOUT_MS || 35000
);

export interface CompileResult {
  success: boolean;
  pdfBase64?: string;
  errors?: string[];
  warnings?: string[];
  log?: string;
}

/**
 * Call the LaTeX compiler service to compile LaTeX code to PDF
 */
export async function compileLaTeX(
  latexCode: string,
  timeoutMs = COMPILATION_TIMEOUT_MS
): Promise<CompileResult> {
  try {
    const response = await axios.post(
      `${LATEX_COMPILER_URL}/compile`,
      {
        code: latexCode,
      },
      {
        timeout: timeoutMs,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data;

    return {
      success: result.success || false,
      pdfBase64: result.pdf_base64,
      errors: result.errors,
      warnings: result.warnings,
      log: result.log,
    };
  } catch (error: any) {
    // Handle axios errors
    if (error.response) {
      // Service returned an error response
      const errorData = error.response.data;
      return {
        success: false,
        errors: errorData.errors || [errorData.message || "Compilation failed"],
        log: errorData.log,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        errors: [
          "LaTeX compiler service is not responding. Please try again later.",
        ],
        log: error.message,
      };
    } else {
      // Error setting up the request
      return {
        success: false,
        errors: [`Failed to compile LaTeX: ${error.message}`],
        log: error.message,
      };
    }
  }
}

