# Three-model AST transcription benchmark

This example shows how Model Benchmark compares the LaTeX produced by different
multimodal models for the same handwritten diagram. The user uploads an image,
selects **Abstract Syntax Tree**, and chooses **Gemini 3.8 Flash**, **Claude
Sonnet 5.5**, and **GPT-6.1 Sol** from the model list. The application sends the
image and AST prompt to each model through OpenRouter and displays the returned
LaTeX alongside response time, token usage, and estimated cost.

## Input diagram

The handwritten syntax tree below is deliberately unfinished: it has eight
nodes and seven edges, and its lowest multiplication node has only the operand
`2`. This is the same input used in the article's Figure 6, before the missing
operand `w` is added in the visual editor.

<a href="ast-input-original.png"><img src="ast-input-original.png" alt="Original handwritten abstract syntax tree used as input for all three models" width="360"></a>

## Results in the application

The screenshot below records the Model Benchmark interface for this run.
The original JSON export retains each model's complete LaTeX response and
request measurements; the table in the next section summarizes those values.

![Model Benchmark application screenshot for the three-model AST run](prtscr.png)

## Files

- [ast-input-original.png](ast-input-original.png): original uploaded image;
  byte-identical to [the Figure 6 input](../figure6/ast-input-original.png).
- [benchmark_Abstract_Syntax_Tree_1794585731056.json](benchmark_Abstract_Syntax_Tree_1794585731056.json):
  original application export, retained without modification. It contains all
  three generated LaTeX responses and request measurements.
- [prtscr.png](prtscr.png): original screenshot of the application supplied with
  the export, retained without modification.
- [checksums.json](checksums.json): SHA-256 checksums of these three source files.

These materials are included in the updated [release `v1.0.0`](https://github.com/ero67/latex-code-generator/releases/tag/v1.0.0)
and its source archives. The release tag was updated in November 2026 to include
this benchmark; it previously pointed to commit
`08b16a2a7bd40227cde6169113b09810151590c5`. The application code is unchanged.

## Exported results

The following values are copied from the JSON export, in its original order.
Costs are the application's recorded estimates in USD.

| Model identifier | Status | Response time (s) | Prompt tokens | Completion tokens | Total tokens | Estimated cost (USD) |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `google/gemini-3.8-flash` | success | 6.96 | 2194 | 679 | 2873 | 0.00461175 |
| `anthropic/claude-sonnet-5.5` | success | 2.09 | 6451 | 81 | 6532 | 0.01371200 |
| `openai/gpt-6.1-sol` | success | 8.64 | 8551 | 116 | 8667 | 0.01826200 |

`latency` is the request duration in seconds recorded by the application, not an
isolated measurement of model inference. `usage` contains the provider-reported
prompt, completion, and total token counts. `output` is the returned LaTeX;
`status: success` records a completed model request, not a correctness score.
This example contains one image and one retained response per model, with no
repeated trials or independently scored accuracy assessment.

## Repeat the workflow

1. Open Model Benchmark in a running LaTeX Code Generator instance with the
   required access and OpenRouter credentials configured.
2. Upload `ast-input-original.png` and select **Abstract Syntax Tree**.
3. Select `google/gemini-3.8-flash`, `anthropic/claude-sonnet-5.5`, and
   `openai/gpt-6.1-sol`, if they remain available and enabled.
4. Run the comparison and export the JSON results.

The application performs image preprocessing and uses the AST-specific prompt.
The export does not capture the processed image, full request settings, or an
exact deployed source revision. Model availability, outputs, timing, token
counts, and prices can change between runs. No additional model requests were
made when archiving these materials.
