export const kmapTestExamples = [
  {
    name: "4x4 with variables and one implicant",
    description: "Basic 4x4 map with custom variable headers and \\implicant",
    latex: `\\begin{karnaugh-map}[4][4][1][B][A]
       \\manualterms{0,1,0,1, 1,0,1,0, 0,1,0,1, 1,0,1,0}
       \\implicant{0}{5}
\\end{karnaugh-map}`
  },
  {
    name: "2x2 minimal",
    description: "2x2 grid with manualterms only",
    latex: `\\begin{karnaugh-map}[2][2][1]
       \\manualterms{0,1,1,0}
\\end{karnaugh-map}`
  },
  {
    name: "Edge implicant 4 cells",
    description: "Edge implicant across a row",
    latex: `\\begin{karnaugh-map}[4][4][1]
       \\manualterms{0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0}
       \\implicantedge{0}{1}{2}{3}
\\end{karnaugh-map}`
  },
  {
    name: "Corner implicant",
    description: "Corner implicant on 4x4",
    latex: `\\begin{karnaugh-map}[4][4][1]
       \\manualterms{0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0}
       \\implicantcorner
\\end{karnaugh-map}`
  }
];

export default { kmapTestExamples };


