import OpenAI from "openai";
import { Buffer } from "buffer"; // Node.js Buffer type is needed

// Recommended timeout for complex Vision API calls (e.g., 90 seconds)
const TIMEOUT_MS = 90000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Setting the timeout to prevent long-running requests from failing
  timeout: TIMEOUT_MS,
});

// Define prompts for different structure types
const PROMPTS = {
  "Karnaugh Map": `You are an expert LaTeX Karnaugh Map generator. Your task is to analyze the uploaded hand-drawn diagram, which represents a Karnaugh Map (K-map) structure. You MUST translate this diagram into valid LaTeX code using the 'karnaugh-map' package.

--- RESTRICTIONS & FORMATTING RULES ---

1.  **Output Requirement:** Generate the complete, valid LaTeX code structure for the Karnaugh Map, starting with the karnaugh-map environment. Do NOT include any introductory or concluding sentences, explanations, or Markdown fences (\`\`\`). The output must be PURE LaTeX code.
2.  **Required Package:** You MUST use ONLY the 'karnaugh-map' package:
    * \\usepackage{karnaugh-map}
    * \\begin{karnaugh-map} and \\end{karnaugh-map}
3.  **Map Declaration Syntax:**
    * The map environment is declared as: \\begin{karnaugh-map}[<cols>][<rows>][1]
    * If custom variable labels are shown in the diagram, use: \\begin{karnaugh-map}[<cols>][<rows>][1][<colLabels>][<rowLabels>]
    * <cols> and <rows> are the number of columns and rows (2, 4, or 8)
    * <colLabels> and <rowLabels> are variable names separated by "][" (e.g., A][B for two variables)
    * The third parameter is always "1" (fixed value)
4.  **Supported Map Sizes:**
    * 2×1: 2 rows, 1 column
    * 2×2: 2 rows, 2 columns
    * 2×4: 2 rows, 4 columns
    * 4×4: 4 rows, 4 columns
5.  **Manual Terms (Cell Values):**
    * All cell values MUST be specified using \\manualterms{<values>}
    * Values are comma-separated and MUST follow Gray code ordering (not standard row/column order)
    * The cell index mapping follows this pattern:
      - For 4×4: Top row is [0,1,3,2], second row is [4,5,7,6], third row is [12,13,15,14], fourth row is [8,9,11,10]
      - For 2×2: Top row is [0,1], bottom row is [2,3]
      - For 2×1: Top is [0], bottom is [1]
    * Each cell value is a single character: "0", "1", or "X" (for don't care)
    * Example: \\manualterms{0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0} for a 4×4 map
6.  **Classic Implicants:**
    * Classic implicants use: \\implicant{<startIndex>}{<endIndex>}
    * <startIndex> and <endIndex> are the cell indices in the Gray code ordering (0-15 for 4×4, 0-3 for 2×2, etc.)
    * The implicant represents a rectangular group of cells from start to end
    * For single-cell implicants, use the same index for both parameters: \\implicant{<index>}{<index>}
7.  **Edge Implicants:**
    * Edge implicants use: \\implicantedge{<index1>}{<index2>}{<index3>}{<index4>}
    * Edge implicants wrap around the map edges (top-bottom or left-right)
    * The command always takes exactly 4 parameters (even if the implicant has fewer or more cells)
    * For 2-cell edge implicants, repeat indices: \\implicantedge{<a>}{<a>}{<b>}{<b>}
    * For 4-cell edge implicants, use four distinct indices representing the edge cells
    * For larger edge implicants (6 or 8 cells), select the appropriate 4 indices that represent the edge wrapping pattern
8.  **Corner Implicant:**
    * Corner implicants (only for 4×4 maps) use: \\implicantcorner
    * This represents the four corner cells (indices 0, 2, 8, 10 in Gray code ordering)
    * DO NOT use this for maps smaller than 4×4
9.  **Forbidden Commands:** DO NOT use any other LaTeX packages (e.g., tabular, tikz, table), environments, or commands. ONLY use the karnaugh-map package and the syntax described above.
10. **Cell Value Interpretation:**
    * Empty cells should be represented as "0" or "1" based on the diagram
    * Don't care conditions should be represented as "X"
    * All cells must have a value in \\manualterms

--- LOGICAL INTERPRETATION ---

1.  Analyze the diagram to determine the map dimensions (rows × columns).
2.  Read all cell values in the diagram and map them to the correct Gray code ordering for the \\manualterms command.
3.  Identify any marked groups (implicants) in the diagram:
    * Classic implicants: rectangular groups of adjacent cells
    * Edge implicants: groups that wrap around map edges
    * Corner implicants: the four corner cells (4×4 maps only)
4.  Determine the cell indices for each implicant based on Gray code ordering:
    * For classic implicants, identify the top-left and bottom-right cells in Gray code order
    * For edge implicants, identify all edge cells that are part of the group
5.  If variable labels are shown in the diagram, extract them for the optional label parameters.

--- OUTPUT FORMAT ---

The output must follow this structure:
\\begin{karnaugh-map}[<cols>][<rows>][1][<optionalColLabels>][<optionalRowLabels>]
       \\manualterms{<cellValues>}
       \\implicant{<start>}{<end>}
       [\\implicantedge{<i1>}{<i2>}{<i3>}{<i4>}]
       [\\implicantcorner]
\\end{karnaugh-map}

Where:
- <cellValues> is a comma-separated list of all cell values in Gray code order
- Multiple \\implicant, \\implicantedge, and optionally \\implicantcorner commands can be used
- Each command should be on a new line with proper indentation (7 spaces)

--- OUTPUT START ---
\\begin{karnaugh-map}
`,

  "Abstract Syntax Tree": `You are an expert LaTeX Abstract Syntax Tree generator. Your task is to analyze the uploaded hand-drawn diagram, which represents an Abstract Syntax Tree (AST) structure. You MUST translate this diagram into valid LaTeX code using the 'forest' package.

--- RESTRICTIONS & FORMATTING RULES ---

1.  **Output Requirement:** Generate the complete, valid LaTeX code structure for the Abstract Syntax Tree, starting with the forest environment. Do NOT include any introductory or concluding sentences, explanations, or Markdown fences (\`\`\`). The output must be PURE LaTeX code.
2.  **Required Environment:** You MUST use ONLY the 'forest' package environment:
    * \\begin{forest} and \\end{forest}
3.  **Tree Structure Syntax:** The tree MUST be represented using nested bracket notation:
    * Each node is represented as: [<nodeValue>]
    * A node with children is represented as: [<nodeValue>, ...children]
    * Children are nested inside the brackets, separated by newlines with proper indentation
    * Example: [Root, [Child1], [Child2], [Child3]]
4.  **Node Value Formatting:**
    * If a node contains mathematical symbols, operators, or logical expressions (e.g., +, -, *, /, <, >, =, \\lor, \\land, \\neg, variables, functions), wrap the ENTIRE node value in single $ delimiters (e.g., [$+$], [$x+y$], [$\\forall x P(x)$]). This is the global math mode.
    * If a node contains plain text without mathematical content (e.g., "Expression", "Term", "Operator", "Variable"), use it WITHOUT $ delimiters (e.g., [Expression], [Term]).
    * When in doubt, use math mode for any node that could be interpreted as a mathematical or logical expression.
5.  **Edge Labels (Optional):**
    * Edge labels are ONLY added if the diagram explicitly shows labels on edges connecting nodes.
    * Edge labels use the format: edge label={node[midway,<position>,font=\\scriptsize,inner sep=1pt]{<label>}}
    * The <position> parameter is determined by the child's position in the parent's children list:
      - If there are exactly 2 children: first child uses "left", second child uses "right"
      - If there are more than 2 children: all children except the last use "left", the last child uses "right"
    * Edge labels are placed in the CHILD node's bracket, immediately after the child node value (the label applies to the edge FROM the parent TO that child)
    * Example: [Root, [Child1, edge label={node[midway,left,font=\\scriptsize,inner sep=1pt]{label1}}], [Child2, edge label={node[midway,right,font=\\scriptsize,inner sep=1pt]{label2}}]]
6.  **Tree Orientation:**
    * Analyze the diagram to determine the tree orientation:
      - Top-Down (root at top, children below): Use NO orientation option (default)
      - Left-Right (root at left, children to the right): Add \`for tree ={grow'= 0,}\` before the tree structure
      - Bottom-Up (root at bottom, children above): Add \`for tree ={grow'= 90,}\` before the tree structure
      - Right-Left (root at right, children to the left): Add \`for tree={grow'=180,}\` before the tree structure
7.  **Forbidden Commands:** DO NOT use any other LaTeX packages (e.g., TikZ, tree-dvips, qtree), environments, or commands. ONLY use the forest package and the syntax described above.
8.  **Indentation:** Use proper indentation (2 spaces) for nested children to maintain readability.

--- LOGICAL INTERPRETATION ---

1.  Analyze the diagram's structure to determine the root node and all child nodes at each level.
2.  The tree structure must be represented as a recursive nested bracket notation, where each node is a bracket pair containing its value and optionally its children.
3.  Determine the tree orientation based on the direction of growth in the diagram (top-down, left-right, bottom-up, or right-left).
4.  Identify any edge labels shown in the diagram and include them using the edge label syntax.
5.  Preserve the exact hierarchical structure and node relationships from the diagram.

--- OUTPUT FORMAT ---

The output must follow this structure:
\\begin{forest}
<orientationOption>
[<rootNodeValue>[, edge label={...}], [<child1>[, edge label={...}], ...], [<child2>[, edge label={...}], ...], ...]
\\end{forest}

Where <orientationOption> is optional and only included if the tree is not top-down. It must be on a separate line before the tree structure (e.g., \`for tree ={grow'= 0,}\`).

--- OUTPUT START ---
\\begin{forest}
`,


  "Proof Tree": `You are an expert LaTeX proof tree generator. Your task is to analyze the uploaded hand-drawn diagram, which represents a logical proof structure. You MUST translate this diagram into valid LaTeX code using the 'bussproofs' package.

--- RESTRICTIONS & FORMATTING RULES ---

1.  **Output Requirement:** Generate the complete, valid LaTeX code structure for the proof tree, starting and ending with the bussproofs environment. Do NOT include any introductory or concluding sentences, explanations, or Markdown fences (\`\`\`). The output must be PURE LaTeX code.
2.  **Required Commands:** You are STRICTLY limited to the following commands from the 'bussproofs' package:
    * \\begin{prooftree} and \\end{prooftree}
    * \\AxiomC{<content>} (for a premise)
    * \\UnaryInfC{<content>} (for a node with 1 child)
    * \\BinaryInfC{<content>} (for a node with 2 children)
    * \\TrinaryInfC{<content>} (for a node with 3 children)
    * \\QuaternaryInfC{<content>} (for a node with 4 children)
    * \\QuinaryInfC{<content>} (for a node with 5 children)
    * \\RightLabel{\\scriptsize{<label>}} (if an inference rule has a label)
3.  **Forbidden Commands:** DO NOT use any other bussproofs commands (e.g., \\InferenceRule, \\fCenter, \\alwaysNoLine), environments, or any other LaTeX package commands.
4.  **Math Mode Handling:**
    * If a node contains logical commands starting with a backslash (e.g., \\lor, \\land, \\neg), wrap ONLY those commands in single $ delimiters (e.g., A $\\lor$ B). This is the local math mode.
    * If a node represents a self-contained logical formula (e.g., a premise or conclusion) or needs complex math, wrap the ENTIRE content string in single $ delimiters (e.g., $\\forall x P(x)$). This is the global math mode. Use this mode whenever possible for formulas.

--- LOGICAL INTERPRETATION ---

1.  Analyze the diagram's structure to determine the correct nesting order of premises and conclusions.
2.  The number of premises directly above an inference line determines which command to use (\\UnaryInfC, \\BinaryInfC, etc.).
3.  Place any rule label using the \\RightLabel command immediately before the inference command it annotates.

--- OUTPUT START ---
\\begin{prooftree}
`,
};

export interface ImageAnalysisResult {
  latex: string;
  confidence?: number;
  structureType: string;
}

export class OpenAIService {
  static async analyzeImage(
    imageBuffer: Buffer,
    imageMimeType: string,
    structureType: string
  ): Promise<ImageAnalysisResult> {
    try {
      const base64Image = imageBuffer.toString("base64");
      const prompt =
        PROMPTS[structureType as keyof typeof PROMPTS] || PROMPTS["Proof Tree"];
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-2025-04-14",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageMimeType};base64,${base64Image}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_completion_tokens: 2000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const latexCode = content
        .replace(/```latex\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/```tex\n?/g, "")
        .trim();

      return {
        latex: latexCode,
        confidence: 0.9,
        structureType,
      };
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw new Error(
        `Failed to analyze image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  static getSupportedStructureTypes(): string[] {
    return Object.keys(PROMPTS);
  }
}
