/**
 * Test examples for LaTeX import functionality
 * These examples can be used to test the import feature
 */

export const testExamples = [
  {
    name: "Simple Binary Proof",
    description: "A basic proof with two axioms and one conclusion",
    latex: `\\begin{prooftree}
\\AxiomC{$A$}
\\AxiomC{$B$}
\\BinaryInfC{$A \\land B$}
\\end{prooftree}`
  },
  {
    name: "Unary Proof",
    description: "A proof with one premise and one conclusion",
    latex: `\\begin{prooftree}
\\AxiomC{$A$}
\\UnaryInfC{$A \\lor B$}
\\end{prooftree}`
  },
  {
    name: "Complex Proof with Right Label",
    description: "A proof with right labels for inference rules",
    latex: `\\begin{prooftree}
\\AxiomC{$A$}
\\AxiomC{$A \\to B$}
\\BinaryInfC{$B$} \\RightLabel{\\scriptsize{MP}}
\\end{prooftree}`
  },
  {
    name: "Trinary Proof",
    description: "A proof with three premises",
    latex: `\\begin{prooftree}
\\AxiomC{$A$}
\\AxiomC{$B$}
\\AxiomC{$C$}
\\TrinaryInfC{$A \\land B \\land C$}
\\end{prooftree}`
  },
  {
    name: "Nested Proof Structure",
    description: "A more complex proof with multiple levels",
    latex: `\\begin{prooftree}
\\AxiomC{$A$}
\\AxiomC{$B$}
\\BinaryInfC{$A \\land B$}
\\AxiomC{$C$}
\\BinaryInfC{$(A \\land B) \\land C$}
\\end{prooftree}`
  }
];

export const invalidExamples = [
  {
    name: "Missing Prooftree Environment",
    description: "LaTeX code without proper environment",
    latex: `\\AxiomC{$A$}
\\AxiomC{$B$}
\\BinaryInfC{$A \\land B$}`
  },
  {
    name: "Unbalanced Braces",
    description: "LaTeX code with syntax errors",
    latex: `\\begin{prooftree}
\\AxiomC{$A$
\\AxiomC{$B$}
\\BinaryInfC{$A \\land B$}
\\end{prooftree}`
  },
  {
    name: "Invalid Commands",
    description: "LaTeX code with unsupported commands",
    latex: `\\begin{prooftree}
\\InvalidCommand{$A$}
\\AnotherInvalidCommand{$B$}
\\end{prooftree}`
  }
];

export default {
  testExamples,
  invalidExamples
};
