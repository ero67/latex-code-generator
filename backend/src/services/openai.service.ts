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
  /*
  // PROMPT REMOVED FOR LATER ADJUSTMENT:
  "Karnaugh Map": `You are an expert in digital logic and LaTeX. Analyze this image of a Karnaugh map and generate the corresponding LaTeX code.

Requirements:
1. Create a LaTeX table using the tabular environment
2. Include proper row and column labels (binary values like 00, 01, 10, 11)
3. Show the cell values (0, 1, or X for don't care)
4. Use proper LaTeX formatting with \\hline for borders
5. Include a caption describing it as a Karnaugh map
6. Only return the LaTeX code, no explanations

Example format:
\\begin{table}[h]
\\centering
\\begin{tabular}{|c|c|c|c|}
\\hline
 & 00 & 01 & 11 \\\\
\\hline
0 & 0 & 1 & 0 \\\\
\\hline
1 & 1 & 0 & 1 \\\\
\\hline
\\end{tabular}
\\caption{Karnaugh Map}
\\end{table}`,

  // PROMPT REMOVED FOR LATER ADJUSTMENT:
  "Abstract Syntax Tree": `You are an expert in computer science and LaTeX. Analyze this image of an Abstract Syntax Tree (AST) and generate the corresponding LaTeX code.

Requirements:
1. Use TikZ to draw the tree structure
2. Include proper node labels and connections
3. Use appropriate tree layout (top-down, left-right, etc.)
4. Include proper LaTeX packages (tikz, positioning)
5. Make the tree clear and readable
6. Only return the LaTeX code, no explanations

Example format:
\\begin{tikzpicture}[level distance=1.5cm,
  level 1/.style={sibling distance=3cm},
  level 2/.style={sibling distance=1.5cm}]
\\node {Expression}
  child {node {Term}}
  child {node {Operator}}
  child {node {Term}};
\\end{tikzpicture}`,
*/

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
        model: "gpt-4.1",
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
