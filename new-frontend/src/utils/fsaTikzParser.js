const SVG_W = 900;
const SVG_H = 600;
const CX = SVG_W / 2;
const CY = SVG_H / 2;
const SCALE = 90; // must match generator

function stripLatexComments(input) {
  const lines = String(input ?? "").split("\n");
  return lines
    .map((line) => {
      for (let i = 0; i < line.length; i++) {
        if (line[i] === "%" && (i === 0 || line[i - 1] !== "\\")) {
          return line.slice(0, i);
        }
      }
      return line;
    })
    .join("\n");
}

function cleanLabel(s) {
  const t = String(s ?? "").trim();
  // remove wrapping $...$ if present
  if (t.startsWith("$") && t.endsWith("$") && t.length >= 2) {
    return t.slice(1, -1).trim();
  }
  return t;
}

export function tikzToSvgCoord(tx, ty) {
  const x = Number(tx) * SCALE + CX;
  const y = CY - Number(ty) * SCALE;
  return { x, y };
}

export function validateFsaTikz(latex) {
  const code = stripLatexComments(latex);
  const errors = [];
  const warnings = [];

  if (!code.trim()) {
    errors.push("Empty input.");
    return { isValid: false, errors, warnings };
  }

  if (!/\\begin\s*\{\s*tikzpicture\s*\}/.test(code)) {
    warnings.push("No \\begin{tikzpicture} found (still attempting to parse).");
  }

  if (!/\\node\s*\[/.test(code)) {
    errors.push("No \\node[...] definitions found.");
  }

  if (!/\\draw\b/.test(code) && !/\bedge\b/.test(code)) {
    warnings.push("No \\draw ... edge ... statements found (no transitions).");
  }

  return { isValid: errors.length === 0, errors, warnings };
}

export function parseFsaTikz(latex) {
  const validation = validateFsaTikz(latex);
  if (!validation.isValid) {
    const msg = validation.errors.join(" ");
    const err = new Error(msg || "Invalid TikZ automata code");
    err.validation = validation;
    throw err;
  }

  const code = stripLatexComments(latex);

  const nodes = [];
  const edges = [];

  // \node[state, initial, accepting] (q0) at (1.2, -0.5) {q_0};
  // Note: label parsing is intentionally simple (no nested braces).
  const nodeRe =
    /\\node\s*\[([^\]]*)\]\s*\(\s*([^)]+?)\s*\)\s*(?:at\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\))?\s*\{\s*([^}]*)\s*\}\s*;/g;

  let nodeMatch;
  while ((nodeMatch = nodeRe.exec(code))) {
    const optsRaw = nodeMatch[1] || "";
    const id = String(nodeMatch[2] || "").trim();
    const tx = nodeMatch[3];
    const ty = nodeMatch[4];
    const labelRaw = nodeMatch[5] ?? id;

    const opts = optsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const isStart = opts.some((o) => o === "initial" || o.startsWith("initial "));
    const isAccepting = opts.includes("accepting");

    const label = cleanLabel(labelRaw) || id;

    let x;
    let y;
    if (tx != null && ty != null) {
      const p = tikzToSvgCoord(tx, ty);
      x = p.x;
      y = p.y;
    } else {
      // We'll place it later if coordinates are missing.
      x = null;
      y = null;
    }

    if (id) {
      nodes.push({ id, label, x, y, isStart, isAccepting });
    }
  }

  const nodeIds = new Set(nodes.map((n) => String(n.id)));

  // Parse \draw blocks first (common), but also scan globally for edge patterns.
  const drawBlockRe = /\\draw([\s\S]*?);/g;
  const edgeRe =
    /\(\s*([^)]+?)\s*\)\s*edge\s*(?:\[\s*([^\]]*?)\s*\])?\s*(?:node\s*\{\s*([^}]*)\s*\})?\s*\(\s*([^)]+?)\s*\)/g;

  const scanEdgesInText = (text) => {
    // IMPORTANT: edgeRe is global; reset between scans.
    edgeRe.lastIndex = 0;
    let m;
    while ((m = edgeRe.exec(text))) {
      const sourceId = String(m[1] || "").trim();
      const opts = String(m[2] || "");
      const labelRaw = m[3] ?? "";
      const targetId = String(m[4] || "").trim();

      if (!sourceId || !targetId) continue;

      const label = cleanLabel(labelRaw);

      // Generate a stable local id; caller can re-id later if needed.
      const id = `e_import_${edges.length}`;

      // If it’s a loop and target is missing/odd, normalize to same node.
      const isLoop = /\bloop\b/.test(opts);
      const normalizedTarget = isLoop ? sourceId : targetId;

      edges.push({
        id,
        sourceId,
        targetId: normalizedTarget,
        label,
      });
    }
  };

  const drawBlocks = [];
  let drawMatch;
  while ((drawMatch = drawBlockRe.exec(code))) {
    drawBlocks.push(drawMatch[0]);
  }

  if (drawBlocks.length > 0) {
    // Normal case: scan inside each \draw ... ; block (avoid double-counting).
    for (const block of drawBlocks) scanEdgesInText(block);
  } else {
    // Fallback scan (in case edges aren’t inside \draw blocks)
    scanEdgesInText(code);
  }

  // Filter edges to known nodes (drop edges to unknown IDs)
  const filteredEdgesRaw = edges.filter(
    (e) => nodeIds.has(String(e.sourceId)) && nodeIds.has(String(e.targetId))
  );

  // De-dup exact duplicates (can happen if input repeats edges across multiple draw blocks).
  const seen = new Set();
  const filteredEdges = [];
  for (const e of filteredEdgesRaw) {
    const key = `${e.sourceId}→${e.targetId}|${e.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    filteredEdges.push({ ...e, id: `e_import_${filteredEdges.length}` });
  }

  // If coords missing, place nodes in a grid-ish layout.
  const missing = nodes.filter((n) => n.x == null || n.y == null);
  if (missing.length > 0) {
    const present = nodes.filter((n) => n.x != null && n.y != null);
    const baseX = present.length ? present[0].x : CX - 150;
    const baseY = present.length ? present[0].y : CY - 80;
    const stepX = 180;
    const stepY = 140;
    missing.forEach((n, idx) => {
      n.x = baseX + (idx % 3) * stepX;
      n.y = baseY + Math.floor(idx / 3) * stepY;
    });
  }

  return { nodes, edges: filteredEdges, validation };
}


