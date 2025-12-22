import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { FaPlus, FaTrash } from "react-icons/fa";
import GeneratedCode from "../../Components/GeneratedCode";
import { LaTeXEditor } from "../../Components/LaTeXEditor";

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
  const [generatedCode, setGeneratedCode] = useState("");
  const [showLaTeXEditor, setShowLaTeXEditor] = useState(false);
  const [includePreamble, setIncludePreamble] = useState(true);

  const addTopNode = () => {
    const value = prompt("Top-level clause (e.g., \\Box or {m})", "\\Box");
    if (value !== null) {
      const newNode = {
        id: nodeId,
        value: value || "\\Box",
        children: [],
      };
      setNodeId((prev) => prev + 1);
      setTreeData((prev) => ({
        ...prev,
        children: [...(prev.children || []), newNode],
      }));
    }
  };

  const addChild = useCallback(
    (target) => {
      const value = prompt("Child clause (e.g., {a,m} or {¬m})", "{ }");
      if (value === null) return;
      const newNode = { id: nodeId, value: value || "{ }", children: [] };
      setNodeId((prev) => prev + 1);
      const clone = structuredClone(treeData);
      const dfs = (n) => {
        if (n.id === target.id) {
          n.children = n.children || [];
          n.children.push(newNode);
          return true;
        }
        return n.children?.some(dfs);
      };
      dfs(clone);
      setTreeData(clone);
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

  const combineSelected = useCallback(() => {
    if (!treeData || selectedIds.length !== 2) return;
    const [firstId, secondId] = selectedIds;
    const newVal = prompt("New clause value (e.g., {m} or {¬m})", "{ }");
    if (newVal === null) return;

    // create new node under first selected
    const newNode = { id: nodeId, value: newVal || "{ }", children: [] };
    setNodeId((prev) => prev + 1);

    const clone = structuredClone(treeData);
    const parentA = findNodeById(clone, firstId);
    if (!parentA) return;
    parentA.children = parentA.children || [];
    parentA.children.push(newNode);

    // add second link from secondId to new node (visual only)
    setExtraLinks((links) => [
      ...links,
      { sourceId: secondId, targetId: newNode.id },
    ]);

    setTreeData(clone);
    setSelectedIds([]);
  }, [treeData, selectedIds, nodeId, findNodeById]);

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

  useEffect(() => {
    if (selectedIds.length === 2) {
      combineSelected();
    }
  }, [selectedIds, combineSelected]);

  // ---- LaTeX generation ----
  const renderNodeLatex = (node) => {
    const isVirtual = node.id === -1;
    const label = isVirtual
      ? ""
      : mathMode
      ? `$${node.value}$`
      : node.value;

    let out = "[";
    if (label) out += ` ${label}`;
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        out += "\n  " + renderNodeLatex(child).replace(/^/gm, "  ");
      });
    }
    out += "\n]";
    return out;
  };

  const handleGenerateLatex = () => {
    if (!treeData || !treeData.children || treeData.children.length === 0) {
      setGeneratedCode("% No resolution tree defined yet.");
      return;
    }

    const body = renderNodeLatex(treeData);
    let code = "";
    if (includePreamble) {
      code += "\\documentclass{article}\\n";
      code += "\\usepackage{forest}\\n";
      code += "\\begin{document}\\n";
    }

    code += `\\begin{forest}
  for tree={
    grow'=90,
    parent anchor=north,
    math content,
  }
${body}
\\end{forest}`;

    if (includePreamble) {
      code += "\\n\\\\end{document}";
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
      .attr("stroke", "#ff8c00")
      .attr("stroke-dasharray", "4 2")
      .attr("stroke-width", 2)
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
        if (event.shiftKey || event.metaKey || event.ctrlKey) {
          toggleSelect(d.data.id); // multi-select with modifier
        } else {
          addChild(d.data); // default: add a child
        }
      })
      .on("contextmenu", (event, d) => {
        event.preventDefault();
        removeNode(d.data);
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
        selectedIds.includes(d.data.id) ? "#e0f2fe" : "#fff"
      )
      .attr("stroke", (d) =>
        selectedIds.includes(d.data.id) ? "#0284c7" : "#111"
      )
      .attr("stroke-width", 1.5);

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
  }, [treeData, addChild, removeNode, mathMode]);

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Resolution Trees</h1>
      <p className="text-gray-600 text-sm mb-6 text-center">
        Click on a node to add a child clause. Shift/Ctrl-click to select nodes
        for combining (two selections will prompt for a new clause). Right-click
        a node to delete it. Start by creating a root. Use LaTeX-like input for
        clauses (e.g., {" {a,m} "} or {" {\\neg m} "}). The root can be {" \\Box "} for a
        refutation.
      </p>

      <div className="w-full flex flex-wrap gap-3 items-center mb-4">
        <button
          onClick={addTopNode}
          className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700"
        >
          <FaPlus /> Add top-level clause
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
          <FaTrash className="text-red-500" /> Right-click node to delete
        </div>
      </div>

      <div className="w-full bg-white p-4 rounded shadow">
        <svg
          ref={svgRef}
          width={700}
          height={500}
          className="border border-gray-200 rounded"
        />
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
    </div>
  );
};

export default ResolutionTree;


