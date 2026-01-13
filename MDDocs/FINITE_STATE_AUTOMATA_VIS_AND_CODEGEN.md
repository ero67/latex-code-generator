# Finite State Automata (FSA): Visualization + LaTeX Code Generation

This doc explains how the **Finite State Automata** page works in the frontend:

- **Visualization / editor** (D3 + SVG)
- **LaTeX (TikZ) code generation**
- **Compilation / preview** (same pipeline as other pages)

Relevant file:

- `new-frontend/src/Pages/FiniteStateAutomata/FiniteStateAutomata.jsx`

---

## Visualization / editor architecture (D3 + React state)

### Data model (React state)

The editor is driven by two React arrays:

- **`nodes`**: each state
  - `id`: string like `q0`
  - `label`: what’s displayed in the circle (can be edited in Inspector)
  - `x`, `y`: position in **SVG user space** (same coordinate system as the canvas)
  - `isStart`: whether the start arrow is shown
  - `isAccepting`: whether the double circle is shown
- **`edges`**: each transition
  - `id`: string like `e0`
  - `sourceId`, `targetId`: node ids
  - `label`: transition label

The rendered SVG is always a function of these two arrays.

### SVG structure

On mount, the component creates a stable SVG structure:

- `<svg ref={svgRef}>`
  - `<defs>`: marker definition for arrow heads (`marker id="fsa-arrow"`)
  - `<g id="viewport">` **(zoom/pan target)**
    - `<g id="edges">`
    - `<g id="nodes">`

All drawing happens inside the `viewport` group so zoom/pan affects everything consistently.

### Zoom / pan (D3 zoom)

The page attaches `d3.zoom()` to the root `<svg>`.

- Zoom handler updates the transform on `#viewport`:
  - `viewport.attr("transform", event.transform)`
- Scale extent is limited (currently 0.25 → 3).

### Rendering loop (D3 “data join”)

Whenever `nodes`, `edges`, or selection state changes, the component:

- Selects the `#edges` and `#nodes` layers
- Performs a D3 **data join**:
  - `edgesLayer.selectAll("g.edge").data(edges, d => d.id)`
  - `nodesLayer.selectAll("g.node").data(nodes, d => d.id)`
- Handles:
  - **enter**: create missing SVG elements
  - **update**: update attributes/paths/labels
  - **exit**: remove deleted elements

### Edge drawing

Edges are rendered as:

- `g.edge`
  - `path.edge-path` (with arrow marker)
  - `text.edge-label`

#### Self-loops

If `sourceId === targetId`, the code draws a cubic Bezier loop above the node and places the label above it.

#### Parallel / reverse edges (curvature)

The code groups edges by the unordered pair `{A,B}` to detect parallel/reverse links.

- If multiple edges exist between a pair, each edge gets a different curvature.
- The edge is drawn as a quadratic curve (`M ... Q ... ...`) and the label is placed near the midpoint of that curve.

### Node drawing

Nodes are rendered as:

- `g.node` (translated to `(x,y)`)
  - `circle.state-outer` (main state circle)
  - `circle.state-inner` (accepting double circle; radius 0 if not accepting)
  - `path.start-arrow` (only if `isStart`)
  - `text.state-label`

### Interaction model

#### Modes

The toolbar controls `mode`:

- `select`
- `add_state`
- `add_transition`

#### Add state

When `mode === "add_state"`, clicking the **canvas background** adds a new node at the click position.

Important detail: the click location is converted correctly even when the SVG is scaled via CSS by using a client→SVG conversion (`clientToSvgPoint`), and then applying the current zoom transform inverse.

#### Add transition (2-click)

When `mode === "add_transition"`:

1. Click a source node → stored in `pendingSourceId`
2. Click a target node → prompt for label → edge is created

Important detail: event handlers are attached on the **merged selection** (`enter.merge(update)`) so React state like `pendingSourceId` is never stale.

#### Selection + Inspector

Clicking a node/edge sets:

- `selected = { type: "node"|"edge", id }`

The Inspector reads `selected` and shows editing controls.

#### Delete

`Delete` / `Backspace` deletes the selected node/edge:

- deleting a node also deletes all incident edges.

---

## LaTeX (TikZ automata) code generation

The generator builds TikZ code in `buildTikz(nodes, edges, opts)` in:

- `new-frontend/src/Pages/FiniteStateAutomata/FiniteStateAutomata.jsx`

It follows the same patterns described in the TikZ automata tutorial you referenced (TikZ + `automata`, `positioning`, `arrows`) and uses:

- `state`, `initial`, `accepting` node styles
- `\draw (...) edge[...] node{...} (...)` transitions
- `loop above` for self-loops
- `bend left/right=<angle>` for multiple edges between the same pair

### Positioning: SVG → TikZ coordinates

The visual editor uses an SVG viewBox of `900x600` with origin in the top-left.

To preserve the user’s layout in the exported TikZ, positions are mapped like:

- Center SVG at `(450, 300)`
- Scale: ~`90px = 1 TikZ unit`
- Invert Y (because TikZ grows upward, SVG grows downward)

Result:

- `\node (...) at (x, y) {...};`

### Start and accepting states

- `isAccepting` → adds `accepting` option (double circle)
- `isStart` → adds `initial` option
  - Output enforces a single start state (first `isStart` wins; otherwise first node).

### Labels and escaping

Labels are inserted as-is except for minimal escaping of `{}`, `%`, `&`, `#`.

Backslashes are *not* escaped so users can type LaTeX macros like `\epsilon`.

---

## Compilation / preview (“Edit & Compile”)

The FSA page uses the same compile pipeline as other tools:

- UI component: `new-frontend/src/Components/LaTeXEditor/LaTeXEditor.jsx`
- API client: `new-frontend/src/services/latex.service.js`

Flow:

1. Click **Generate LaTeX** → stores the generated string in component state.
2. Click **Edit & Compile** → shows `LaTeXEditor` with that initial code.
3. Click **Compile** in the editor:
   - sends `POST /api/latex/compile` with JSON `{ code: "<latex>" }`
   - expects JSON with `{ status: "success", pdf: "<base64>" }` (and possible warnings/errors)
4. The PDF preview is rendered from `pdfBase64`.

---

## Notes / known limitations

- TikZ export currently targets **TikZ automata**. It doesn’t attempt “pretty routing” identical to the SVG curves; it uses **bend** for multi-edges and **loop above** for self loops.
- If you want more accurate edge routing, we can store per-edge “style” (e.g., bend left/right, loop direction) in the model and output it directly.


