const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Compile LaTeX code to PDF
 * @param {string} latexCode - LaTeX code to compile
 * @returns {Promise<{success: boolean, pdf?: string, errors?: string[], warnings?: string[]}>}
 */
export const compileLaTeX = async (latexCode) => {
  try {
    const response = await fetch(`${API_URL}/latex/compile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: latexCode }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        errors: result.errors || [result.message || "Compilation failed"],
        log: result.log,
      };
    }

    return {
      success: result.status === "success",
      pdf: result.pdf,
      warnings: result.warnings,
      errors: result.errors,
      log: result.log,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Network error: ${error.message}`],
    };
  }
};

