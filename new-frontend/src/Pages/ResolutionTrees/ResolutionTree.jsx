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
import LatexImportModal from "../../Components/ResolutionTree/LatexImportModal";
import { buildGeometryLine } from "../../utils/latexGeometry";
import { useTranslation } from 'react-i18next';

const ResolutionTree = () => {
  const { t } = useTranslation();
  const svgRef = useRef();
  const zoomLayerRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
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
  const [wrapBraces, setWrapBraces] = useState(true);
  const [paperSize, setPaperSize] = useState("a4paper");
  const [landscape, setLandscape] = useState(false);
  const [resolventDraft, setResolventDraft] = useState("");
  const [isSelectingParents, setIsSelectingParents] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(null); // { sourceId, targetId, isExtra }
  const [edgeLabelDraft1, setEdgeLabelDraft1] = useState("");
  const [edgeLabelDraft2, setEdgeLabelDraft2] = useState("");

  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [treeName, setTreeName] = useState("");
  const [treeDescription, setTreeDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const addTopNode = () => {
    const newNode = { id: nodeId, value: "", children: [], label: "" };
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
      const newNode = { id: nodeId, value: "", children: [], label: "" };
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
      toast.error(t('resolution.enter_resolvent'));
      return;
    }

    const label1 = (edgeLabelDraft1 ?? "").trim();
    const label2 = (edgeLabelDraft2 ?? "").trim();

    const newNode = { id: nodeId, value, children: [], label: label1 };
    const clone = structuredClone(treeData);
    const parentA = findNodeById(clone, firstId);
    if (!parentA) return;
    parentA.children = parentA.children || [];
    parentA.children.push(newNode);

    setNodeId((prev) => prev + 1);
    setExtraLinks((links) => [...links, { sourceId: secondId, targetId: newNode.id, label: label2 }]);
    setTreeData(clone);
    setSelectedIds([]);
    setResolventDraft("");
    setEdgeLabelDraft1("");
    setEdgeLabelDraft2("");
    setIsSelectingParents(false);
    setSelectedNodeId(newNode.id);
    toast.success(t('resolution.resolvent_added'));
  }, [treeData, selectedIds, resolventDraft, edgeLabelDraft1, edgeLabelDraft2, nodeId, findNodeById]);

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

  const updateEdgeLabel = useCallback(
    (sourceId, targetId, isExtra, newLabel) => {
      if (isExtra) {
        setExtraLinks((links) =>
          links.map((l) =>
            l.sourceId === sourceId && l.targetId === targetId
              ? { ...l, label: newLabel }
              : l
          )
        );
      } else {
        const clone = structuredClone(treeData);
        const parent = findNodeById(clone, sourceId);
        if (parent?.children) {
          const child = parent.children.find((c) => c.id === targetId);
          if (child) child.label = newLabel;
        }
        setTreeData(clone);
      }
    },
    [treeData, findNodeById]
  );

  const handleImportFromLatex = useCallback((result) => {
    setTreeData(result.treeData);
    setExtraLinks(result.extraLinks || []);

    const findMaxId = (node) => {
      if (!node) return -1;
      let max = typeof node.id === "number" ? node.id : -1;
      (node.children || []).forEach((c) => {
        max = Math.max(max, findMaxId(c));
      });
      return max;
    };
    const maxTreeId = findMaxId(result.treeData);
    const maxExtra =
      (result.extraLinks || []).reduce(
        (m, l) => Math.max(m, l.sourceId ?? -1, l.targetId ?? -1),
        -1
      ) ?? -1;
    setNodeId(Math.max(maxTreeId, maxExtra) + 1);

    setSelectedNodeId(null);
    setSelectedEdge(null);
    setSelectedIds([]);
    setIsSelectingParents(false);
    setResolventDraft("");
    setEdgeLabelDraft1("");
    setEdgeLabelDraft2("");
    zoomLayerRef.current = null;
  }, []);

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
        setWrapBraces(loaded.settings?.wrapBraces ?? true);
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
        toast.error(t('common.load_failed', { item: t('resolution.name') }));
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
      toast.success(t('common.import_success_image'));
    } catch (err) {
      console.error("Error auto-importing resolution tree LaTeX:", err);
      toast.error(t('common.import_failed', { message: err.message || "Invalid LaTeX" }));
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
    let inner;
    if (!wrapBraces) {
      inner = v;
    } else {
      inner =
        depth > 0
          ? v.startsWith("\\{") && v.endsWith("\\}")
            ? v
            : `\\{${v}\\}`
          : v;
    }
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

    // In tikz-qtree, \edge must come BEFORE the child's [...] bracket
    const renderedChildren = children
      .map((c) => {
        const childStr = renderNodeQtree(c, depth + 1, namedIds);
        const edgeLabel = c.edgeLabel || "";
        if (edgeLabel) {
          return `\\edge node[midway,right,font=\\scriptsize]{$[${edgeLabel}]$}; ${childStr}`;
        }
        return childStr;
      })
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

    // reversedChildren[resultId] = [{ parentId, edgeLabel }...]
    const reversedChildren = new Map();
    const pushChild = (id, childId, edgeLabel) => {
      if (!reversedChildren.has(id)) reversedChildren.set(id, []);
      reversedChildren.get(id).push({ parentId: childId, edgeLabel: edgeLabel || "" });
    };

    // Reverse primary edges: child depends on parent
    // The edge label lives on the child node (child.label = label for edge parent->child)
    for (const [childId, parentId] of primaryParentOf.entries()) {
      const childNode = nodeById.get(childId);
      pushChild(childId, parentId, childNode?.label || "");
    }

    // Also include "second parent" dependencies (from extraLinks) as children in the exported tree.
    // extraLinks store: { sourceId: secondParentId, targetId: derivedClauseId, label }
    extraLinks.forEach((l) => {
      if (nodeById.has(l.sourceId) && nodeById.has(l.targetId)) {
        pushChild(l.targetId, l.sourceId, l.label || "");
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

    const buildExportTree = (id, visited = new Set(), edgeLabel = "") => {
      if (visited.has(id)) {
        const base = nodeById.get(id);
        return { id: base?.id ?? id, value: base?.value ?? "", children: [], edgeLabel };
      }
      visited.add(id);
      globalIncluded.add(id);
      const base = nodeById.get(id);
      const parentEntries = (reversedChildren.get(id) || []).filter((e) => nodeById.has(e.parentId));
      const primaryId = primaryParentOf.get(id);
      const orderedEntries = primaryId
        ? [
            parentEntries.find((e) => e.parentId === primaryId),
            ...parentEntries.filter((e) => e.parentId !== primaryId),
          ].filter(Boolean)
        : parentEntries;

      return {
        id: base.id,
        value: base.value,
        edgeLabel,
        children: orderedEntries.map((e) => buildExportTree(e.parentId, new Set(visited), e.edgeLabel)),
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
      code += buildGeometryLine(paperSize, landscape);
      code += "\\usepackage{tikz-qtree}\n";
      code += "\\usepackage{latexsym}\n";
      code += "\\usepackage{amssymb}\n\n";
      code += "\\pagestyle{empty}\n";
      code += "\\begin{document}\n";
    }

    const tikzOptions = "grow'=up, level distance=50pt, sibling distance=5pt, every tree node/.style={align=center}";

    if (treeBodies.length === 1) {
      // Single tree - render as before
      code += `\\begin{tikzpicture}[${tikzOptions}]\n`;
      code += `\\Tree ${treeBodies[0]}\n`;
      code += `\\end{tikzpicture}`;
    } else {
      // Multiple trees (main resolution + unclosed branches)
      // Render each tree in its own tikzpicture, side by side
      treeBodies.forEach((body, index) => {
        if (index > 0) {
          code += `\n\\hspace{1cm}\n`;
        }
        code += `\\begin{tikzpicture}[${tikzOptions}]\n`;
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
    const svg = d3.select(svgRef.current);

    if (!treeData) {
      svg.selectAll("*").remove();
      zoomLayerRef.current = null;
      return;
    }

    // First render: set up zoom layer and zoom behavior once
    if (!zoomLayerRef.current) {
      svg.selectAll("*").remove();
      const zoomLayer = svg.append("g").attr("class", "resolution-zoom-layer");
      zoomLayerRef.current = zoomLayer;

      const zoom = d3
        .zoom()
        .scaleExtent([0.25, 3])
        .on("zoom", (event) => {
          zoomLayer.attr("transform", event.transform);
        });

      zoomBehaviorRef.current = zoom;
      svg.call(zoom);
      svg.on("dblclick.zoom", null);
    }

    const zoomLayer = zoomLayerRef.current;
    zoomLayer.selectAll("*").remove();

    const width = 700;
    const height = 500;

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().size([width - 100, height - 100]);
    treeLayout(root);

    // links
    const renderedNodes = root.descendants().filter((d) => d.data.id !== -1);
    const renderedLinks = root
      .links()
      .filter((l) => l.source.data.id !== -1 && l.target.data.id !== -1);

    zoomLayer
      .selectAll("path.link")
      .data(renderedLinks)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", (d) =>
        selectedEdge &&
        !selectedEdge.isExtra &&
        selectedEdge.sourceId === d.source.data.id &&
        selectedEdge.targetId === d.target.data.id
          ? "#2563eb"
          : "#b6b6b6"
      )
      .attr("stroke-width", (d) =>
        selectedEdge &&
        !selectedEdge.isExtra &&
        selectedEdge.sourceId === d.source.data.id &&
        selectedEdge.targetId === d.target.data.id
          ? 4
          : 3
      )
      .style("cursor", "pointer")
      .attr(
        "d",
        d3
          .linkVertical()
          .x((d) => d.x + 50)
          .y((d) => d.y + 50)
      )
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedEdge({
          sourceId: d.source.data.id,
          targetId: d.target.data.id,
          isExtra: false,
        });
        setSelectedNodeId(null);
      });

    // Edge labels for primary links
    zoomLayer
      .selectAll("text.link-label")
      .data(renderedLinks.filter((d) => d.target.data.label))
      .enter()
      .append("text")
      .attr("class", "link-label")
      .attr("text-anchor", "middle")
      .attr("dy", "-6")
      .attr("x", (d) => (d.source.x + d.target.x) / 2 + 50)
      .attr("y", (d) => (d.source.y + d.target.y) / 2 + 50)
      .style("font-size", "11px")
      .style("fill", "#6b21a8")
      .style("font-weight", "600")
      .style("pointer-events", "none")
      .text((d) => d.target.data.label);

    // Build position map for extra links
    const posMap = {};
    renderedNodes.forEach((d) => {
      posMap[d.data.id] = { x: d.x + 50, y: d.y + 50 };
    });

    // extra links (second parent)
    const visibleExtraLinks = extraLinks.filter((l) => posMap[l.sourceId] && posMap[l.targetId]);
    zoomLayer
      .selectAll("path.extra-link")
      .data(visibleExtraLinks)
      .enter()
      .append("path")
      .attr("class", "extra-link")
      .attr("fill", "none")
      .attr("stroke", (l) =>
        selectedEdge &&
        selectedEdge.isExtra &&
        selectedEdge.sourceId === l.sourceId &&
        selectedEdge.targetId === l.targetId
          ? "#2563eb"
          : "#b6b6b6"
      )
      .attr("stroke-width", (l) =>
        selectedEdge &&
        selectedEdge.isExtra &&
        selectedEdge.sourceId === l.sourceId &&
        selectedEdge.targetId === l.targetId
          ? 4
          : 3
      )
      .style("cursor", "pointer")
      .attr("d", (l) => {
        const s = posMap[l.sourceId];
        const t = posMap[l.targetId];
        return d3
          .linkVertical()
          .x((d) => d.x)
          .y((d) => d.y)({ source: s, target: t });
      })
      .on("click", (event, l) => {
        event.stopPropagation();
        setSelectedEdge({
          sourceId: l.sourceId,
          targetId: l.targetId,
          isExtra: true,
        });
        setSelectedNodeId(null);
      });

    // Edge labels for extra links
    zoomLayer
      .selectAll("text.extra-link-label")
      .data(visibleExtraLinks.filter((l) => l.label))
      .enter()
      .append("text")
      .attr("class", "extra-link-label")
      .attr("text-anchor", "middle")
      .attr("dy", "-6")
      .attr("x", (l) => (posMap[l.sourceId].x + posMap[l.targetId].x) / 2)
      .attr("y", (l) => (posMap[l.sourceId].y + posMap[l.targetId].y) / 2)
      .style("font-size", "11px")
      .style("fill", "#6b21a8")
      .style("font-weight", "600")
      .style("pointer-events", "none")
      .text((l) => l.label);

    // nodes
    const nodes = zoomLayer
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
        setSelectedEdge(null);
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
    selectedEdge,
    toggleSelect,
    isSelectingParents,
  ]);

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">{t('resolution.title')}</h1>
      <p className="text-gray-600 text-sm mb-6 text-center">
        {t('resolution.description_text')}
      </p>

      <div className="w-full flex flex-wrap gap-3 items-center mb-4">
        <button
          onClick={addTopNode}
          className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700"
        >
          <FaPlus /> {t('resolution.add_clause')}
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {t('resolution.import_from_latex')}
        </button>
        <button
          onClick={() => {
            const entering = !isSelectingParents;
            setIsSelectingParents(entering);
            if (entering) {
              setSelectedIds([]);
              setResolventDraft("");
            }
          }}
          className={`px-4 py-2 rounded font-medium border transition-colors ${
            isSelectingParents
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
          }`}
          title="Toggle mode: clicking nodes will mark/unmark them as parents (max 2)"
        >
          {isSelectingParents ? t('resolution.selecting_nodes') : t('resolution.resolve_clauses')}
        </button>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={mathMode}
            onChange={() => setMathMode((v) => !v)}
          />
          {t('resolution.math_mode_labels')}
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={wrapBraces}
            onChange={() => setWrapBraces((v) => !v)}
          />
          {t('resolution.wrap_braces')}
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includePreamble}
            onChange={() => setIncludePreamble((v) => !v)}
          />
          {t('resolution.include_preamble')}
        </label>
        {includePreamble && (
          <>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <span>{t('common.paper_size')}</span>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="a4paper">A4</option>
                <option value="a3paper">A3</option>
                <option value="a2paper">A2</option>
                <option value="a1paper">A1</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={landscape}
                onChange={() => setLandscape((v) => !v)}
              />
              {t('common.landscape')}
            </label>
          </>
        )}
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <FaTrash className="text-red-500" /> {t('resolution.delete_from_inspector')}
        </div>
      </div>

      {/* Resolution workflow banner - visible when selecting parents */}
      {isSelectingParents && (
        <div
          className={`w-full mb-4 rounded-lg border-2 p-4 transition-all ${
            selectedIds.length === 2
              ? "border-blue-500 bg-blue-50 shadow-lg"
              : "border-amber-400 bg-amber-50"
          }`}
        >
          {selectedIds.length < 2 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      selectedIds.length >= 1
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    1
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      selectedIds.length >= 1 ? "text-green-700" : "text-gray-500"
                    }`}
                  >
                    {selectedIds.length >= 1
                      ? `Parent 1 selected (node ${selectedIds[0]})`
                      : "Click a node to select parent 1"}
                  </span>
                </div>
                <span className="text-gray-300 text-lg">&rarr;</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-300 text-gray-600">
                    2
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    Click another node for parent 2
                  </span>
                </div>
                <span className="text-gray-300 text-lg">&rarr;</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-200 text-gray-400">
                    3
                  </div>
                  <span className="text-sm text-gray-400">Enter resolvent</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addTopNode}
                  className="px-3 py-1 text-sm text-blue-700 border border-blue-300 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                  title="Add a new standalone clause that you can then select as a parent"
                >
                  <FaPlus className="text-xs" /> {t('resolution.add_clause')}
                </button>
                <button
                  onClick={() => {
                    setIsSelectingParents(false);
                    setSelectedIds([]);
                    setResolventDraft("");
                  }}
                  className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-green-500 text-white">
                    1
                  </div>
                  <span className="text-sm font-medium text-green-700">
                    Node {selectedIds[0]}
                  </span>
                </div>
                <span className="text-blue-400 text-lg">+</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-green-500 text-white">
                    2
                  </div>
                  <span className="text-sm font-medium text-green-700">
                    Node {selectedIds[1]}
                  </span>
                </div>
                <span className="text-blue-400 text-lg">&rarr;</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-blue-500 text-white animate-pulse">
                  3
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-blue-800 mb-1">
                      {t('resolution.resolvent_clause')}
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={resolventDraft}
                      onChange={(e) => setResolventDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") createResolventFromSelection();
                      }}
                      placeholder='e.g. {m}  |  {\\neg a}  |  \\Box'
                      className="w-full px-3 py-2 border-2 border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setResolventDraft("\\Box")}
                    className="px-3 py-2 bg-gray-100 text-gray-800 rounded border border-gray-300 hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap"
                    title="Insert empty clause symbol"
                  >
                    {t('resolution.empty_clause')}
                  </button>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Edge label: Parent 1 &rarr; Resolvent
                      <span className="text-gray-400 ml-1">(optional, e.g. a/y, b/x)</span>
                    </label>
                    <input
                      type="text"
                      value={edgeLabelDraft1}
                      onChange={(e) => setEdgeLabelDraft1(e.target.value)}
                      placeholder="e.g. a/y, b/x"
                      className="w-full px-3 py-1.5 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Edge label: Parent 2 &rarr; Resolvent
                      <span className="text-gray-400 ml-1">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={edgeLabelDraft2}
                      onChange={(e) => setEdgeLabelDraft2(e.target.value)}
                      placeholder="e.g. a/z"
                      className="w-full px-3 py-1.5 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={createResolventFromSelection}
                    className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-semibold whitespace-nowrap shadow"
                  >
                    {t('resolution.add_resolvent')}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIds([]);
                      setResolventDraft("");
                      setEdgeLabelDraft1("");
                      setEdgeLabelDraft2("");
                    }}
                    className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors whitespace-nowrap"
                  >
                    {t('common.reset')}
                  </button>
                  <button
                    onClick={() => {
                      setIsSelectingParents(false);
                      setSelectedIds([]);
                      setResolventDraft("");
                      setEdgeLabelDraft1("");
                      setEdgeLabelDraft2("");
                    }}
                    className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors whitespace-nowrap"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Canvas + Inspector (match AST/FSA layout) */}
      <div className="w-full mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-auto p-4">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => {
                if (!zoomBehaviorRef.current) return;
                d3.select(svgRef.current)
                  .transition()
                  .duration(150)
                  .call(zoomBehaviorRef.current.scaleBy, 1.2);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-800 font-medium rounded border border-gray-300 hover:bg-gray-200 transition-colors"
            >
              {t('common.zoom_in')}
            </button>
            <button
              onClick={() => {
                if (!zoomBehaviorRef.current) return;
                d3.select(svgRef.current)
                  .transition()
                  .duration(150)
                  .call(zoomBehaviorRef.current.scaleBy, 0.8);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-800 font-medium rounded border border-gray-300 hover:bg-gray-200 transition-colors"
            >
              {t('common.zoom_out')}
            </button>
            <button
              onClick={() => {
                if (!zoomBehaviorRef.current) return;
                d3.select(svgRef.current)
                  .transition()
                  .duration(150)
                  .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-800 font-medium rounded border border-gray-300 hover:bg-gray-200 transition-colors"
            >
              {t('common.reset_view')}
            </button>
            <span className="text-xs text-gray-400 ml-2">
              {t('resolution.scroll_zoom_pan')}
            </span>
          </div>
          <svg
            ref={svgRef}
            width={700}
            height={500}
            className="border border-gray-200 rounded block mx-auto"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-700">{t('common.inspector')}</h2>
            {(selectedNodeId !== null || selectedEdge !== null) && (
              <button
                onClick={() => {
                  setSelectedNodeId(null);
                  setSelectedEdge(null);
                  setSelectedIds([]);
                  setResolventDraft("");
                }}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 transition-colors"
              >
                {t('common.clear')}
              </button>
            )}
          </div>

          {selectedEdge ? (
            <div className="space-y-4">
              <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide">
                {t('resolution.edge_selected')}
              </div>
              <div className="text-sm text-gray-600">
                Node <span className="font-mono font-bold">{selectedEdge.sourceId}</span>
                {" \u2192 "}
                Node <span className="font-mono font-bold">{selectedEdge.targetId}</span>
                {selectedEdge.isExtra && (
                  <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded">extra link</span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('resolution.edge_label_substitution')}
                </label>
                <input
                  type="text"
                  value={(() => {
                    if (selectedEdge.isExtra) {
                      const link = extraLinks.find(
                        (l) => l.sourceId === selectedEdge.sourceId && l.targetId === selectedEdge.targetId
                      );
                      return link?.label ?? "";
                    }
                    const parent = findNodeById(treeData, selectedEdge.sourceId);
                    const child = parent?.children?.find((c) => c.id === selectedEdge.targetId);
                    return child?.label ?? "";
                  })()}
                  onChange={(e) =>
                    updateEdgeLabel(
                      selectedEdge.sourceId,
                      selectedEdge.targetId,
                      selectedEdge.isExtra,
                      e.target.value
                    )
                  }
                  placeholder="e.g. a/y, b/x"
                  className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Shows substitution on the edge, e.g. <span className="font-mono">[a/y, b/x]</span>
                </div>
              </div>
            </div>
          ) : !selectedNode ? (
            <div className="text-sm text-gray-500">
              {t('resolution.click_node_or_edge')}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">{t('resolution.node_id')}</div>
                <div className="font-mono text-sm text-gray-800">{selectedNode.id}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('resolution.clause_value')}
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
                  {t('common.add_child')}
                </button>

                <button
                  onClick={() => {
                    if (!treeData) return;
                    if (selectedNode.id === treeData.id) {
                      toast.error(t('common.cannot_delete_root'));
                      return;
                    }
                    if (!window.confirm(t('common.confirm_delete_node'))) return;
                    removeNode(selectedNode);
                    setSelectedNodeId(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  {t('common.delete_node')}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* LaTeX generation */}
      <div className="w-full mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateLatex}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>{t('common.generate_latex_short')}</span>
          </button>
          {generatedCode && (
            <button
              onClick={() => setShowLaTeXEditor((v) => !v)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>{showLaTeXEditor ? t('common.show_code_only') : t('common.edit_compile')}</span>
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
          {t('resolution.info_title')}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('resolution.tree_name')}
            </label>
            <input
              type="text"
              value={treeName}
              onChange={(e) => setTreeName(e.target.value)}
              placeholder={t('resolution.tree_name_placeholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.description_optional')}
            </label>
            <textarea
              value={treeDescription}
              onChange={(e) => setTreeDescription(e.target.value)}
              placeholder={t('resolution.description_placeholder')}
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
              toast.error(t('common.please_login_save', { item: t('resolution.name') }));
              return;
            }
            if (!treeName.trim()) {
              toast.error(t('common.please_enter_name', { item: t('resolution.name') }));
              return;
            }
            setIsSaving(true);
            try {
              const payload = {
                name: treeName,
                description: treeDescription,
                treeData,
                extraLinks,
                settings: { mathMode, includePreamble, wrapBraces },
                userId: user.id,
              };
              if (isEditMode) {
                await resolutionTreeService.updateResolutionTree(id, payload);
                toast.success(t('common.update_success', { item: t('resolution.name') }));
              } else {
                const resp = await resolutionTreeService.saveResolutionTree(payload);
                toast.success(t('common.save_success', { item: t('resolution.name') }));
                navigate(`/resolution-trees/edit/${resp.data._id}`);
              }
            } catch (e) {
              console.error("Error saving resolution tree:", e);
              toast.error(t('common.save_failed', { item: t('resolution.name') }));
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
              <span>{isEditMode ? t('resolution.updating') : t('resolution.saving')}</span>
            </>
          ) : (
            <span>{isEditMode ? t('resolution.update_tree') : t('resolution.save_tree')}</span>
          )}
        </button>
        {!user && (
          <p className="text-sm text-red-500 mt-2">
            {t('common.please_login_save', { item: t('resolution.name') })}
          </p>
        )}
      </div>

      <LatexImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportFromLatex}
      />
    </div>
  );
};

export default ResolutionTree;


