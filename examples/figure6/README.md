# Figure 6: digitization and completion of an AST

| Material | File |
| --- | --- |
| Original incomplete handwritten AST | [ast-input-original.png](ast-input-original.png) |
| Original AI-generated Forest source | [ast-ai-original.tex](ast-ai-original.tex) |
| Source after visual completion | [ast-completed.tex](ast-completed.tex) |
| Compiled completed diagram | [ast-completed.pdf](ast-completed.pdf) |

These four materials were supplied by the author on 18 October 2026, unchanged.
The author reports recognition on 17 October 2026 using GPT-6.1 Sol through
OpenRouter (`openai/gpt-6.1-sol`). The input and original AI source have eight
nodes and seven edges. The lowest multiplication node has only child `2`.
After import, the user adds child `w`. The completed tree has nine nodes and
eight edges and represents `x+y*(z-2*w)`. This completes the unfinished input;
it is not presented as correcting a recognition error.

Both `.tex` files are complete documents using `forest` and compile with
pdfLaTeX. The supplied completed PDF records compilation on 18 October 2026,
separately from the reported recognition date. No new model call, recognition
experiment or visual inspection was used to prepare these materials.
