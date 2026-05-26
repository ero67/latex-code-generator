import ollama
import time
import os
import json
import sys
import threading

# --- PROMPTS DICTIONARY ---
PROMPTS = {
    "Karnaugh Map": """You are an expert LaTeX Karnaugh Map generator. Your task is to analyze the uploaded hand-drawn diagram, which represents a Karnaugh Map (K-map) structure. You MUST translate this diagram into valid LaTeX code using the 'karnaugh-map' package.

--- RESTRICTIONS & FORMATTING RULES ---

1.  **Output Requirement:** Generate the complete, valid LaTeX code structure for the Karnaugh Map, starting with the karnaugh-map environment. Do NOT include any introductory or concluding sentences, explanations, or Markdown fences (```). The output must be PURE LaTeX code.
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
""",

    "Finite State Automata": """You are an expert LaTeX TikZ Finite State Automata (FSA) generator.
Your task is to analyze the uploaded hand-drawn diagram of a finite state automaton and output TikZ code that is COMPATIBLE with our app's importer.

--- CRITICAL OUTPUT RULES (MUST FOLLOW) ---

1. **Output Requirement:** Output ONLY the TikZ picture (no \\documentclass, no \\begin{document}, no Markdown fences, no explanations).
2. **Environment:** Output MUST be a single:
   - \\begin{tikzpicture}[...]
   - ... tikz nodes and \\draw edges ...
   - \\end{tikzpicture}
3. **Node Syntax (STRICT):**
   Each state MUST be declared using exactly this pattern (one per line):
   \\node[state, <optional initial>, <optional accepting>] (<ID>) at (<X>, <Y>) {<LABEL>};

   - <ID> must be a simple identifier with no spaces, like q0, q1, q2, ...
   - <X>, <Y> must be numeric coordinates (decimals allowed). Keep them roughly within [-5, 5].
   - <LABEL> must be plain text or simple LaTeX (NO nested braces).
4. **Initial and Accepting states:**
   - The start state MUST include the option 'initial'.
   - Accepting states MUST include the option 'accepting'.
   - There should be at most ONE initial state.
5. **Edge/Transition Syntax (STRICT):**
   All transitions MUST be written using \\draw with TikZ 'edge' statements like:
   \\draw
     (q0) edge[above] node{a} (q1)
     (q1) edge[loop above] node{b} (q1);

   Requirements:
   - Use '(source) edge[...] node{<label>} (target)' form.
   - Edge label should be inside node{...}. If unlabeled, use node{}.
   - Self-loops MUST include 'loop' in edge options (e.g., loop above).
6. **Styling / Options:**
   The tikzpicture MUST start with this option list (exact keys; spacing can differ):
   \\begin{tikzpicture}[->,>=stealth',node distance=3cm,every state/.style={thick, fill=gray!10},initial text=$ $,]

7. **No extra TikZ commands:** Do NOT use \\path instead of \\draw. Do NOT use custom macros. Do NOT use positioning like 'right of=' (always use explicit 'at (x,y)').

--- WHAT TO READ FROM THE IMAGE ---

- States: identify all state circles and their labels (e.g., q0, q1, ...).
- Start arrow: identify which state is the start state (mark it as 'initial').
- Accepting/double circles: mark as 'accepting'.
- Transitions: identify arrows between states, including direction and labels.
- Self-loops: include as loop edges.
- If there are multiple labels on one arrow, join them with commas (e.g., node{a,b}).

--- OUTPUT START ---
\\begin{tikzpicture}[->,>=stealth',node distance=3cm,every state/.style={thick, fill=gray!10},initial text=$ $,]
""",

    "Resolution Tree": """You are an expert LaTeX TikZ Resolution Tree generator.
Your task is to analyze the uploaded hand-drawn diagram of a propositional resolution proof and output LaTeX that is COMPATIBLE with our app's importer.

We represent clauses as sets (e.g., {a,m}, {\\neg m}) and the final refutation as \\Box.
The standard drawing has premises at the TOP and the final \\Box at the BOTTOM.

--- CRITICAL OUTPUT RULES (MUST FOLLOW) ---

1. **Output Requirement:** Output ONLY the TikZ picture (no \\documentclass, no \\begin{document}, no Markdown fences, no explanations).
2. **Required Package/Grammar:** You MUST use ONLY tikz-qtree bracket notation:
   - \\begin{tikzpicture}[grow'=up]
   - \\Tree <BRACKET TREE>
   - \\end{tikzpicture}
3. **Tree Syntax (STRICT):**
   Use tikz-qtree bracket format ONLY:
   - Each node is: [.<LABEL> <child1> <child2> ... ]
   - Do NOT use \\node(...) commands.
   - Do NOT use any \\draw lines.
   - Do NOT use the forest package.
4. **Node labels (STRICT):**
   Every clause label MUST be in math mode and MUST use one of:
   - $\\Box$  (final refutation)
   - $\\{...\\}$  (clause as a set)

   Examples:
   - $\\{m\\}$
   - $\\{a,m\\}$
   - $\\{\\neg m\\}$
   - $\\{7,\\neg a\\}$

   Restrictions:
   - Do NOT add extra words like "clause" or "resolvent".
   - Do NOT nest braces. Keep it simple: $\\{<comma-separated items>\\}$.
5. **Structure semantics:**
   The root of the \\Tree MUST be the FINAL clause (typically $\\Box$).
   Its children are the parent clauses that resolve to it, recursively.
   Leaves are the top-level premises.

--- OUTPUT START ---
\\begin{tikzpicture}[grow'=up]
\\Tree
""",

    "Abstract Syntax Tree": """You are an expert LaTeX Abstract Syntax Tree generator. Your task is to analyze the uploaded hand-drawn diagram, which represents an Abstract Syntax Tree (AST) structure. You MUST translate this diagram into valid LaTeX code using the 'forest' package.

--- RESTRICTIONS & FORMATTING RULES ---

1.  **Output Requirement:** Generate the complete, valid LaTeX code structure for the Abstract Syntax Tree, starting with the forest environment. Do NOT include any introductory or concluding sentences, explanations, or Markdown fences (```). The output must be PURE LaTeX code.
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
      - Left-Right (root at left, children to the right): Add `for tree ={grow'= 0,}` before the tree structure
      - Bottom-Up (root at bottom, children above): Add `for tree ={grow'= 90,}` before the tree structure
      - Right-Left (root at right, children to the left): Add `for tree={grow'=180,}` before the tree structure
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

Where <orientationOption> is optional and only included if the tree is not top-down. It must be on a separate line before the tree structure (e.g., `for tree ={grow'= 0,}`).

--- OUTPUT START ---
\\begin{forest}
""",

    "Proof Tree": """You are an expert LaTeX proof tree generator. Your task is to analyze the uploaded hand-drawn diagram, which represents a logical proof structure. You MUST translate this diagram into valid LaTeX code using the 'bussproofs' package.

--- RESTRICTIONS & FORMATTING RULES ---

1.  **Output Requirement:** Generate the complete, valid LaTeX code structure for the proof tree, starting and ending with the bussproofs environment. Do NOT include any introductory or concluding sentences, explanations, or Markdown fences (```). The output must be PURE LaTeX code.
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

""",
}

# --- CONFIGURATION ---
# MODELS_TO_TEST = ["llama3.2-vision:11b", "gemma3:4b"]
MODELS_TO_TEST = ["qwen3-vl:8b"]
IMAGE_DIR = "./handdrawn_examples"  # Put your PNG/JPG files here
RESULTS_FILE = "local_llm_benchmark.json"
TIMEOUT_SECONDS = 500  # 5 minute timeout per image


def log(msg):
    """Print with timestamp"""
    timestamp = time.strftime("%H:%M:%S")
    print(f"[{timestamp}] {msg}")
    sys.stdout.flush()  # Force immediate output


def progress_indicator(stop_event, filename):
    """Show dots while waiting for response"""
    elapsed = 0
    while not stop_event.is_set():
        time.sleep(10)
        elapsed += 10
        print(f"  ... still processing {filename} ({elapsed}s elapsed)", flush=True)


def run_ollama_with_timeout(model, prompt, image_path, timeout):
    """Run ollama.chat with a timeout"""
    result = {"response": None, "error": None}
    
    def target():
        try:
            result["response"] = ollama.chat(
                model=model,
                messages=[{
                    'role': 'user',
                    'content': prompt,
                    'images': [image_path]
                }]
            )
        except Exception as e:
            result["error"] = str(e)
    
    thread = threading.Thread(target=target)
    thread.start()
    thread.join(timeout=timeout)
    
    if thread.is_alive():
        result["error"] = f"Timeout after {timeout} seconds"
        # Note: thread will continue in background, but we move on
    
    return result


def run_benchmark():
    all_results = []
    
    if not os.path.exists(IMAGE_DIR):
        log(f"Error: Directory {IMAGE_DIR} not found.")
        return

    images = [f for f in os.listdir(IMAGE_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    log(f"Found {len(images)} images in {IMAGE_DIR}")
    
    for model in MODELS_TO_TEST:
        log(f"\n{'='*50}")
        log(f"STARTING TEST FOR MODEL: {model}")
        log(f"{'='*50}")
        
        for i, filename in enumerate(images):
            # Match image to its specific prompt type
            structure_type = next((k for k in PROMPTS if filename.startswith(k)), None)
            
            if not structure_type:
                log(f"  Skipping {filename} - no matching prompt type")
                continue

            log(f"[{i+1}/{len(images)}] Processing: {filename}")
            log(f"  Structure type: {structure_type}")
            log(f"  Sending to Ollama (timeout: {TIMEOUT_SECONDS}s)...")
            
            image_path = os.path.join(IMAGE_DIR, filename)
            
            # Start progress indicator
            stop_event = threading.Event()
            progress_thread = threading.Thread(target=progress_indicator, args=(stop_event, filename))
            progress_thread.start()
            
            start_time = time.time()
            result = run_ollama_with_timeout(model, PROMPTS[structure_type], image_path, TIMEOUT_SECONDS)
            latency = time.time() - start_time
            
            # Stop progress indicator
            stop_event.set()
            progress_thread.join()
            
            if result["error"]:
                log(f"  ✗ FAILED after {latency:.1f}s: {result['error']}")
                all_results.append({
                    "model": model,
                    "structure": structure_type,
                    "file": filename,
                    "latency": round(latency, 2),
                    "error": result["error"],
                    "status": "failed"
                })
            else:
                output_preview = result["response"]['message']['content'][:100].replace('\n', ' ')
                log(f"  ✓ SUCCESS in {latency:.1f}s")
                log(f"  Preview: {output_preview}...")
                all_results.append({
                    "model": model,
                    "structure": structure_type,
                    "file": filename,
                    "latency": round(latency, 2),
                    "output": result["response"]['message']['content'],
                    "status": "success"
                })
            
            # Save after each result (in case of crash)
            with open(RESULTS_FILE, "w") as f:
                json.dump(all_results, f, indent=4)
            log(f"  Results saved to {RESULTS_FILE}")

    log(f"\n{'='*50}")
    log(f"BENCHMARK COMPLETE - {len(all_results)} total results")
    log(f"{'='*50}")

if __name__ == "__main__":
    run_benchmark()