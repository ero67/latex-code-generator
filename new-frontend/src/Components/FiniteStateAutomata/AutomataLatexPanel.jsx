import React, { useMemo, useState } from "react";
import GeneratedCode from "../GeneratedCode";
import { LaTeXEditor } from "../LaTeXEditor";
import LatexImportModal from "./LatexImportModal";

function escapeLatexText(s) {
  // Minimal escaping for labels; users can still input raw LaTeX if they want.
  // We avoid escaping backslashes so LaTeX macros still work.
  return String(s ?? "")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}")
    .replaceAll("%", "\\%")
    .replaceAll("&", "\\&")
    .replaceAll("#", "\\#");
}

function toTikzCoord(x, y) {
  // SVG canvas: 900x600, origin top-left.
  // TikZ: map to a small coordinate system centered at (0,0).
  const cx = 450;
  const cy = 300;
  const scale = 90; // 90px ~ 1 unit => about 10 units wide
  const tx = (Number(x) - cx) / scale;
  const ty = -(Number(y) - cy) / scale;
  const round = (n) => Math.round(n * 100) / 100;
  return [round(tx), round(ty)];
}

function normalizeLoopAngle(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return -90;
  const normalized = ((num % 360) + 360) % 360;
  return normalized > 180 ? normalized - 360 : normalized;
}

function loopAngleToTikz(angle) {
  const normalized = normalizeLoopAngle(angle);
  const rounded = Math.round(normalized);

  if (rounded === -90) return "loop above";
  if (rounded === 90) return "loop below";
  if (rounded === 0) return "loop right";
  if (Math.abs(rounded) === 180) return "loop left";

  return `loop, in=${rounded - 25}, out=${rounded + 25}, looseness=8`;
}

function buildTikz(nodes, edges, opts) {
  const { includePreamble, includeTikzImports } = opts;

  if (!nodes || nodes.length === 0) {
    return "% No states defined.\n\\begin{tikzpicture}\n\\end{tikzpicture}\n";
  }

  const nodeMap = new Map(nodes.map((n) => [String(n.id), n]));

  // Enforce at most one initial state in output (pick the first true).
  const initialId = nodes.find((n) => n.isStart)?.id ?? nodes[0]?.id ?? null;

  // Group edges by unordered pair for bend decisions.
  const pairGroups = new Map();
  for (const e of edges) {
    const a = String(e.sourceId);
    const b = String(e.targetId);
    if (a === b) continue;
    const key = a < b ? `${a}__${b}` : `${b}__${a}`;
    const arr = pairGroups.get(key) ?? [];
    arr.push(e);
    pairGroups.set(key, arr);
  }
  for (const [k, arr] of pairGroups.entries()) {
    arr.sort((x, y) => String(x.id).localeCompare(String(y.id)));
    pairGroups.set(k, arr);
  }

  const lines = [];

  if (includePreamble) {
    lines.push("\\documentclass{article}");
    lines.push("\\usepackage{tikz}");
    if (includeTikzImports) {
      lines.push("\\usetikzlibrary{automata,positioning,arrows}");
    }
    lines.push("\\begin{document}");
  } else if (includeTikzImports) {
    lines.push("\\usepackage{tikz}");
    lines.push("\\usetikzlibrary{automata,positioning,arrows}");
  }

  lines.push("\\begin{tikzpicture}[");
  lines.push("  ->,");
  lines.push("  >=stealth',");
  lines.push("  node distance=3cm,");
  lines.push("  every state/.style={thick, fill=gray!10},");
  lines.push("  initial text=$ $,");
  lines.push("]");

  // Nodes
  for (const n of nodes) {
    const id = String(n.id);
    const optsArr = ["state"];
    if (String(id) === String(initialId)) optsArr.push("initial");
    if (n.isAccepting) optsArr.push("accepting");

    const [tx, ty] = toTikzCoord(n.x, n.y);
    const rawLabel = n.label ?? id;
    const label = escapeLatexText(rawLabel);
    lines.push(
      `\\node[${optsArr.join(", ")}] (${id}) at (${tx}, ${ty}) {${label}};`
    );
  }

  // Edges
  const drawLines = [];
  for (const e of edges) {
    const from = String(e.sourceId);
    const to = String(e.targetId);
    if (!nodeMap.has(from) || !nodeMap.has(to)) continue;

    const edgeLabel = escapeLatexText(e.label ?? "");

    // Self loop
    if (from === to) {
      const loopOpts = loopAngleToTikz(e.loopAngle);
      drawLines.push(`(${from}) edge[${loopOpts}] node{${edgeLabel}} (${to})`);
      continue;
    }

    const a = from;
    const b = to;
    const key = a < b ? `${a}__${b}` : `${b}__${a}`;
    const group = pairGroups.get(key) ?? [e];

    const sameDir = group.filter(
      (x) => String(x.sourceId) === from && String(x.targetId) === to
    );
    const rank = sameDir.findIndex((x) => String(x.id) === String(e.id));

    let edgeOpts = [];
    let labelPos = "above";

    if (group.length > 1) {
      // Opposite directions bend to opposite sides.
      const bendSide = a < b ? "left" : "right";
      const base = 20;
      const angle = base + Math.max(0, rank) * 15;
      edgeOpts.push(`bend ${bendSide}=${angle}`);
      labelPos = bendSide === "left" ? "above" : "below";
      edgeOpts.push(labelPos);
    } else {
      edgeOpts.push("above");
    }

    drawLines.push(
      `(${from}) edge[${edgeOpts.join(", ")}] node{${edgeLabel}} (${to})`
    );
  }

  if (drawLines.length > 0) {
    lines.push("\\draw");
    for (let i = 0; i < drawLines.length; i++) {
      const suffix = i === drawLines.length - 1 ? ";" : "";
      lines.push(`  ${drawLines[i]}${suffix}`);
    }
  }

  lines.push("\\end{tikzpicture}");

  if (includePreamble) {
    lines.push("\\end{document}");
  }

  return lines.join("\n") + "\n";
}

const AutomataLatexPanel = ({ nodes, edges, onImport }) => {
  const [includePreamble, setIncludePreamble] = useState(true);
  const [includeTikzImports, setIncludeTikzImports] = useState(true);
  const [generatedCode, setGeneratedCode] = useState(
    "Your code will appear here \n after you click on Generate LaTeX button"
  );
  const [showLaTeXEditor, setShowLaTeXEditor] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const tikz = useMemo(() => {
    // Keep memoized version for preview; we still only "commit" on button click.
    return buildTikz(nodes, edges, { includePreamble, includeTikzImports });
  }, [edges, includePreamble, includeTikzImports, nodes]);

  const handleGenerateLatex = () => {
    setGeneratedCode(tikz);
  };

  return (
    <div className="w-full bg-white p-5 rounded-lg shadow mt-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="text-xl font-bold text-gray-800">LaTeX</h2>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-blue-500 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors"
          >
            Import LaTeX
          </button>
          <button
            onClick={handleGenerateLatex}
            className="bg-green-500 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-600 transition-colors"
          >
            Generate LaTeX
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 mb-5">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={includePreamble}
            onChange={() => setIncludePreamble(!includePreamble)}
            className="mr-2"
          />
          <span className="text-sm text-gray-600 font-medium">
            Include whole LaTeX Preamble
          </span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={includeTikzImports}
            onChange={() => setIncludeTikzImports(!includeTikzImports)}
            className="mr-2"
          />
          <span className="text-sm text-gray-600 font-medium">
            Include TikZ imports (automata, positioning, arrows)
          </span>
        </label>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">Generated LaTeX Code</h3>
        <button
          onClick={() => setShowLaTeXEditor(!showLaTeXEditor)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showLaTeXEditor ? "Show Code Only" : "Edit & Compile"}
        </button>
      </div>

      {showLaTeXEditor ? (
        <LaTeXEditor
          initialCode={generatedCode}
          onCodeChange={(newCode) => setGeneratedCode(newCode)}
          height="700px"
        />
      ) : (
        <GeneratedCode code={generatedCode} />
      )}

      <LatexImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(parsed) => {
          onImport?.(parsed);
        }}
      />
    </div>
  );
};

export default AutomataLatexPanel;


