import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import AutomataLatexPanel from "../../Components/FiniteStateAutomata/AutomataLatexPanel";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fsaService } from "../../services/fsa.service";
import { toast } from "react-toastify";
import { parseFsaTikz } from "../../utils/fsaTikzParser";

const NODE_R = 26;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function asNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLabel(s) {
  return String(s ?? "").trim();
}

function computeQuadraticPoint(sx, sy, cx, cy, tx, ty, t) {
  // B(t) = (1-t)^2 S + 2(1-t)t C + t^2 T
  const mt = 1 - t;
  const x = mt * mt * sx + 2 * mt * t * cx + t * t * tx;
  const y = mt * mt * sy + 2 * mt * t * cy + t * t * ty;
  return [x, y];
}

function clientToSvgPoint(svgEl, clientX, clientY) {
  // Map browser client coordinates to SVG user-space coordinates,
  // even when the SVG is scaled via CSS/viewBox.
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svgEl.getScreenCTM();
  if (!ctm) return [0, 0];
  const sp = pt.matrixTransform(ctm.inverse());
  return [sp.x, sp.y];
}

function shortenSegment(sx, sy, tx, ty, padStart, padEnd) {
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  return [
    sx + ux * padStart,
    sy + uy * padStart,
    tx - ux * padEnd,
    ty - uy * padEnd,
  ];
}

function buildEdgeGroups(edges) {
  // Group directed edges by unordered node pair (A,B), so we can curve parallel/reverse edges.
  const groups = new Map();
  for (const e of edges) {
    const a = String(e.sourceId);
    const b = String(e.targetId);
    const key = a < b ? `${a}__${b}` : `${b}__${a}`;
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }
  // Stable order per group for consistent curvature.
  for (const [key, arr] of groups.entries()) {
    arr.sort((x, y) => String(x.id).localeCompare(String(y.id)));
    groups.set(key, arr);
  }
  return groups;
}

const FiniteStateAutomata = () => {
  const svgRef = useRef(null);
  const viewportRef = useRef(null);

  const nextNodeId = useRef(0);
  const nextEdgeId = useRef(0);

  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = Boolean(id);

  const [nodes, setNodes] = useState(() => [
    { id: "q0", label: "q0", x: 220, y: 220, isStart: true, isAccepting: false },
    { id: "q1", label: "q1", x: 520, y: 320, isStart: false, isAccepting: true },
  ]);
  const [edges, setEdges] = useState(() => [
    { id: "e0", sourceId: "q0", targetId: "q1", label: "a" },
    { id: "e1", sourceId: "q1", targetId: "q1", label: "b" },
  ]);

  const [mode, setMode] = useState("select"); // select | add_state | add_transition
  const [pendingSourceId, setPendingSourceId] = useState(null);
  const [selected, setSelected] = useState({ type: null, id: null }); // node|edge|null

  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  // Saving metadata
  const [automataName, setAutomataName] = useState("");
  const [automataDescription, setAutomataDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const nodeById = useMemo(() => {
    const m = new Map();
    for (const n of nodes) m.set(String(n.id), n);
    return m;
  }, [nodes]);

  const edgeGroups = useMemo(() => buildEdgeGroups(edges), [edges]);

  // Init IDs based on initial demo content
  useEffect(() => {
    // If user removes demo nodes/edges, these counters still keep increasing (fine).
    const maxQ = nodes
      .map((n) => String(n.id))
      .map((id) => (id.startsWith("q") ? asNumber(id.slice(1), -1) : -1))
      .reduce((a, b) => Math.max(a, b), -1);
    const maxE = edges
      .map((e) => String(e.id))
      .map((id) => (id.startsWith("e") ? asNumber(id.slice(1), -1) : -1))
      .reduce((a, b) => Math.max(a, b), -1);
    nextNodeId.current = Math.max(nextNodeId.current, maxQ + 1);
    nextEdgeId.current = Math.max(nextEdgeId.current, maxE + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load automata for edit mode
  useEffect(() => {
    const load = async () => {
      if (!id || !user) return;
      try {
        const response = await fsaService.getFSA(id);
        const a = response.data;

        setNodes(a.nodes || []);
        setEdges(a.edges || []);
        setAutomataName(a.name || "");
        setAutomataDescription(a.description || "");

        setSelected({ type: null, id: null });
        setPendingSourceId(null);
        setMode("select");

        const maxQ = (a.nodes || [])
          .map((n) => String(n.id))
          .map((nid) => (nid.startsWith("q") ? asNumber(nid.slice(1), -1) : -1))
          .reduce((acc, v) => Math.max(acc, v), -1);
        const maxE = (a.edges || [])
          .map((e) => String(e.id))
          .map((eid) => (eid.startsWith("e") ? asNumber(eid.slice(1), -1) : -1))
          .reduce((acc, v) => Math.max(acc, v), -1);
        nextNodeId.current = Math.max(nextNodeId.current, maxQ + 1);
        nextEdgeId.current = Math.max(nextEdgeId.current, maxE + 1);
      } catch (err) {
        console.error("Error loading FSA:", err);
        toast.error("Failed to load automata");
      }
    };

    load();
  }, [id, user]);

  // Auto-import LaTeX code from Image-to-LaTeX page (create mode only)
  useEffect(() => {
    if (isEditMode) return;

    const storageKey = "pendingLatexImport_Finite State Automata";
    const pendingLatexCode = sessionStorage.getItem(storageKey);
    if (!pendingLatexCode) return;

    try {
      const parsed = parseFsaTikz(pendingLatexCode);
      setNodes(parsed.nodes || []);
      setEdges(parsed.edges || []);

      // Update ID counters so new elements don't collide with imported IDs.
      const maxQ = (parsed.nodes || [])
        .map((n) => String(n.id))
        .map((nid) => (nid.startsWith("q") ? asNumber(nid.slice(1), -1) : -1))
        .reduce((acc, v) => Math.max(acc, v), -1);
      const maxE = (parsed.edges || [])
        .map((e) => String(e.id))
        .map((eid) => (eid.startsWith("e") ? asNumber(eid.slice(1), -1) : -1))
        .reduce((acc, v) => Math.max(acc, v), -1);
      nextNodeId.current = Math.max(nextNodeId.current, maxQ + 1);
      nextEdgeId.current = Math.max(nextEdgeId.current, maxE + 1);

      setSelected({ type: null, id: null });
      setPendingSourceId(null);
      setMode("select");
      setIsInspectorOpen(true);

      sessionStorage.removeItem(storageKey);
      toast.success("LaTeX automata imported successfully from Image-to-LaTeX!");
    } catch (err) {
      console.error("Error auto-importing FSA LaTeX:", err);
      toast.error(`Failed to import automata: ${err.message || "Invalid LaTeX"}`);
      sessionStorage.removeItem(storageKey);
    }
  }, [isEditMode]);

  // SVG init: zoom/pan + marker defs.
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "fsa-arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#111827");

    const viewport = svg.append("g").attr("id", "viewport");
    viewportRef.current = viewport.node();
    viewport.append("g").attr("id", "edges");
    viewport.append("g").attr("id", "nodes");

    const zoom = d3
      .zoom()
      .scaleExtent([0.25, 3])
      .on("zoom", (event) => {
        d3.select(viewportRef.current).attr("transform", event.transform);
      });

    svg.call(zoom);
    svg.on("dblclick.zoom", null); // keep dblclick free (optional)

    return () => {
      svg.on(".zoom", null);
      svg.on("click", null);
    };
  }, []);

  // Keyboard delete for selected element.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (selected.type === "node") {
        const nodeId = selected.id;
        setNodes((prev) => prev.filter((n) => String(n.id) !== String(nodeId)));
        setEdges((prev) =>
          prev.filter(
            (ed) =>
              String(ed.sourceId) !== String(nodeId) &&
              String(ed.targetId) !== String(nodeId)
          )
        );
        setSelected({ type: null, id: null });
        setPendingSourceId((prev) =>
          prev && String(prev) === String(nodeId) ? null : prev
        );
      } else if (selected.type === "edge") {
        const edgeId = selected.id;
        setEdges((prev) => prev.filter((ed) => String(ed.id) !== String(edgeId)));
        setSelected({ type: null, id: null });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  // Render/update graph.
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const viewport = d3.select(viewportRef.current);
    const edgesLayer = viewport.select("#edges");
    const nodesLayer = viewport.select("#nodes");

    // Background click handler for adding states / clearing selection.
    svg.on("click", (event) => {
      // Only react to background clicks (not clicks bubbled from nodes/edges).
      if (event.defaultPrevented) return;
      const t = d3.zoomTransform(svgRef.current);
      const [sx, sy] = clientToSvgPoint(
        svgRef.current,
        event.clientX,
        event.clientY
      );
      const [px, py] = t.invert([sx, sy]);

      if (mode === "add_state") {
        const id = `q${nextNodeId.current++}`;
        const label = id;
        setNodes((prev) => [
          ...prev,
          { id, label, x: px, y: py, isStart: prev.length === 0, isAccepting: false },
        ]);
        setSelected({ type: "node", id });
        setMode("select");
        setPendingSourceId(null);
      } else {
        setSelected({ type: null, id: null });
        if (mode === "add_transition") {
          setPendingSourceId(null);
        }
      }
    });

    // ---- EDGES ----
    const edgeSelection = edgesLayer
      .selectAll("g.edge")
      .data(edges, (d) => String(d.id));

    edgeSelection.exit().remove();

    const edgeEnter = edgeSelection
      .enter()
      .append("g")
      .attr("class", "edge")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        setSelected({ type: "edge", id: d.id });
      });

    edgeEnter
      .append("path")
      .attr("class", "edge-path")
      .attr("fill", "none")
      .attr("stroke-width", 2.5)
      .attr("marker-end", "url(#fsa-arrow)");

    edgeEnter
      .append("text")
      .attr("class", "edge-label")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 12)
      .attr("fill", "#111827")
      .style("user-select", "none");

    const edgeMerged = edgeEnter.merge(edgeSelection);

    edgeMerged.each(function (d) {
      const g = d3.select(this);
      const s = nodeById.get(String(d.sourceId));
      const t = nodeById.get(String(d.targetId));
      if (!s || !t) return;

      const isSelected = selected.type === "edge" && String(selected.id) === String(d.id);
      const baseStroke = isSelected ? "#2563eb" : "#111827";

      const pathEl = g.select("path.edge-path").attr("stroke", baseStroke);
      const labelEl = g.select("text.edge-label").text(d.label || "");

      // Self loop
      if (String(d.sourceId) === String(d.targetId)) {
        const x = s.x;
        const y = s.y;
        const r = NODE_R;
        const loopR = r + 16;
        const dir = d.loopDir || "top";

        let p, lx, ly;
        if (dir === "bottom") {
          p = `M ${x - r * 0.3} ${y + r}
               C ${x - loopR} ${y + loopR * 1.6},
                 ${x + loopR} ${y + loopR * 1.6},
                 ${x + r * 0.3} ${y + r}`;
          lx = x; ly = y + loopR * 1.55 + 12;
        } else if (dir === "left") {
          p = `M ${x - r} ${y - r * 0.3}
               C ${x - loopR * 1.6} ${y - loopR},
                 ${x - loopR * 1.6} ${y + loopR},
                 ${x - r} ${y + r * 0.3}`;
          lx = x - loopR * 1.55 - 6; ly = y + 4;
        } else if (dir === "right") {
          p = `M ${x + r} ${y - r * 0.3}
               C ${x + loopR * 1.6} ${y - loopR},
                 ${x + loopR * 1.6} ${y + loopR},
                 ${x + r} ${y + r * 0.3}`;
          lx = x + loopR * 1.55 + 6; ly = y + 4;
        } else {
          // top (default)
          p = `M ${x - r * 0.3} ${y - r}
               C ${x - loopR} ${y - loopR * 1.6},
                 ${x + loopR} ${y - loopR * 1.6},
                 ${x + r * 0.3} ${y - r}`;
          lx = x; ly = y - loopR * 1.55;
        }

        pathEl.attr("d", p);
        labelEl.attr("x", lx).attr("y", ly);
        return;
      }

      // Non-self: possibly curved if parallel/reverse edges exist
      const a = String(d.sourceId);
      const b = String(d.targetId);
      const key = a < b ? `${a}__${b}` : `${b}__${a}`;
      const group = edgeGroups.get(key) ?? [d];
      const idx = group.findIndex((e) => String(e.id) === String(d.id));
      const total = group.length;
      const curveIndex = idx - (total - 1) / 2;
      const curve = curveIndex * 28;

      const [sx0, sy0, tx0, ty0] = shortenSegment(
        s.x,
        s.y,
        t.x,
        t.y,
        NODE_R + 2,
        NODE_R + 10
      );

      const mx = (sx0 + tx0) / 2;
      const my = (sy0 + ty0) / 2;

      const dx = tx0 - sx0;
      const dy = ty0 - sy0;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist;
      const ny = dx / dist;

      // Give opposite directions slightly different default curvature so labels don't collide.
      const directionBias = a < b ? 1 : -1;
      const cx = mx + nx * curve * directionBias;
      const cy = my + ny * curve * directionBias;

      const p = `M ${sx0} ${sy0} Q ${cx} ${cy} ${tx0} ${ty0}`;
      pathEl.attr("d", p);

      const [lx, ly] = computeQuadraticPoint(sx0, sy0, cx, cy, tx0, ty0, 0.5);
      labelEl.attr("x", lx).attr("y", ly - 10);
    });

    // ---- NODES ----
    const nodeSelection = nodesLayer
      .selectAll("g.node")
      .data(nodes, (d) => String(d.id));

    nodeSelection.exit().remove();

    const drag = d3
      .drag()
      .on("start", (event) => {
        event.sourceEvent?.stopPropagation?.();
      })
      .on("drag", (event, d) => {
        // Update position continuously for smooth feel.
        setNodes((prev) =>
          prev.map((n) =>
            String(n.id) === String(d.id)
              ? { ...n, x: event.x, y: event.y }
              : n
          )
        );
      });

    const nodeEnter = nodeSelection
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer");

    nodeEnter.append("circle").attr("class", "state-outer");
    nodeEnter.append("circle").attr("class", "state-inner");
    nodeEnter.append("path").attr("class", "start-arrow");
    nodeEnter.append("text").attr("class", "state-label");

    const nodeMerged = nodeEnter.merge(nodeSelection);

    // Important: bind interactions on the merged selection so handlers see fresh React state
    // (binding only on "enter" captures stale closures and breaks workflows like add_transition).
    nodeMerged
      .call(drag)
      .on("click", (event, d) => {
        event.preventDefault();
        event.stopPropagation();

        if (mode === "add_transition") {
          if (!pendingSourceId) {
            setPendingSourceId(d.id);
            setSelected({ type: "node", id: d.id });
            return;
          }

          const from = String(pendingSourceId);
          const to = String(d.id);
          const id = `e${nextEdgeId.current++}`;
          setEdges((prev) => [...prev, { id, sourceId: from, targetId: to, label: "" }]);
          setSelected({ type: "edge", id });

          // Keep "add_transition" mode so user can quickly add more transitions.
          setPendingSourceId(null);
          return;
        }

        setSelected({ type: "node", id: d.id });
      });

    nodeMerged.attr("transform", (d) => `translate(${d.x},${d.y})`);

    nodeMerged.each(function (d) {
      const g = d3.select(this);
      const isSelected = selected.type === "node" && String(selected.id) === String(d.id);
      const isPending = mode === "add_transition" && String(pendingSourceId) === String(d.id);

      const stroke = isSelected ? "#2563eb" : isPending ? "#f59e0b" : "#111827";

      g.select("circle.state-outer")
        .attr("r", NODE_R)
        .attr("fill", "#ffffff")
        .attr("stroke", stroke)
        .attr("stroke-width", isSelected ? 3 : 2);

      g.select("circle.state-inner")
        .attr("r", d.isAccepting ? NODE_R - 6 : 0)
        .attr("fill", "none")
        .attr("stroke", stroke)
        .attr("stroke-width", d.isAccepting ? 2 : 0);

      // Start arrow (simple incoming arrow from left)
      if (d.isStart) {
        const ax1 = -NODE_R - 30;
        const ax2 = -NODE_R - 4;
        const p = `M ${ax1} 0 L ${ax2} 0`;
        g.select("path.start-arrow")
          .attr("d", p)
          .attr("stroke", "#111827")
          .attr("stroke-width", 2.5)
          .attr("marker-end", "url(#fsa-arrow)")
          .attr("fill", "none");
      } else {
        g.select("path.start-arrow").attr("d", "").attr("marker-end", null);
      }

      g.select("text.state-label")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 13)
        .attr("fill", "#111827")
        .style("user-select", "none")
        .text(d.label || d.id);
    });
  }, [edges, edgeGroups, mode, nodeById, nodes, pendingSourceId, selected]);

  const selectedNode = useMemo(() => {
    if (selected.type !== "node") return null;
    return nodes.find((n) => String(n.id) === String(selected.id)) ?? null;
  }, [nodes, selected]);

  const selectedEdge = useMemo(() => {
    if (selected.type !== "edge") return null;
    return edges.find((e) => String(e.id) === String(selected.id)) ?? null;
  }, [edges, selected]);

  // Auto-open Inspector when selecting an element.
  useEffect(() => {
    if (selected.type) {
      setIsInspectorOpen(true);
    }
  }, [selected.type, selected.id]);

  const setSingleStart = (nodeId) => {
    setNodes((prev) =>
      prev.map((n) => ({ ...n, isStart: String(n.id) === String(nodeId) }))
    );
  };

  const deleteSelected = () => {
    if (selected.type === "node") {
      const nodeId = selected.id;
      setNodes((prev) => prev.filter((n) => String(n.id) !== String(nodeId)));
      setEdges((prev) =>
        prev.filter(
          (ed) =>
            String(ed.sourceId) !== String(nodeId) && String(ed.targetId) !== String(nodeId)
        )
      );
      setSelected({ type: null, id: null });
      setPendingSourceId(null);
    } else if (selected.type === "edge") {
      const edgeId = selected.id;
      setEdges((prev) => prev.filter((ed) => String(ed.id) !== String(edgeId)));
      setSelected({ type: null, id: null });
    }
  };

  const clearAll = () => {
    setNodes([]);
    setEdges([]);
    setSelected({ type: null, id: null });
    setPendingSourceId(null);
    setMode("select");
  };

  const autoLayout = () => {
    // Quick force layout pass, then freeze positions.
    const simNodes = nodes.map((n) => ({ ...n }));
    const simLinks = edges
      .map((e) => ({
        source: String(e.sourceId),
        target: String(e.targetId),
      }))
      .filter((l) => nodeById.has(String(l.source)) && nodeById.has(String(l.target)));

    const sim = d3
      .forceSimulation(simNodes)
      .force(
        "link",
        d3.forceLink(simLinks).id((d) => String(d.id)).distance(160).strength(0.8)
      )
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(450, 300))
      .force("collide", d3.forceCollide(NODE_R + 18))
      .stop();

    for (let i = 0; i < 180; i++) sim.tick();
    sim.stop();

    setNodes((prev) =>
      prev.map((n) => {
        const sn = simNodes.find((x) => String(x.id) === String(n.id));
        if (!sn) return n;
        return { ...n, x: clamp(sn.x ?? n.x, 40, 860), y: clamp(sn.y ?? n.y, 40, 560) };
      })
    );
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please log in to save your automata");
      return;
    }
    if (!automataName.trim()) {
      toast.error("Please enter a name for your automata");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: automataName,
        description: automataDescription,
        nodes,
        edges,
        settings: {
          includePreamble: true,
          includeTikzImports: true,
        },
        userId: user.id,
      };

      if (isEditMode) {
        await fsaService.updateFSA(id, payload);
        toast.success("Automata updated successfully!");
      } else {
        const response = await fsaService.saveFSA(payload);
        toast.success("Automata saved successfully!");
        navigate(`/finite-state-automata/edit/${response.data._id}`);
      }
    } catch (err) {
      console.error("Error saving FSA:", err);
      toast.error("Failed to save automata. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Finite State Automata</h1>

      <div className="w-full mb-6 bg-white p-5 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">How to use?</h2>
        <div className="space-y-2 text-gray-600">
          <p>
            <span className="font-bold text-blue-600">1.</span> Click{" "}
            <span className="font-semibold">Add State</span>, then click on the canvas to place it.
          </p>
          <p>
            <span className="font-bold text-blue-600">2.</span> Drag states to move them around.
          </p>
          <p>
            <span className="font-bold text-blue-600">3.</span> Click{" "}
            <span className="font-semibold">Add Transition</span>, click a source state, then a
            target state, and enter the label.
          </p>
          <p>
            <span className="font-bold text-blue-600">4.</span> Click a state/transition to edit it
            on the right. Press <span className="font-semibold">Delete</span> to remove it.
          </p>
        </div>
      </div>

      <div className="w-full mb-4 bg-white p-4 rounded-lg shadow flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => {
              setMode("add_state");
              setPendingSourceId(null);
              setSelected({ type: null, id: null });
            }}
            className={`px-4 py-2 rounded font-medium border transition-colors ${
              mode === "add_state"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Add State
          </button>
          <button
            onClick={() => {
              setMode("add_transition");
              setPendingSourceId(null);
              setSelected({ type: null, id: null });
            }}
            className={`px-4 py-2 rounded font-medium border transition-colors ${
              mode === "add_transition"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Add Transition
          </button>
          <button
            onClick={() => {
              setMode("select");
              setPendingSourceId(null);
            }}
            className={`px-4 py-2 rounded font-medium border transition-colors ${
              mode === "select"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Select / Pan
          </button>
          <button
            onClick={autoLayout}
            className="px-4 py-2 rounded font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
          >
            Auto layout
          </button>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={deleteSelected}
            disabled={!selected.type}
            className="px-4 py-2 rounded font-medium border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete selected
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2 rounded font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-700">Automata Canvas</h2>
            <div className="text-sm text-gray-500">
              {mode === "add_state" && "Click to place a state"}
              {mode === "add_transition" &&
                (pendingSourceId
                  ? `Select target for transition from ${pendingSourceId}`
                  : "Select source state")}
              {mode === "select" && "Drag to move states, scroll to zoom"}
            </div>
          </div>
          <svg
            ref={svgRef}
            viewBox="0 0 900 600"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-[600px] border border-gray-200 rounded bg-gray-50"
          />
        </div>

        {isInspectorOpen && (
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-700">Inspector</h2>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600"
                aria-label="Close inspector"
                title="Close"
              >
                ×
              </button>
            </div>

            {!selected.type && (
              <div className="text-sm text-gray-500">
                Select a state or transition to edit it.
              </div>
            )}

            {selectedNode && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">State ID</div>
                  <div className="font-mono text-sm text-gray-800">{selectedNode.id}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={selectedNode.label ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNodes((prev) =>
                        prev.map((n) =>
                          String(n.id) === String(selectedNode.id) ? { ...n, label: v } : n
                        )
                      );
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!selectedNode.isStart}
                    onChange={(e) => {
                      if (e.target.checked) setSingleStart(selectedNode.id);
                      else {
                        // Allow turning off start; but keep at most one start.
                        setNodes((prev) =>
                          prev.map((n) =>
                            String(n.id) === String(selectedNode.id)
                              ? { ...n, isStart: false }
                              : n
                          )
                        );
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 font-medium">Start state</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!selectedNode.isAccepting}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setNodes((prev) =>
                        prev.map((n) =>
                          String(n.id) === String(selectedNode.id)
                            ? { ...n, isAccepting: checked }
                            : n
                        )
                      );
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 font-medium">Accepting state</span>
                </label>

                <button
                  onClick={deleteSelected}
                  className="w-full px-4 py-2 rounded font-medium border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                >
                  Delete state
                </button>
              </div>
            )}

            {selectedEdge && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Transition</div>
                  <div className="font-mono text-sm text-gray-800">
                    {selectedEdge.sourceId} → {selectedEdge.targetId}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={selectedEdge.label ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEdges((prev) =>
                        prev.map((ed) =>
                          String(ed.id) === String(selectedEdge.id)
                            ? { ...ed, label: v }
                            : ed
                        )
                      );
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {String(selectedEdge.sourceId) === String(selectedEdge.targetId) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loop position
                    </label>
                    <div className="flex gap-1">
                      {["top", "bottom", "left", "right"].map((dir) => (
                        <button
                          key={dir}
                          onClick={() =>
                            setEdges((prev) =>
                              prev.map((ed) =>
                                String(ed.id) === String(selectedEdge.id)
                                  ? { ...ed, loopDir: dir }
                                  : ed
                              )
                            )
                          }
                          className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors capitalize ${
                            (selectedEdge.loopDir || "top") === dir
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {dir}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={deleteSelected}
                  className="w-full px-4 py-2 rounded font-medium border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                >
                  Delete transition
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LaTeX settings + code generation (outside the automata editor component) */}
      <AutomataLatexPanel
        nodes={nodes}
        edges={edges}
        onImport={({ nodes: importedNodes, edges: importedEdges }) => {
          setNodes(importedNodes || []);
          setEdges(importedEdges || []);
          setSelected({ type: null, id: null });
          setPendingSourceId(null);
          setMode("select");

          // Ensure new interactive adds won't collide with imported ids.
          const maxQ = (importedNodes || [])
            .map((n) => String(n.id))
            .map((nid) => (nid.startsWith("q") ? asNumber(nid.slice(1), -1) : -1))
            .reduce((acc, v) => Math.max(acc, v), -1);
          const maxE = (importedEdges || [])
            .map((e) => String(e.id))
            .map((eid) => (eid.startsWith("e") ? asNumber(eid.slice(1), -1) : -1))
            .reduce((acc, v) => Math.max(acc, v), -1);
          nextNodeId.current = Math.max(nextNodeId.current, maxQ + 1);
          nextEdgeId.current = Math.max(nextEdgeId.current, maxE + 1);
        }}
      />

      <div className="w-full bg-white p-5 rounded-lg shadow mt-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          Automata Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={automataName}
              onChange={(e) => setAutomataName(e.target.value)}
              placeholder="Enter a name for your automata"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={automataDescription}
              onChange={(e) => setAutomataDescription(e.target.value)}
              placeholder="Enter a description for your automata"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={handleSave}
            disabled={!user || isSaving}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                <span>{isEditMode ? "Updating..." : "Saving..."}</span>
              </>
            ) : (
              <span>{isEditMode ? "Update Automata" : "Save Automata"}</span>
            )}
          </button>
          {!user && (
            <p className="text-sm text-red-500 mt-2">
              Please log in to save your automata
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FiniteStateAutomata;


