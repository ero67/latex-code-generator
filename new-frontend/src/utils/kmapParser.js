// Karnaugh Map LaTeX Parser and Validator

export const validateKmapLatex = (latex) => {
  const errors = [];
  const warnings = [];

  if (!/\\begin\{karnaugh-map\}/.test(latex) || !/\\end\{karnaugh-map\}/.test(latex)) {
    errors.push("Missing \\begin{\\karnaugh-map} or \\end{\\karnaugh-map} environment");
  }

  if (!/\\manualterms\{[^}]*\}/.test(latex)) {
    errors.push("Missing \\manualterms{...}");
  }

  // Brace balance check
  const open = (latex.match(/\{/g) || []).length;
  const close = (latex.match(/\}/g) || []).length;
  if (open !== close) errors.push("Unbalanced braces in LaTeX code");

  return { isValid: errors.length === 0, errors, warnings };
};

// Returns a structure compatible with KarnaughMap.jsx DB load path
export const parseKmapLatex = (latex) => {
  // Clean preamble and document wrappers
  const code = latex
    .replace(/\\documentclass\{[^}]*\}/g, "")
    .replace(/\\usepackage\{[^}]*\}/g, "")
    .replace(/\\begin\{document\}/g, "")
    .replace(/\\end\{document\}/g, "")
    .trim();

  // 1) Parse header: \begin{karnaugh-map}[C][R][1][colVars][rowVars]
  const headerRe = /\\begin\{karnaugh-map\}\[(\d+)\]\[(\d+)\](?:\[1\]\[([^\]]*)\]\[([^\]]*)\])?/;
  const header = code.match(headerRe);
  if (!header) throw new Error("Could not parse Karnaugh map dimensions from LaTeX.");

  const cols = parseInt(header[1], 10);
  const rows = parseInt(header[2], 10);
  const tableSize = `${rows}x${cols}`;

  let customVariablesAllowed = false;
  let customVariablesValues = [];
  if (header[3] !== undefined && header[4] !== undefined) {
    customVariablesAllowed = true;
    const colVars = header[3].split("][").reverse();
    const rowVars = header[4].split("][").reverse();
    customVariablesValues = [...rowVars, ...colVars];
  } else {
    const totalVars = Math.ceil(Math.log2(rows * cols));
    customVariablesValues = Array(totalVars).fill("");
  }

  // 2) manualterms
  const termsRe = /\\manualterms\{([^}]*)\}/;
  const termsMatch = code.match(termsRe);
  if (!termsMatch) throw new Error("Could not find \\manualterms in the LaTeX code.");
  // Split by comma and trim whitespace from each term
  const terms = termsMatch[1].split(",").map(term => term.trim());

  // Gray-code index maps mirrored from component
  const grayMap = {
    "4x4": [
      [0, 1, 3, 2],
      [4, 5, 7, 6],
      [12, 13, 15, 14],
      [8, 9, 11, 10],
    ],
    "2x4": [
      [0, 1, 3, 2],
      [4, 5, 7, 6],
    ],
    "2x2": [
      [0, 1],
      [2, 3],
    ],
    "2x1": [[0], [1]],
  };
  const indexMap = grayMap[tableSize];
  if (!indexMap) throw new Error(`Unsupported map size ${tableSize}`);

  const cellValues = Array(rows * cols).fill("");
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const flat = r * cols + c;
      const tIdx = indexMap[r][c];
      if (terms[tIdx] !== undefined && terms[tIdx] !== "") {
        // Trim the value to ensure no extra whitespace
        cellValues[flat] = terms[tIdx].trim();
      }
    }
  }

  // 3) implicants
  const implicants = [];
  const impRe = /\\implicant\{(\d+)\}\{(\d+)\}/g;
  let m;
  while ((m = impRe.exec(code)) !== null) {
    implicants.push([parseInt(m[1], 10), parseInt(m[2], 10)]);
  }

  // 4) edge implicants
  const edgeImplicants = [];
  const edgeRe = /\\implicantedge\{(\d+)\}\{(\d+)\}\{(\d+)\}\{(\d+)\}/g;
  while ((m = edgeRe.exec(code)) !== null) {
    const arr = [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10), parseInt(m[4], 10)];
    // If two-cells, package duplicates endpoints; normalize to [a,b]
    if (arr[0] === arr[1] && arr[2] === arr[3]) edgeImplicants.push([arr[0], arr[2]]);
    else edgeImplicants.push(arr);
  }

  // 5) corner implicant
  const cornerImplicant = /\\implicantcorner/.test(code);

  return {
    tableSize,
    customVariablesAllowed,
    customVariablesValues,
    cellValues,
    implicants,
    edgeImplicants,
    cornerImplicant,
  };
};

export default { validateKmapLatex, parseKmapLatex };


