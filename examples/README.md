# Illustrative examples

Materials used in the SoftwareX article on LaTeX Code Generator. These examples
are included with the application source in
[release v1.0.0](https://github.com/ero67/latex-code-generator/releases/tag/v1.0.0)
and its source archives.

| Article figure | Materials |
| --- | --- |
| Figure 2: expression AST | [Source](ast-expression.tex), [PDF](ast-expression.pdf) |
| Figure 2: three-state automaton | [Source](fsa-interface-three-state.tex), [PDF](fsa-interface-three-state.pdf) |
| Figure 4: historical editor example | [Saved source](automaton-observed.tex), [PDF](automaton-observed.pdf) |
| Figure 5(a): four-variable Karnaugh map | [Source](kmap-four-variable.tex), [PDF](kmap-four-variable.pdf) |
| Figure 5(b): automaton before revision | [Source](fsa-input.tex), [PDF](fsa-input.pdf) |
| Figure 5(b): added `b` loop at initial state `q0` | [Source](fsa-modified.tex), [PDF](fsa-modified.pdf) |
| Figure 6: digitization and completion of an AST | [Input, original AI source, completed source and PDF](figure6/README.md) |

The map records `f(A,B,C,D) = not(B) not(D) or A C`, equivalent to the article's
variable names `p,q,r,w`. Its ones have indices `0,2,8,10,11,14,15`; the corner
and rectangular groups overlap at 10. The automaton sources differ only by the
added `b` loop at `q0`, changing the described language from `ab*` to `b*ab*`.
The Figure 4 source transcribes the historical thesis editor capture, with a
complete document wrapper. It is not a new model response.

## Reproduce an example

Import the relevant source in its visual editor, inspect the parsed structure,
make the described change, then generate LaTeX, compile and export. Import and
generation are explicit actions. For the map, set its cells and select the two
groups manually. The Figure 6 workflow is described in [figure6/](figure6/README.md).

Compile the complete `.tex` documents with pdfLaTeX or `latexmk`. Required
packages are `forest`, `karnaugh-map`, and TikZ with its automata libraries.
For example, from this directory:

```sh
mkdir -p /tmp/latex-code-generator-examples
latexmk -pdf -interaction=nonstopmode -halt-on-error -outdir=/tmp/latex-code-generator-examples kmap-four-variable.tex
latexmk -pdf -interaction=nonstopmode -halt-on-error -outdir=/tmp/latex-code-generator-examples fsa-input.tex
latexmk -pdf -interaction=nonstopmode -halt-on-error -outdir=/tmp/latex-code-generator-examples fsa-modified.tex
latexmk -pdf -interaction=nonstopmode -halt-on-error -outdir=/tmp/latex-code-generator-examples figure6/ast-completed.tex
```

In an application repository checkout with Node.js 20+, run
`node examples/validate-examples.mjs` from the repository root. The script reads
the parsers in `new-frontend/src` and checks the saved map values/groups and the
single automaton change. It needs no dependency installation, server, API key,
or network access. These are deterministic checks of the supplied examples,
not general parser correctness or a recognition benchmark.

Original diagram materials are retained unchanged. Saved source can be compiled
without an AI request. Fresh recognition depends on model availability and
inference behavior and need not reproduce the retained output. No new user-study
or recognition-benchmark dataset is reported.
