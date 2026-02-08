import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { FaPlus, FaTrash } from "react-icons/fa";
import GeneratedCode from "../../Components/GeneratedCode";
import { LaTeXEditor } from "../../Components/LaTeXEditor";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { resolutionTreeService } from "../../services/resolutiontree.service";
import { parseResolutionTreeTikz } from "../../utils/resolutionTreeTikzParser";

const ResolutionTree = () => {
  const svgRef = useRef();
  const [treeData, setTreeData] = useState({
    id: -1,
    value: "__root__",
    children: [],
  }); // virtual root to allow multiple top-level clauses
  const [nodeId, setNodeId] = useState(0);
  const [mathMode, setMathMode] = useState(true);
   // store extra links (second parent connections)
  const [extraLinks, setExtraLinks] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [showLaTeXEditor, setShowLaTeXEditor] = useState(false);
  const [includePreamble, setIncludePreamble] = useState(true);
  const [resolventDraft, setResolventDraft] = useState("");
  const [isSelectingParents, setIsSelectingParents] = useState(false);

  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [treeName, setTreeName] = useState("");
  const [treeDescription, setTreeDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const addTopNode = () => {
    const newNode = { id: nodeId, value: "", children: [] };
    setNodeId((prev) => prev + 1);
    setTreeData((prev) => ({
      ...prev,
      children: [...(prev.children || []), newNode],
    }));
    setSelectedNodeId(newNode.id);
  };

  const addChildById = useCallback(
    (parentId) => {
      if (!treeData) return;
      const newNode = { id: nodeId, value: "", children: [] };
      const clone = structuredClone(treeData);
      const dfs = (n) => {
        if (n.id === parentId) {
          n.children = n.children || [];
          n.children.push(newNode);
          return true;
        }
        return n.children?.some(dfs);
      };
      const ok = dfs(clone);
      if (!ok) return;
      setNodeId((prev) => prev + 1);
      setTreeData(clone);
      setSelectedNodeId(newNode.id);
    },
    [nodeId, treeData]
  );

  const removeNode = useCallback(
    (target) => {
      if (!treeData || target.id === treeData.id) return;
      const clone = structuredClone(treeData);
      const prune = (n) => {
        if (!n.children) return false;
        const idx = n.children.findIndex((c) => c.id === target.id);
        if (idx >= 0) {
          n.children.splice(idx, 1);
          return true;
        }
        return n.children.some(prune);
      };
      prune(clone);
      // clean extraLinks that reference removed node
      setExtraLinks((links) =>
        links.filter(
          (l) => l.sourceId !== target.id && l.targetId !== target.id
        )
      );
      setSelectedIds((sel) => sel.filter((id) => id !== target.id));
      setTreeData(clone);
    },
    [treeData]
  );

  const findNodeById = useCallback((node, id) => {
    if (!node) return null;
    if (node.id === id) return node;
    for (const child of node.children || []) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
    return null;
  }, []);

  const createResolventFromSelection = useCallback(() => {
    if (!treeData || selectedIds.length !== 2) return;
    const [firstId, secondId] = selectedIds;

    const value = (resolventDraft ?? "").trim();
    if (!value) {
      toast.error("Please enter a resolvent clause value first.");
      return;
    }

    const newNode = { id: nodeId, value, children: [] };
    const clone = structuredClone(treeData);
    const parentA = findNodeById(clone, firstId);
    if (!parentA) return;
    parentA.children = parentA.children || [];
    parentA.children.push(newNode);

    setNodeId((prev) => prev + 1);
    setExtraLinks((links) => [...links, { sourceId: secondId, targetId: newNode.id }]);
    setTreeData(clone);
    setSelectedIds([]);
    setResolventDraft("");
    setSelectedNodeId(newNode.id);
    toast.success("Resolvent added.");
  }, [treeData, selectedIds, resolventDraft, nodeId, findNodeById]);

  const toggleSelect = useCallback(
    (id) => {
      setSelectedIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((x) => x !== id);
        }
        if (prev.length === 2) return prev; // ignore if already two
        const next = [...prev, id];
        return next;
      });
    },
    []
  );

  const selectedNode =
    selectedNodeId !== null ? findNodeById(treeData, selectedNodeId) : null;

  const updateSelectedNodeValue = useCallback(
    (newValue) => {
      if (!treeData || selectedNodeId === null) return;
      const clone = structuredClone(treeData);
      const target = findNodeById(clone, selectedNodeId);
      if (!target) return;
      target.value = newValue;
      setTreeData(clone);
    },
    [treeData, selectedNodeId, findNodeById]
  );

  // ---- Load saved tree in edit mode ----
  useEffect(() => {
    const load = async () => {
      if (!id || !user) return;
      try {
        const resp = await resolutionTreeService.getResolutionTree(id);
        const loaded = resp.data;
        setTreeData(loaded.treeData);
        setExtraLinks(loaded.extraLinks || []);
        setMathMode(loaded.settings?.mathMode ?? true);
        setIncludePreamble(loaded.settings?.includePreamble ?? true);
        setTreeName(loaded.name || "");
        setTreeDescription(loaded.description || "");

        // continue numbering
        const findMaxId = (node) => {
          if (!node) return -1;
          let max = typeof node.id === "number" ? node.id : -1;
          (node.children || []).forEach((c) => {
            max = Math.max(max, findMaxId(c));
          });
          return max;
        };
        const maxTreeId = findMaxId(loaded.treeData);
        const maxExtra =
          (loaded.extraLinks || []).reduce(
            (m, l) => Math.max(m, l.sourceId ?? -1, l.targetId ?? -1),
            -1
          ) ?? -1;
        setNodeId(Math.max(maxTreeId, maxExtra) + 1);
        setSelectedNodeId(null);
        setSelectedIds([]);
      } catch (e) {
        console.error("Error loading resolution tree:", e);
        toast.error("Failed to load resolution tree.");
      }
    };
    load();
  }, [id, user]);

  // Auto-import LaTeX code from Image-to-LaTeX page (create mode only)
  useEffect(() => {
    if (isEditMode) return;

    const storageKey = "pendingLatexImport_Resolution Tree";
    const pendingLatexCode = sessionStorage.getItem(storageKey);
    if (!pendingLatexCode) return;

    try {
      const parsed = parseResolutionTreeTikz(pendingLatexCode);
      setTreeData(parsed.treeData);
      setExtraLinks(parsed.extraLinks || []);

      const findMaxId = (node) => {
        if (!node) return -1;
        let max = typeof node.id === "number" ? node.id : -1;
        (node.children || []).forEach((c) => {
          max = Math.max(max, findMaxId(c));
        });
        return max;
      };
      const maxTreeId = findMaxId(parsed.treeData);
      const maxExtra =
        (parsed.extraLinks || []).reduce(
          (m, l) => Math.max(m, l.sourceId ?? -1, l.targetId ?? -1),
          -1
        ) ?? -1;
      setNodeId(Math.max(maxTreeId, maxExtra) + 1);

      setSelectedNodeId(null);
      setSelectedIds([]);
      setIsSelectingParents(false);
      setResolventDraft("");
      sessionStorage.removeItem(storageKey);
      toast.success("LaTeX resolution tree imported successfully from Image-to-LaTeX!");
    } catch (err) {
      console.error("Error auto-importing resolution tree LaTeX:", err);
      toast.error(`Failed to import resolution tree: ${err.message || "Invalid LaTeX"}`);
      sessionStorage.removeItem(storageKey);
    }
  }, [isEditMode]);

  // ---- LaTeX generation ----
  const normalizeClauseValue = (raw) => {
    if (raw === null || raw === undefined) return "";
    const v = String(raw).trim();
    if (!v || v === "__root__") return "";
    // Treat "{ }" / "{}" as "empty"
    if (/^\{\s*\}$/.test(v)) return "";
    // If user already wrapped in braces, strip them so forest can wrap consistently
    if (v.startsWith("{") && v.endsWith("}")) {
      return v.slice(1, -1).trim();
    }
    return v;
  };

  const formatQtreeNodeLabel = (rawValue, depth) => {
    const v = normalizeClauseValue(rawValue);
    if (!v) return "";
    if (v === "\\Box") return "$\\Box$";
    // Match the expected rendering: clauses as sets in math mode
    const inner =
      depth > 0
        ? v.startsWith("\\{") && v.endsWith("\\}")
          ? v
          : `\\{${v}\\}`
        : v;
    return `$${inner}$`;
  };

  const renderNodeQtree = (node, depth, namedIds) => {
    const isVirtual = node.id === -1 || node.id === -999; // -1 is UI root, -999 is export virtual root
    const children = node.children || [];
    const label = isVirtual ? "" : formatQtreeNodeLabel(node.value, depth);

    // Empty leaf
    if (!label && children.length === 0) return "[]";

    // For named nodes (used by extraLinks), render via \node(name){...};
    const needsName = !isVirtual && namedIds.has(node.id);
    const name = needsName ? `n${node.id}` : null;
    const head = needsName
      ? label
        ? `. \\node(${name}){${label}};`
        : `. \\node(${name}){};`
      : label
      ? `.{${label}}`
      : ".{}";

    if (children.length === 0) {
      return `[${head} ]`;
    }

    const renderedChildren = children
      .map((c) => renderNodeQtree(c, depth + 1, namedIds))
      .join(" ");
    return `[${head} ${renderedChildren} ]`;
  };

  const handleGenerateLatex = () => {
    if (!treeData || !treeData.children || treeData.children.length === 0) {
      setGeneratedCode("% No resolution tree defined yet.");
      return;
    }

    // --- Export model ---
    // The UI stores edges "parent -> child" where child is the derived clause.
    // For LaTeX (tikz-qtree) we want the standard resolution-tree look:
    // premises at the TOP, final clause (typically \Box) at the BOTTOM.
    //
    // tikz-qtree with `grow'=up` draws children ABOVE the parent, so the final clause
    // must be the ROOT of the exported tree. Therefore we invert the dependency edges:
    // derived clause -> its parent clauses.
    //
    // IMPORTANT FOR EDUCATION: We include ALL nodes in the tree, including unclosed
    // branches and nodes that don't lead to \Box. This ensures the complete diagram
    // is exported for educational purposes.

    const collectNodes = (root) => {
      const out = [];
      const stack = [root];
      while (stack.length) {
        const n = stack.pop();
        if (!n) continue;
        out.push(n);
        (n.children || []).forEach((c) => stack.push(c));
      }
      return out;
    };

    const nodes = collectNodes(treeData).filter((n) => n.id !== -1);
    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    // primaryParentOf[childId] = parentId from the "real" tree edges
    const primaryParentOf = new Map();
    const buildPrimaryParentMap = (n) => {
      (n.children || []).forEach((c) => {
        if (n.id !== -1 && c.id !== -1) primaryParentOf.set(c.id, n.id);
        buildPrimaryParentMap(c);
      });
    };
    buildPrimaryParentMap(treeData);

    // reversedChildren[resultId] = [parentClauseIds...]
    const reversedChildren = new Map();
    const pushChild = (id, childId) => {
      if (!reversedChildren.has(id)) reversedChildren.set(id, []);
      reversedChildren.get(id).push(childId);
    };

    // Reverse primary edges: child depends on parent
    for (const [childId, parentId] of primaryParentOf.entries()) {
      pushChild(childId, parentId);
    }

    // Also include "second parent" dependencies (from extraLinks) as children in the exported tree.
    // extraLinks store: { sourceId: secondParentId, targetId: derivedClauseId }
    extraLinks.forEach((l) => {
      if (nodeById.has(l.sourceId) && nodeById.has(l.targetId)) {
        pushChild(l.targetId, l.sourceId);
      }
    });

    // Find ALL leaf nodes in the UI tree (nodes with no children)
    // Each leaf becomes a root in the reversed/exported tree
    const findAllLeafIds = () => {
      const leafIds = [];
      const dfs = (n) => {
        if (!n || n.id === -1) return;
        const kids = n.children || [];
        if (kids.length === 0) {
          leafIds.push(n.id);
        }
        kids.forEach((c) => dfs(c));
      };
      (treeData.children || []).forEach((c) => dfs(c));
      return leafIds;
    };

    const allLeafIds = findAllLeafIds();

    if (allLeafIds.length === 0) {
      setGeneratedCode("% Could not find any nodes to export.");
      return;
    }

    // Sort: \Box first, then by depth (deepest first)
    const getLeafDepth = (leafId) => {
      const findDepth = (n, d) => {
        if (!n || n.id === -1) return -1;
        if (n.id === leafId) return d;
        for (const c of (n.children || [])) {
          const found = findDepth(c, d + 1);
          if (found >= 0) return found;
        }
        return -1;
      };
      for (const c of (treeData.children || [])) {
        const d = findDepth(c, 0);
        if (d >= 0) return d;
      }
      return 0;
    };

    allLeafIds.sort((a, b) => {
      const aNode = nodeById.get(a);
      const bNode = nodeById.get(b);
      const aIsBox = (aNode?.value || "").trim() === "\\Box";
      const bIsBox = (bNode?.value || "").trim() === "\\Box";
      if (aIsBox && !bIsBox) return -1;
      if (!aIsBox && bIsBox) return 1;
      return getLeafDepth(b) - getLeafDepth(a);
    });

    // Build export tree for each leaf, tracking which nodes are included
    const globalIncluded = new Set();

    const buildExportTree = (id, visited = new Set()) => {
      if (visited.has(id)) {
        const base = nodeById.get(id);
        return { id: base?.id ?? id, value: base?.value ?? "", children: [] };
      }
      visited.add(id);
      globalIncluded.add(id);
      const base = nodeById.get(id);
      const parents = (reversedChildren.get(id) || []).filter((pid) => nodeById.has(pid));
      const primary = primaryParentOf.get(id);
      const orderedParents = primary
        ? [primary, ...parents.filter((p) => p !== primary)]
        : parents;

      return {
        id: base.id,
        value: base.value,
        children: orderedParents.map((pid) => buildExportTree(pid, new Set(visited))),
      };
    };

    // Build trees for each disconnected branch
    // Skip leaves that are already included in a previous tree
    const exportTrees = [];
    for (const leafId of allLeafIds) {
      if (globalIncluded.has(leafId)) {
        // This leaf is already part of another tree's ancestry, skip it
        continue;
      }
      const tree = buildExportTree(leafId);
      exportTrees.push(tree);
    }

    // If no trees were built (shouldn't happen), fall back to first leaf
    if (exportTrees.length === 0 && allLeafIds.length > 0) {
      const tree = buildExportTree(allLeafIds[0]);
      exportTrees.push(tree);
    }

    // Generate the body - if single tree, render normally
    // If multiple trees, render each separately with spacing
    const treeBodies = exportTrees.map((tree) => renderNodeQtree(tree, 0, new Set()));

    let code = "";
    if (includePreamble) {
      code += "\\documentclass[tikz, margin=10pt]{standalone}\n";
      code += "\\usepackage{tikz-qtree}\n";
      code += "\\usepackage{latexsym}\n\n";
      code += "\\begin{document}\n";
    }

    if (treeBodies.length === 1) {
      // Single tree - render as before
      code += `\\begin{tikzpicture}[grow'=up]\n`;
      code += `\\Tree ${treeBodies[0]}\n`;
      code += `\\end{tikzpicture}`;
    } else {
      // Multiple trees (main resolution + unclosed branches)
      // Render each tree in its own tikzpicture, side by side
      treeBodies.forEach((body, index) => {
        if (index > 0) {
          code += `\n\\hspace{1cm}\n`;
        }
        code += `\\begin{tikzpicture}[grow'=up]\n`;
        code += `\\Tree ${body}\n`;
        code += `\\end{tikzpicture}`;
      });
    }

    if (includePreamble) {
      code += "\n\\end{document}";
    }

    setGeneratedCode(code);
  };

  useEffect(() => {
    if (!treeData) {
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 700;
    const height = 500;

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().size([width - 100, height - 100]);
    treeLayout(root);

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // links
    const renderedNodes = root.descendants().filter((d) => d.data.id !== -1);
    const renderedLinks = root
      .links()
      .filter((l) => l.source.data.id !== -1 && l.target.data.id !== -1);

    svg
      .selectAll("path.link")
      .data(renderedLinks)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#b6b6b6")
      .attr("stroke-width", 3)
      .attr(
        "d",
        d3
          .linkVertical()
          .x((d) => d.x + 50)
          .y((d) => d.y + 50)
      );

    // Build position map for extra links
    const posMap = {};
    renderedNodes.forEach((d) => {
      posMap[d.data.id] = { x: d.x + 50, y: d.y + 50 };
    });

    // extra links (second parent)
    svg
      .selectAll("path.extra-link")
      .data(extraLinks.filter((l) => posMap[l.sourceId] && posMap[l.targetId]))
      .enter()
      .append("path")
      .attr("class", "extra-link")
      .attr("fill", "none")
      // Render extra links the same as regular links for now
      .attr("stroke", "#b6b6b6")
      .attr("stroke-width", 3)
      .attr("d", (l) => {
        const s = posMap[l.sourceId];
        const t = posMap[l.targetId];
        return d3
          .linkVertical()
          .x((d) => d.x)
          .y((d) => d.y)({ source: s, target: t });
      });

    // nodes
    const nodes = svg
      .selectAll("g.node")
      .data(renderedNodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x + 50},${d.y + 50})`)
      .on("click", (event, d) => {
        event.stopPropagation();
        if (isSelectingParents) toggleSelect(d.data.id);
        setSelectedNodeId(d.data.id);
      });

    nodes
      .append("rect")
      .attr("x", -35)
      .attr("y", -18)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("width", 70)
      .attr("height", 36)
      .attr("fill", (d) =>
        selectedNodeId === d.data.id
          ? "#e3f2fd"
          : selectedIds.includes(d.data.id)
          ? "#e0f2fe"
          : "#fff"
      )
      .attr("stroke", (d) =>
        selectedNodeId === d.data.id
          ? "#2563eb"
          : selectedIds.includes(d.data.id)
          ? "#0284c7"
          : "#111"
      )
      .attr("stroke-width", (d) => (selectedNodeId === d.data.id ? 2.5 : 1.5));

    nodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "14px")
      .text((d) => {
        if (!mathMode) return d.data.value;
        // simple wrap in braces if not already
        return d.data.value;
      });
  }, [
    treeData,
    removeNode,
    mathMode,
    extraLinks,
    selectedIds,
    selectedNodeId,
    toggleSelect,
    isSelectingParents,
  ]);

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Resolution Trees</h1>
      <p className="text-gray-600 text-sm mb-6 text-center">
        Click a node to select it. Use the Inspector to edit it or add children.
        Use the toggle below to select up to two parent clauses for resolution.
      </p>

      <div className="w-full flex flex-wrap gap-3 items-center mb-4">
        <button
          onClick={addTopNode}
          className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700"
        >
          <FaPlus /> Add top-level clause
        </button>
        <button
          onClick={() => setIsSelectingParents((v) => !v)}
          className={`px-4 py-2 rounded font-medium border transition-colors ${
            isSelectingParents
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
          }`}
          title="Toggle mode: clicking nodes will mark/unmark them as parents (max 2)"
        >
          {isSelectingParents ? "Selecting parents (pick 2)" : "Select 2 parents"}
        </button>
        <button
          onClick={() => {
            setSelectedIds([]);
            setResolventDraft("");
          }}
          disabled={selectedIds.length === 0}
          className="px-4 py-2 rounded font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear selection ({selectedIds.length}/2)
        </button>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={mathMode}
            onChange={() => setMathMode((v) => !v)}
          />
          Math mode labels
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includePreamble}
            onChange={() => setIncludePreamble((v) => !v)}
          />
          Include whole LaTeX preamble
        </label>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <FaTrash className="text-red-500" /> Delete from Inspector
        </div>
      </div>

      {/* Canvas + Inspector (match AST/FSA layout) */}
      <div className="w-full mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-auto p-4">
          <svg
            ref={svgRef}
            width={700}
            height={500}
            className="border border-gray-200 rounded block mx-auto"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-700">Inspector</h2>
            {(selectedNodeId !== null || selectedIds.length > 0) && (
              <button
                onClick={() => {
                  setSelectedNodeId(null);
                  setSelectedIds([]);
                  setResolventDraft("");
                }}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {!selectedNode ? (
            <div className="text-sm text-gray-500">
              Click a node in the canvas to select it.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Node ID</div>
                <div className="font-mono text-sm text-gray-800">{selectedNode.id}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clause value
                </label>
                <input
                  type="text"
                  value={selectedNode.value ?? ""}
                  onChange={(e) => updateSelectedNodeValue(e.target.value)}
                  placeholder='e.g. {a,m}  |  {\\neg m}  |  \\Box'
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Tip: You can type braces or LaTeX like <span className="font-mono">{"{\\neg m}"}</span>.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => addChildById(selectedNode.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Add Child
                </button>

                <button
                  onClick={() => {
                    if (!treeData) return;
                    if (selectedNode.id === treeData.id) {
                      toast.error("Cannot delete the root node.");
                      return;
                    }
                    if (!window.confirm("Delete this node and all its children?")) return;
                    removeNode(selectedNode);
                    setSelectedNodeId(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Delete Node
                </button>
              </div>

              {selectedIds.length === 2 && (
                <div className="border-t pt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    Resolution
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Parents:{" "}
                    <span className="font-mono">{selectedIds.join(", ")}</span>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resolvent value
                  </label>
                  <input
                    type="text"
                    value={resolventDraft}
                    onChange={(e) => setResolventDraft(e.target.value)}
                    placeholder='e.g. {m}  |  {\\neg a}'
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setResolventDraft("\\Box")}
                      className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                      title="Use □ as the final resolvent"
                    >
                      Final (\\Box)
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={createResolventFromSelection}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Add Resolvent
                    </button>
                    <button
                      onClick={() => {
                        setSelectedIds([]);
                        setResolventDraft("");
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Clear 2-selection
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* LaTeX generation */}
      <div className="w-full mt-6 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateLatex}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Generate LaTeX
          </button>
          {generatedCode && (
            <button
              onClick={() => setShowLaTeXEditor((v) => !v)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {showLaTeXEditor ? "Show Code Only" : "Edit & Compile"}
            </button>
          )}
        </div>

        {generatedCode && (
          <>
            {showLaTeXEditor ? (
              <LaTeXEditor
                initialCode={generatedCode}
                onCodeChange={(code) => setGeneratedCode(code)}
                height="600px"
              />
            ) : (
              <GeneratedCode id="resolutionLatex" code={generatedCode} />
            )}
          </>
        )}
      </div>

      {/* Metadata + Save/Update (match other builders) */}
      <div className="w-full bg-white p-5 rounded-lg shadow mt-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">
          Resolution Tree Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tree Name *
            </label>
            <input
              type="text"
              value={treeName}
              onChange={(e) => setTreeName(e.target.value)}
              placeholder="Enter a name for your resolution tree"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={treeDescription}
              onChange={(e) => setTreeDescription(e.target.value)}
              placeholder="Enter a description for your resolution tree"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="mb-8 mt-4">
        <button
          onClick={async () => {
            if (!user) {
              toast.error("Please log in to save your resolution tree.");
              return;
            }
            if (!treeName.trim()) {
              toast.error("Please enter a name for your resolution tree.");
              return;
            }
            setIsSaving(true);
            try {
              const payload = {
                name: treeName,
                description: treeDescription,
                treeData,
                extraLinks,
                settings: { mathMode, includePreamble },
                userId: user.id,
              };
              if (isEditMode) {
                await resolutionTreeService.updateResolutionTree(id, payload);
                toast.success("Resolution tree updated successfully!");
              } else {
                const resp = await resolutionTreeService.saveResolutionTree(payload);
                toast.success("Resolution tree saved successfully!");
                navigate(`/resolution-trees/edit/${resp.data._id}`);
              }
            } catch (e) {
              console.error("Error saving resolution tree:", e);
              toast.error("Failed to save resolution tree.");
            } finally {
              setIsSaving(false);
            }
          }}
          disabled={!user || isSaving}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              <span>{isEditMode ? "Updating..." : "Saving..."}</span>
            </>
          ) : (
            <span>{isEditMode ? "Update Resolution Tree" : "Save Resolution Tree"}</span>
          )}
        </button>
        {!user && (
          <p className="text-sm text-red-500 mt-2">
            Please log in to save your resolution tree
          </p>
        )}
      </div>
    </div>
  );
};

export default ResolutionTree;


