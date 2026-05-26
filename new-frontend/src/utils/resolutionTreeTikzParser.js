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

function isWs(ch) {
  return ch === " " || ch === "\n" || ch === "\t" || ch === "\r";
}

function skipWs(s, i) {
  while (i < s.length && isWs(s[i])) i++;
  return i;
}

function parseBalancedBraces(s, i) {
  // expects s[i] === '{'
  let depth = 0;
  let j = i;
  while (j < s.length) {
    const ch = s[j];
    if (ch === "{" && (j === 0 || s[j - 1] !== "\\")) depth++;
    else if (ch === "}" && (j === 0 || s[j - 1] !== "\\")) depth--;
    j++;
    if (depth === 0) break;
  }
  if (depth !== 0) throw new Error("Unbalanced braces in node label.");
  return { text: s.slice(i, j), next: j };
}

function parseMathDollar(s, i) {
  // expects s[i] === '$'
  let j = i + 1;
  while (j < s.length) {
    if (s[j] === "$" && s[j - 1] !== "\\") {
      j++;
      return { text: s.slice(i, j), next: j };
    }
    j++;
  }
  throw new Error("Unbalanced $...$ in node label.");
}

function parseLabelToken(s, i) {
  i = skipWs(s, i);
  if (i >= s.length) return { text: "", next: i };
  const ch = s[i];
  if (ch === "{") return parseBalancedBraces(s, i);
  if (ch === "$") return parseMathDollar(s, i);

  // fallback: read until whitespace or bracket
  let j = i;
  while (j < s.length && !isWs(s[j]) && s[j] !== "[" && s[j] !== "]") j++;
  return { text: s.slice(i, j), next: j };
}

function parseEdgeCommand(s, i) {
  // Parses: \edge node[...]{...}; — extracts label text from the last {...}
  // Returns { label, next } where next points after the ';'
  let j = i + 5; // skip "\edge"
  let label = "";

  // Scan forward to the terminating ';'
  while (j < s.length && s[j] !== ";") {
    if (s[j] === "{" && (j === 0 || s[j - 1] !== "\\")) {
      // Extract content of this brace group — it's the label content
      const braced = parseBalancedBraces(s, j);
      label = braced.text; // last brace group wins (the label, not the options)
      j = braced.next;
    } else {
      j++;
    }
  }
  if (j < s.length && s[j] === ";") j++; // skip ';'

  // Clean up the extracted label: strip outer {}, $, and [] wrappers
  let cleaned = label;
  if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  // Strip $...$
  if (cleaned.startsWith("$") && cleaned.endsWith("$")) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  // Strip [...] wrapper
  if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  // Strip \scriptsize, \footnotesize, etc.
  cleaned = cleaned.replace(/^\\(?:scriptsize|footnotesize|tiny|small)\s*/, "").trim();
  // Re-check for [...] after stripping font command
  if (cleaned.startsWith("$") && cleaned.endsWith("$")) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return { label: cleaned, next: j };
}

function parseQtreeNode(s, i) {
  i = skipWs(s, i);
  if (s[i] !== "[") throw new Error("Expected '[' while parsing \\Tree.");
  i++; // skip '['
  i = skipWs(s, i);

  let labelRaw = "";
  if (s[i] === ".") {
    i++; // skip '.'
    const parsed = parseLabelToken(s, i);
    labelRaw = parsed.text;
    i = parsed.next;
  }

  const children = [];
  while (true) {
    i = skipWs(s, i);
    if (i >= s.length) throw new Error("Unexpected end while parsing \\Tree.");
    if (s[i] === "]") {
      i++; // skip ']'
      break;
    }

    // Check for \edge command before a child node
    let pendingEdgeLabel = "";
    if (s.startsWith("\\edge", i)) {
      const edgeParsed = parseEdgeCommand(s, i);
      pendingEdgeLabel = edgeParsed.label;
      i = edgeParsed.next;
      i = skipWs(s, i);
    }

    // child node
    const childParsed = parseQtreeNode(s, i);
    if (pendingEdgeLabel) {
      childParsed.node.edgeLabel = pendingEdgeLabel;
    }
    children.push(childParsed.node);
    i = childParsed.next;
  }

  return { node: { labelRaw, children }, next: i };
}

function normalizeLabel(labelRaw) {
  let t = String(labelRaw ?? "").trim();
  if (!t) return "";

  // unwrap outer braces
  if (t.startsWith("{") && t.endsWith("}")) {
    t = t.slice(1, -1).trim();
  }

  // unwrap $...$
  if (t.startsWith("$") && t.endsWith("$") && t.length >= 2) {
    t = t.slice(1, -1).trim();
  }

  // Normalize \Box
  if (t === "\\Box") return "\\Box";

  // Normalize \{...\} to {...}
  if (t.startsWith("\\{") && t.endsWith("\\}")) {
    const inner = t.slice(2, -2).trim();
    return `{${inner}}`;
  }

  // If it already looks like a set, keep as-is
  if (t.startsWith("{") && t.endsWith("}")) return t;

  return t;
}

export function validateResolutionTreeTikz(latex) {
  const code = stripLatexComments(latex);
  const errors = [];
  const warnings = [];

  if (!code.trim()) {
    errors.push("Empty input.");
    return { isValid: false, errors, warnings };
  }

  if (!/\\Tree\b/.test(code)) {
    errors.push("No \\Tree found.");
  }

  if (/\\node\s*\(/.test(code)) {
    warnings.push("Found \\node(...) which may not be importable. Prefer pure tikz-qtree bracket labels.");
  }

  return { isValid: errors.length === 0, errors, warnings };
}

export function parseResolutionTreeTikz(latex) {
  const validation = validateResolutionTreeTikz(latex);
  if (!validation.isValid) {
    const err = new Error(validation.errors.join(" ") || "Invalid resolution tree LaTeX");
    err.validation = validation;
    throw err;
  }

  const code = stripLatexComments(latex);
  const treeIdx = code.indexOf("\\Tree");
  if (treeIdx < 0) throw new Error("No \\Tree found.");

  // Find the first '[' after \Tree
  let i = treeIdx + 5;
  while (i < code.length && code[i] !== "[") i++;
  if (i >= code.length) throw new Error("Could not find '[' after \\Tree.");

  const parsed = parseQtreeNode(code, i);
  const root = parsed.node;

  // Assign numeric IDs, preserve edgeLabel from \edge commands
  let nextId = 0;
  const nodes = [];
  const assign = (n) => {
    const id = nextId++;
    const value = normalizeLabel(n.labelRaw);
    const children = (n.children || []).map(assign);
    const out = { id, value, children, edgeLabel: n.edgeLabel || "" };
    nodes.push(out);
    return out;
  };
  const labeledTree = assign(root);

  // Convert LaTeX tree (result -> parents) into UI tree (parent -> derived),
  // using first parent as primary and the rest as extraLinks.
  const primaryChildren = new Map();
  const inDegree = new Map();
  const extraLinks = [];

  const ensureArr = (k) => {
    if (!primaryChildren.has(k)) primaryChildren.set(k, []);
    return primaryChildren.get(k);
  };

  // edgeLabelForResolvent[resolventId] = label from the primary parent edge
  const edgeLabelForResolvent = new Map();

  const walk = (resolvent) => {
    inDegree.set(resolvent.id, inDegree.get(resolvent.id) ?? 0);
    const parents = resolvent.children || [];

    if (parents.length > 0) {
      const primaryParent = parents[0];
      ensureArr(primaryParent.id).push(resolvent.id);
      inDegree.set(resolvent.id, (inDegree.get(resolvent.id) ?? 0) + 1);

      // The edge label on the primary parent edge goes onto the resolvent node's label
      if (primaryParent.edgeLabel) {
        edgeLabelForResolvent.set(resolvent.id, primaryParent.edgeLabel);
      }

      for (let k = 1; k < parents.length; k++) {
        extraLinks.push({
          sourceId: parents[k].id,
          targetId: resolvent.id,
          label: parents[k].edgeLabel || "",
        });
      }
    }

    parents.forEach(walk);
  };
  walk(labeledTree);

  // Any node with inDegree 0 is a top-level premise in the UI.
  const allIds = nodes.map((n) => n.id);
  allIds.forEach((id) => {
    if (!inDegree.has(id)) inDegree.set(id, 0);
  });

  const topLevelIds = allIds.filter((id) => (inDegree.get(id) ?? 0) === 0);

  const byId = new Map(nodes.map((n) => [n.id, { id: n.id, value: n.value, children: [], label: "" }]));

  // Attach edge labels to resolvent nodes
  for (const [rid, lbl] of edgeLabelForResolvent.entries()) {
    const node = byId.get(rid);
    if (node) node.label = lbl;
  }

  for (const [p, kids] of primaryChildren.entries()) {
    const parent = byId.get(p);
    if (!parent) continue;
    parent.children = kids.map((kid) => byId.get(kid)).filter(Boolean);
  }

  const treeData = {
    id: -1,
    value: "__root__",
    children: topLevelIds.map((id) => byId.get(id)).filter(Boolean),
  };

  return { treeData, extraLinks, validation };
}

