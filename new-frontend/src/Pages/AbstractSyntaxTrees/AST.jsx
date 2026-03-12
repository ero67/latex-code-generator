// NOTE DONE : AST : dat na vyber ci pri generovani maju byt ohranicene hodnoty v nodoch " $ $" ... matematickep pismo ci co
// NOTE DONE : AST : dat na vyber ako chcem mat otoceny strom
// TODO: AST : dat moznost pomenovat hrany (kill me pls)
//TODO:pomenovavanie hran uz viem pisat labele  do stredu hran uz len pridat logiku ze ked
//klikenm na link ta sa len zisti na ktory link som klikol a na zaklade user inputu dam ten label aj do mojej struktury

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import GeneratedCode from "../../Components/GeneratedCode";
import { LaTeXEditor } from "../../Components/LaTeXEditor";
import LatexImportModal from "../../Components/AST/LatexImportModal";

const API_URL = import.meta.env.VITE_API_URL || "/api";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { parseAstLatex } from "../../utils/astParser";

const SyntaxTreeD3 = () => {
  const forestFillColorOptions = [
    "red!20",
    "blue!20",
    "green!20",
    "yellow!20",
    "orange!20",
    "gray!20",
    "white",
    "red",
    "blue",
    "green",
    "yellow",
    "orange",
    "gray",
    "black",
  ];

  const forestTextColorOptions = [
    "black",
    "white",
    "red",
    "blue",
    "green",
    "orange",
    "gray",
    "brown",
    "purple",
    "cyan",
    "magenta",
  ];

  const [treeData, setTreeData] = useState(null);

  const [isChecked, setIsChecked] = useState(false);

  const svgRef = useRef();
  const zoomLayerRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const [showLaTeXEditor, setShowLaTeXEditor] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(
    "Your code will appear here \n after you click on Generate Code button"
  );

  const [nodeId, setNodeId] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null); // { sourceId, targetId }

  const [indexOfOrientation, setIndexOfOrientation] = useState(0);

  const [height, setHeight] = useState(100);

  const [svgHeight, setSvgHeight] = useState(100);

  const [includePreamble, setIncludePreamble] = useState(true);
  const [includeDocumentTags, setIncludeDocumentTags] = useState(true);

  //Saving vars
  const [treeName, setTreeName] = useState("");
  const [treeDescription, setTreeDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const { user } = useAuth();
  const { id } = useParams(); // Get tree ID from URL for edit mode
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const findNodeById = useCallback((node, targetId) => {
    if (!node) return null;
    if (node.id === targetId) return node;
    if (!node.children) return null;
    for (const child of node.children) {
      const found = findNodeById(child, targetId);
      if (found) return found;
    }
    return null;
  }, []);

  const ensureIds = useCallback(
    (root) => {
      if (!root) return { tree: root, nextId: 0 };
      if (root.id !== undefined && root.id !== null) {
        // already has ids
        const findMaxId = (node) => {
          let maxId = node.id ?? 0;
          if (node.children) {
            node.children.forEach((child) => {
              maxId = Math.max(maxId, findMaxId(child));
            });
          }
          return maxId;
        };
        return { tree: root, nextId: findMaxId(root) + 1 };
      }

      // assign ids recursively
      const cloned = JSON.parse(JSON.stringify(root));
      const assign = (node, next = 0) => {
        node.id = next;
        let max = next;
        if (node.children) {
          node.children.forEach((child) => {
            max = Math.max(max, assign(child, max + 1));
          });
        }
        return max;
      };
      const maxId = assign(cloned, 0);
      return { tree: cloned, nextId: maxId + 1 };
    },
    []
  );

  const selectedNode = useMemo(() => {
    if (!treeData || selectedNodeId === null) return null;
    return findNodeById(treeData, selectedNodeId);
  }, [findNodeById, selectedNodeId, treeData]);

  // Initialize zoom/pan once. We keep a dedicated layer for all rendered content.
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const zoomLayer = svg.append("g").attr("class", "ast-zoom-layer");
    zoomLayerRef.current = zoomLayer;

    const zoom = d3
      .zoom()
      .scaleExtent([0.25, 3])
      .on("zoom", (event) => {
        zoomLayer.attr("transform", event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);
    // Don't zoom on double-click; we reserve gestures for node interactions.
    svg.on("dblclick.zoom", null);
  }, []);

  // Define the calculateMaxWidth function with useCallback
  const calculateMaxWidth = useCallback((node) => {
    if (!node) return 0;

    let maxWidth = 0;
    const queue = [node]; // Initialize a queue with the root node

    while (queue.length > 0) {
      const levelSize = queue.length; // Number of elements at the current level
      maxWidth = Math.max(maxWidth, levelSize); // Update maxWidth if the current level is wider

      for (let i = 0; i < levelSize; i++) {
        const currentNode = queue.shift(); // Remove the current node from the queue

        // Add the children of the current node to the queue for the next level
        if (currentNode.children) {
          for (let child of currentNode.children) {
            queue.push(child);
          }
        }
      }
    }

    return maxWidth;
  }, []);

  // const [width, setWidth] = useState(100);
  useEffect(() => {
    if (!treeData) return;

    // Clear previous render (but keep zoom layer + zoom handler)
    const zoomLayer =
      zoomLayerRef.current ?? d3.select(svgRef.current).append("g");
    zoomLayer.selectAll("*").remove();

    // Create a tree layout
    const tree = d3.tree().size([600, 400]);

    // Create a root hierarchy from the data
    const root = d3.hierarchy(treeData);

    // Assign positions to each node
    tree(root);

    // Render into zoom layer so pan/zoom affects everything (nodes, links, labels)
    const svg = d3.select(zoomLayer.node ? zoomLayer.node() : zoomLayer);

    if (indexOfOrientation === 1) {
      renderLeftRightTree(svg, root, selectedNodeId);
    } else if (indexOfOrientation === 0) {
      renderTopDownTree(svg, root, selectedNodeId);
    } else if (indexOfOrientation === 2) {
      renderBottomUpTree(svg, root, 600, selectedNodeId);
    } else if (indexOfOrientation === 3) {
      renderRightToLeftTree(svg, root, 600, 600, selectedNodeId);
    }

    //////////////////////////////// for everything
    svg
      .selectAll(".link-label")
      .data(root.links())
      .enter()
      .append("text")
      .attr("class", "link-label")
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .call(setLabelPosition, indexOfOrientation, {
        width: 600,
        height: svgHeight,
      }) // Assuming SVG dimensions are constant
      .text((d) => d.target.data.label || "");
  });

  const removeNode = (nodeData) => {
    const deleteRecursively = (targetId, currentNode) => {
      if (!currentNode.children) return false;
      const index = currentNode.children.findIndex(
        (child) => child.id === targetId
      );

      if (index >= 0) {
        // Node is found
        currentNode.children.splice(index, 1); // Remove the node
        return true;
      } else {
        // Search in children
        currentNode.children.forEach((child) => {
          if (deleteRecursively(targetId, child)) {
            return true;
          }
        });
      }
      return false;
    };

    // Clone the tree data to ensure immutability
    const newTreeData = JSON.parse(JSON.stringify(treeData));
    if (newTreeData.id === nodeData.id) {
      // If the root is the node to remove
      setTreeData({}); // or handle differently if the root node can't be deleted
    } else {
      deleteRecursively(nodeData.id, newTreeData);
      setTreeData(newTreeData);
    }
  };

  function setLabelPosition(selection, orientation, svgDimensions) {
    selection.each(function (d) {
      let midX, midY;

      switch (orientation) {
        case 1: // Horizontal (Left-Right)
          midX = (d.source.x + d.target.x) / 2;
          midY = (d.source.y + d.target.y) / 2;
          d3.select(this)
            .attr("x", midY + 10)
            .attr("y", midX);
          break;
        case 0: // Vertical (Top-Down)
          midX = (d.source.x + d.target.x) / 2;
          midY = (d.source.y + d.target.y) / 2 + 10;
          d3.select(this).attr("x", midX).attr("y", midY);
          break;
        case 2: // Vertical (Bottom-Up)
          midX = (d.source.x + d.target.x) / 2;
          const midYInverted =
            svgDimensions.height - (d.source.y + d.target.y) / 2;
          d3.select(this)
            .attr("x", midX)
            .attr("y", midYInverted + 350);
          break;
        case 3: // Horizontal (Right-Left) and inverted vertically
          midX = (d.source.x + d.target.x) / 2;
          midY = (d.source.y + d.target.y) / 2;
          d3.select(this)
            .attr("x", svgDimensions.width - midY - 20)
            .attr("y", svgDimensions.height - midX + 500);
          break;
        default:
          break;
      }
    });
  }

  const latexColorToCss = (colorValue, fallback) => {
    if (!colorValue) return fallback;

    const value = String(colorValue).trim();
    if (!value) return fallback;

    const latexMixMatch = value.match(/^([a-zA-Z]+)!(\d{1,3})$/);
    if (!latexMixMatch) {
      return value;
    }

    const baseColor = latexMixMatch[1].toLowerCase();
    const percentage = Math.min(100, Math.max(0, Number(latexMixMatch[2])));
    const mix = percentage / 100;

    const baseRgbMap = {
      red: [255, 0, 0],
      blue: [0, 0, 255],
      green: [0, 128, 0],
      black: [0, 0, 0],
      white: [255, 255, 255],
      yellow: [255, 255, 0],
      orange: [255, 165, 0],
      gray: [128, 128, 128],
      grey: [128, 128, 128],
      brown: [165, 42, 42],
      purple: [128, 0, 128],
      cyan: [0, 255, 255],
      magenta: [255, 0, 255],
      pink: [255, 192, 203],
    };

    const base = baseRgbMap[baseColor];
    if (!base) return fallback;

    const r = Math.round(base[0] * mix + 255 * (1 - mix));
    const g = Math.round(base[1] * mix + 255 * (1 - mix));
    const b = Math.round(base[2] * mix + 255 * (1 - mix));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const ensureArrowMarker = (svg) => {
    let defs = svg.select("defs");
    if (defs.empty()) {
      defs = svg.append("defs");
    }

    if (defs.select("#ast-arrowhead").empty()) {
      defs
        .append("marker")
        .attr("id", "ast-arrowhead")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 9)
        .attr("refY", 5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto-start-reverse")
        .append("path")
        .attr("d", "M 0 0 L 10 5 L 0 10 z")
        .attr("fill", "#ADADAD");
    }
  };

  const edgeDashArray = (edgeStyle) => {
    if (edgeStyle === "dashed") return "8,6";
    if (edgeStyle === "dotted") return "2,6";
    return null;
  };

  const edgeStrokeWidth = (edgeStyle) => (edgeStyle === "thick" ? 6 : 4);

  const renderNodeShapeAndLabel = (nodes, selectedId) => {
    const circles = nodes.filter((d) => d.data.shape !== "box");
    circles
      .append("circle")
      .attr("r", 15)
      .attr("stroke", (d) => (d.data.id === selectedId ? "#2563eb" : "black"))
      .attr("stroke-width", (d) => (d.data.id === selectedId ? 3 : 1))
      .attr("fill", (d) => latexColorToCss(d.data.fillColor, "white"));

    const boxes = nodes.filter((d) => d.data.shape === "box");
    boxes
      .append("rect")
      .attr("x", -20)
      .attr("y", -15)
      .attr("width", 40)
      .attr("height", 30)
      .attr("stroke", (d) => (d.data.id === selectedId ? "#2563eb" : "black"))
      .attr("stroke-width", (d) => (d.data.id === selectedId ? 3 : 1))
      .attr("fill", (d) => latexColorToCss(d.data.fillColor, "white"));

    nodes
      .append("text")
      .attr("x", 0)
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .attr("fill", (d) => latexColorToCss(d.data.textColor, "black"))
      .text((d) => d.data.value);
  };

  function renderRightToLeftTree(svg, root, svgWidth, svgHeight, selectedId) {
    ensureArrowMarker(svg);

    // Draw the links (edges) between nodes
    svg
      .selectAll("path.link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#ADADAD")
      .attr("stroke-width", (d) => edgeStrokeWidth(d.target.data.edgeStyle))
      .attr("stroke-dasharray", (d) => edgeDashArray(d.target.data.edgeStyle))
      .attr("marker-end", (d) =>
        d.target.data.isArrow ? "url(#ast-arrowhead)" : null
      )
      .attr(
        "d",
        d3
          .linkHorizontal()
          .x((d) => svgWidth - (d.y + 5)) // Invert x-coordinate for right-to-left
          .y((d) => svgHeight - d.x)
      ) // Invert y-coordinate for bottom-up
      .on("click", (event, d) => handleLinkClick(event, d)); // Pass both event and link data

    // Draw the nodes
    const nodes = svg
      .selectAll("g.node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr(
        "transform",
        (d) => `translate(${svgWidth - (d.y + 20)},${svgHeight - d.x})`
      ) // Invert both x and y coordinates
      .on("click", (event, d) => handleNodeClick(event, d))
      .on("contextmenu", (event, d) => {
        event.preventDefault(); // Prevent the browser context menu from opening
        removeNode(d.data); // Call removeNode passing the data of the node to be removed
      });

    renderNodeShapeAndLabel(nodes, selectedId);
  }

  function renderLeftRightTree(svg, root, selectedId) {
    ensureArrowMarker(svg);

    // Draw the links (edges) between nodes
    svg
      .selectAll("path.link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#ADADAD")
      .attr("stroke-width", (d) => edgeStrokeWidth(d.target.data.edgeStyle))
      .attr("stroke-dasharray", (d) => edgeDashArray(d.target.data.edgeStyle))
      .attr("marker-end", (d) =>
        d.target.data.isArrow ? "url(#ast-arrowhead)" : null
      )
      .attr(
        "d",
        d3
          .linkHorizontal()
          .x((d) => d.y + 5)
          .y((d) => d.x)
      )
      .on("click", (event, d) => handleLinkClick(event, d));

    // Draw the nodes
    const nodes = svg
      .selectAll("g.node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.y + 20},${d.x})`)
      .on("click", (event, d) => handleNodeClick(event, d))
      .on("contextmenu", (event, d) => {
        event.preventDefault(); // Prevent the browser context menu from opening
        removeNode(d.data); // Call removeNode passing the data of the node to be removed
      });

    renderNodeShapeAndLabel(nodes, selectedId);
  }

  function renderTopDownTree(svg, root, selectedId) {
    ensureArrowMarker(svg);

    // Draw the links (edges) between nodes
    svg
      .selectAll("path.link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#ADADAD")
      .attr("stroke-width", (d) => edgeStrokeWidth(d.target.data.edgeStyle))
      .attr("stroke-dasharray", (d) => edgeDashArray(d.target.data.edgeStyle))
      .attr("marker-end", (d) =>
        d.target.data.isArrow ? "url(#ast-arrowhead)" : null
      )
      .attr(
        "d",
        d3
          .linkVertical()
          .x((d) => d.x)
          .y((d) => d.y + 5)
      )
      .on("click", (event, d) => handleLinkClick(event, d)); // Pass both event and link data

    // Draw the nodes
    const nodes = svg
      .selectAll("g.node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y + 20})`)
      .on("click", (event, d) => handleNodeClick(event, d))
      .on("contextmenu", (event, d) => {
        event.preventDefault(); // Prevent the browser context menu from opening
        removeNode(d.data); // Call removeNode passing the data of the node to be removed
      });

    renderNodeShapeAndLabel(nodes, selectedId);
  }

  function renderBottomUpTree(svg, root, svgHeight, selectedId) {
    ensureArrowMarker(svg);

    // Draw the links (edges) between nodes
    const svgHeightNew = svgHeight - 150;
    svg
      .selectAll("path.link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#ADADAD")
      .attr("stroke-width", (d) => edgeStrokeWidth(d.target.data.edgeStyle))
      .attr("stroke-dasharray", (d) => edgeDashArray(d.target.data.edgeStyle))
      .attr("marker-end", (d) =>
        d.target.data.isArrow ? "url(#ast-arrowhead)" : null
      )
      .attr(
        "d",
        d3
          .linkVertical()
          .x((d) => d.x) // x-coordinates stay the same
          .y((d) => svgHeightNew - (d.y + 5)) // Invert y-coordinates for bottom-up
      )
      .on("click", (event, d) => handleLinkClick(event, d)); // Pass both event and link data

    // Draw the nodes
    const nodes = svg
      .selectAll("g.node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr(
        "transform",
        (d) => `translate(${d.x},${svgHeightNew - (d.y + 20)})`
      ) // Invert y-coordinates for bottom-up
      .on("click", (event, d) => handleNodeClick(event, d))
      .on("contextmenu", (event, d) => {
        event.preventDefault(); // Prevent the browser context menu from opening
        removeNode(d.data); // Call removeNode passing the data of the node to be removed
      });

    renderNodeShapeAndLabel(nodes, selectedId);
  }

  function calculateDepth(node, currentDepth = 0) {
    if (!node || !node.children || node.children.length === 0) {
      return currentDepth;
    }
    return Math.max(
      ...node.children.map((child) => calculateDepth(child, currentDepth + 1))
    );
  }

  const handleNodeClick = useCallback(
    (event, node) => {
      // event.stopPropagation(); // Prevent propagation to the parent SVG
      if (node?.data?.id !== undefined && node?.data?.id !== null) {
        setSelectedNodeId(node.data.id);
        setSelectedEdge(null);
      }
      // Normal click now just selects; use Inspector to add children.
    },
    [treeData]
  );

  useEffect(() => {
    const loadTreeData = async () => {
      if (id && user) {
        try {
          const response = await axios.get(
            `${API_URL}/ast/${id}`
          );
          const loadedTree = response.data.data;

          const ensured = ensureIds(loadedTree.treeData);
          setTreeData(ensured.tree);
          setTreeName(loadedTree.name || "");
          setTreeDescription(loadedTree.description || "");
          setIsChecked(loadedTree.settings.isChecked);
          setIndexOfOrientation(loadedTree.settings.indexOfOrientation);
          setIncludePreamble(loadedTree.settings.includePreamble);
          setIncludeDocumentTags(loadedTree.settings.includeDocumentTags);

          // Find highest node ID to continue numbering
          const findMaxId = (node) => {
            let maxId = node.id || 0;
            if (node.children) {
              node.children.forEach((child) => {
                maxId = Math.max(maxId, findMaxId(child));
              });
            }
            return maxId;
          };
          setNodeId(findMaxId(ensured.tree) + 1);
          setSelectedNodeId(null);
        } catch (error) {
          console.error("Error loading tree:", error);
        }
      }
    };

    loadTreeData();
  }, [id, user]);

  // Auto-import LaTeX code from Image-to-LaTeX page
  useEffect(() => {
    // Only auto-import on create pages (not edit pages)
    if (isEditMode) {
      return;
    }

    const storageKey = "pendingLatexImport_Abstract Syntax Tree";
    const pendingLatexCode = sessionStorage.getItem(storageKey);

    if (pendingLatexCode) {
      try {
        const tree = parseAstLatex(pendingLatexCode);
        handleImportFromLatex(tree);
        sessionStorage.removeItem(storageKey);
        toast.success("LaTeX code imported successfully from Image-to-LaTeX!");
      } catch (error) {
        console.error("Error auto-importing LaTeX code:", error);
        toast.error(`Error importing LaTeX code: ${error.message}`);
        sessionStorage.removeItem(storageKey);
      }
    }
  }, [isEditMode]);

  const handleOrientationClick = () => {
    if (indexOfOrientation === 0) {
      setIndexOfOrientation(1);
    } else if (indexOfOrientation === 1) {
      setIndexOfOrientation(2);
    } else if (indexOfOrientation === 2) {
      setIndexOfOrientation(3);
    } else if (indexOfOrientation === 3) {
      setIndexOfOrientation(0);
    }
  };

  const handleLinkClick = useCallback(
    (event, link) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      setSelectedNodeId(null);
      setSelectedEdge({
        sourceId: link.source.data.id,
        targetId: link.target.data.id,
      });
    },
    [treeData]
  );

  const handleCreateTree = () => {
    if (treeData && !window.confirm("Replace the current tree with a new root?")) {
      return;
    }
    setHeight(100);
    setTreeData({ id: 0, value: "", children: [], label: "" });
    setNodeId(1);
    setSelectedNodeId(0);
    setSelectedEdge(null);
  };

  const handleImportFromLatex = (tree) => {
    // Expect tree: { value, children: [...] }
    const ensured = ensureIds(tree);
    setTreeData(ensured.tree);
    // Reset nodeId to avoid id collisions when user adds new nodes
    const assignIds = (node, nextId = 0) => {
      node.id = nextId;
      let maxId = nextId;
      if (node.children) {
        node.children.forEach((child) => {
          maxId = Math.max(maxId, assignIds(child, maxId + 1));
        });
      }
      return maxId;
    };
    const maxId = assignIds(ensured.tree, 0);
    setNodeId(maxId + 1);
    setSelectedNodeId(0);
    setSelectedEdge(null);
  };

  const updateSelectedNodeField = (field, value) => {
    if (!treeData || !selectedNode) return;
    const cloned = JSON.parse(JSON.stringify(treeData));
    const target = findNodeById(cloned, selectedNode.id);
    if (!target) return;

    if (value === "") {
      delete target[field];
    } else {
      target[field] = value;
    }

    setTreeData(cloned);
  };

  const generateLatexCode = (node, parentLabel = null) => {
    if (!node) {
      return "";
    }
    let nodeLabel = isChecked ? `$${node.value}$` : node.value;
    const nodeOptions = [];

    if (node.shape === "circle") {
      nodeOptions.push("circle", "draw");
    } else if (node.shape === "box") {
      nodeOptions.push("draw");
    }

    if (node.fillColor) {
      nodeOptions.push(`fill=${node.fillColor}`);
    }

    if (node.textColor) {
      nodeOptions.push(`text=${node.textColor}`);
    }

    if (parentLabel) {
      // Use parentLabel.position to set the label's position dynamically
      nodeOptions.push(
        `edge label={node[midway,${parentLabel.position},font=\\scriptsize,inner sep=1pt]{${parentLabel.text}}}`
      );
    }

    const edgeOptions = [];
    if (["dashed", "dotted", "thick"].includes(node.edgeStyle)) {
      edgeOptions.push(node.edgeStyle);
    }
    if (node.isArrow) {
      edgeOptions.push("->");
    }
    if (edgeOptions.length > 0) {
      nodeOptions.push(`edge={${edgeOptions.join(", ")}}`);
    }

    let latexCode = "[\n  " + nodeLabel;
    if (nodeOptions.length > 0) {
      latexCode += ", " + nodeOptions.join(", ");
    }

    if (node.children && node.children.length > 0) {
      const childStrings = node.children.map((child, index, array) => {
        let position;
        if (array.length === 2) {
          // If there are exactly two children, position labels left and right respectively
          position = index === 0 ? "left" : "right";
        } else {
          // If there are more than two children, position labels left for all except the last one
          position = index === array.length - 1 ? "right" : "left";
        }
        let childLabel = child.label
          ? { text: child.label, position: position }
          : null;
        return generateLatexCode(child, childLabel);
      });
      latexCode += childStrings.join("\n").replace(/^/gm, "  ");
    }

    latexCode += "\n]";

    return latexCode;
  };

  const handleGenerateLatex = () => {
    let latexCode = "";
    // Check if the preamble should be included
    if (includePreamble) {
      latexCode += "\\documentclass{article}\n\\usepackage{forest}\n";
      // if (includeDocumentTags) {
      latexCode += "\\begin{document}\n";
      // }
    } else if (includeDocumentTags) {
      latexCode += "\\usepackage{forest}\n";
    }

    // Add the forest environment with configuration based on orientation
    // if (includeDocumentTags) {
    latexCode += "\\begin{forest}\n";
    // }

    switch (indexOfOrientation) {
      case 0:
        latexCode += `${generateLatexCode(treeData)}\n`;
        break;
      case 1:
        latexCode += `for tree ={grow'= 0,}\n${generateLatexCode(treeData)}\n`;
        break;
      case 2:
        latexCode += `for tree ={grow'= 90,}\n${generateLatexCode(treeData)}\n`;
        break;
      case 3:
        latexCode += `for tree={grow'=180,}\n${generateLatexCode(treeData)}\n`;
        break;
      default:
        break;
    }

    // if (includeDocumentTags) {
    latexCode += "\\end{forest}\n";
    // }

    // Check if document end should be included
    if (includePreamble) {
      latexCode += "\\end{document}";
    }

    setGeneratedCode(latexCode);
  };

  const handleSave = async () => {
    if (!user || !treeData) {
      toast.error("Please log in and create a tree first");
      return;
    }

    if (!treeName.trim()) {
      toast.error("Please enter a name for your tree");
      return;
    }

    setIsSaving(true);
    try {
      const treeToSave = {
        name: treeName,
        description: treeDescription,
        treeData: treeData,
        settings: {
          isChecked,
          indexOfOrientation,
          includePreamble,
          includeDocumentTags,
        },
        userId: user.id,
      };

      if (isEditMode) {
        // Update existing tree
        await axios.put(`${API_URL}/ast/${id}`, treeToSave);
        toast.success("Tree updated successfully!");
      } else {
        // Create new tree
        const response = await axios.post(
          `${API_URL}/ast`,
          treeToSave
        );
        toast.success("Tree saved successfully!");
        // Navigate to edit mode with the new tree ID
        navigate(`/ast/edit/${response.data.data._id}`);
      }
    } catch (error) {
      console.error("Error saving tree:", error);
      toast.error("Failed to save tree. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Abstract Syntax Tree
      </h1>

      {/* Instructions Section */}
      <div className="w-full mb-6 bg-white p-5 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          How to use?
        </h2>
        <div className="space-y-2 text-gray-600">
          <p>
            <span className="font-bold text-blue-600">1.</span> Click on Create
            Tree button and type in the value of the root node.
          </p>
          <p>
            <span className="font-bold text-blue-600">2.</span> Click on the
            node you want to select. Use the Inspector to edit it or add children.
          </p>
          <p>
            <span className="font-bold text-blue-600">3.</span> Click an edge
            to select it, then edit the label in the Inspector.
          </p>
          <p>
            <span className="font-bold text-blue-600">4.</span> Using Turn Left
            button you can turn the tree 90 degrees to the left.
          </p>
          <p>
            <span className="font-bold text-blue-600">5.</span> By using right
            click on the node you can remove the node from the tree structure.
          </p>
          <p>
            <span className="font-bold text-blue-600">6.</span> Use mouse wheel
            to zoom and drag the background to pan the canvas.
          </p>
        </div>
      </div>

      {/* Tree Configuration Section */}
      <div className="w-full mb-6 bg-white p-5 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          Tree Configuration
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            id="createTree"
            onClick={handleCreateTree}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Add Root Node</span>
          </button>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="math"
              name="math"
              value="math"
              checked={isChecked}
              onChange={() => setIsChecked(!isChecked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600 font-medium">
              Mathematical font
            </span>
          </label>

          <button
            id="buttonMath"
            onClick={handleOrientationClick}
            className="px-4 py-2 bg-gray-100 text-gray-800 font-medium rounded border border-gray-300 hover:bg-gray-200 transition-colors flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16l-4-4m0 0l4-4m-4 4h18"
              />
            </svg>
            <span>Turn Left</span>
          </button>

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
            Zoom In
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
            Zoom Out
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
            Reset View
          </button>
        </div>
      </div>
      <LatexImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportFromLatex}
      />

      {/* Tree Visualization Container */}
      <div className="w-full mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-auto p-4">
          <svg
            ref={svgRef}
            width={600}
            height={600}
            className="border border-gray-200 rounded block mx-auto"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-700">Inspector</h2>
            {(selectedNodeId !== null || selectedEdge !== null) && (
              <button
                onClick={() => {
                  setSelectedNodeId(null);
                  setSelectedEdge(null);
                }}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {!treeData ? (
            <div className="text-sm text-gray-500">Create or import a tree to begin.</div>
          ) : selectedEdge ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Edge</div>
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
                  value={
                    (() => {
                      const src = findNodeById(treeData, selectedEdge.sourceId);
                      const child =
                        src?.children?.find((c) => c.id === selectedEdge.targetId) || null;
                      return child?.label ?? "";
                    })()
                  }
                  onChange={(e) => {
                    const newLabel = e.target.value;
                    const updateLabel = (node, sourceId, targetId) => {
                      if (!node) return;
                      if (node.id === sourceId && node.children) {
                        node.children = node.children.map((child) =>
                          child.id === targetId ? { ...child, label: newLabel } : child
                        );
                      }
                      if (node.children) node.children.forEach((c) => updateLabel(c, sourceId, targetId));
                    };
                    const cloned = JSON.parse(JSON.stringify(treeData));
                    updateLabel(cloned, selectedEdge.sourceId, selectedEdge.targetId);
                    setTreeData(cloned);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="text-xs text-gray-500">
                Tip: Click a node or edge in the canvas to edit it here.
              </div>
            </div>
          ) : !selectedNode ? (
            <div className="text-sm text-gray-500">
              Click a node in the canvas to select it.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Node ID</div>
                <div className="font-mono text-sm text-gray-800">
                  {selectedNode.id}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="text"
                  value={selectedNode.value ?? ""}
                  onChange={(e) => {
                    updateSelectedNodeField("value", e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shape
                </label>
                <select
                  value={selectedNode.shape ?? ""}
                  onChange={(e) => updateSelectedNodeField("shape", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Default (none)</option>
                  <option value="circle">Circle</option>
                  <option value="box">Box</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fill Color (forest)
                </label>
                <select
                  value={selectedNode.fillColor ?? ""}
                  onChange={(e) => updateSelectedNodeField("fillColor", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Default (none)</option>
                  {forestFillColorOptions.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text Color (forest)
                </label>
                <select
                  value={selectedNode.textColor ?? ""}
                  onChange={(e) => updateSelectedNodeField("textColor", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Default (none)</option>
                  {forestTextColorOptions.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edge Style to Parent
                </label>
                <select
                  value={selectedNode.edgeStyle ?? ""}
                  onChange={(e) => updateSelectedNodeField("edgeStyle", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Default (none)</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="thick">Thick</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={Boolean(selectedNode.isArrow)}
                  onChange={(e) =>
                    updateSelectedNodeField("isArrow", e.target.checked ? true : "")
                  }
                />
                <span>Arrow on edge to parent</span>
              </label>

              <div className="text-xs text-gray-500">
                These options affect generated LaTeX (`forest`) for this node.
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const cloned = JSON.parse(JSON.stringify(treeData));
                    const target = findNodeById(cloned, selectedNode.id);
                    if (!target) return;
                    const newNode = {
                      id: nodeId,
                      value: "",
                      children: [],
                      label: "",
                    };
                    target.children = target.children || [];
                    target.children.push(newNode);
                    setNodeId(nodeId + 1);
                    setTreeData(cloned);
                    setSelectedNodeId(selectedNode.id);
                  }}
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

                    const removeById = (targetId, currentNode) => {
                      if (!currentNode.children) return;
                      currentNode.children = currentNode.children.filter(
                        (c) => c.id !== targetId
                      );
                      currentNode.children.forEach((c) =>
                        removeById(targetId, c)
                      );
                    };
                    const cloned = JSON.parse(JSON.stringify(treeData));
                    removeById(selectedNode.id, cloned);
                    setTreeData(cloned);
                    setSelectedNodeId(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Delete Node
                </button>
              </div>

              <div className="text-xs text-gray-500">
                Tip: Right-click a node to delete quickly.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LaTeX Settings */}
      <div className="w-full bg-gray-100 p-4 rounded-lg shadow-sm mb-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">
          LaTeX Settings
        </h3>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="includePreamble"
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
              id="includeDocumentTags"
              checked={includeDocumentTags}
              onChange={() => setIncludeDocumentTags(!includeDocumentTags)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600 font-medium">
              Include import of the forest package
            </span>
          </label>
        </div>
      </div>

      {/* Import + Generate Buttons (match Proof Trees layout) */}
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <button
          onClick={() => setShowImportModal(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors flex items-center"
          data-umami-event="Import AST from LaTeX button"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          <span>Import LaTeX</span>
        </button>
        <button
          id="generateBtn"
          onClick={handleGenerateLatex}
          className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 transition-colors flex items-center"
          data-umami-event="Generate AST LaTeX button"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          <span>Generate LaTeX</span>
        </button>
      </div>

      {/* Generated Code */}
      {generatedCode && (
        <div className="w-full mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Generated LaTeX Code</h3>
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
            <GeneratedCode id="generatedCode" code={generatedCode} />
          )}
        </div>
      )}
      {/* Tree Metadata Section */}
      <div className="w-full bg-white p-5 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">
          Tree Information
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
              placeholder="Enter a name for your tree"
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
              placeholder="Enter a description for your tree"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Save/Update Button */}
      <div className="mb-8">
        <button
          onClick={handleSave}
          disabled={!user || !treeData || isSaving}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
          data-umami-event={isEditMode ? "Update AST button" : "Save AST button"}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              <span>{isEditMode ? "Updating..." : "Saving..."}</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span>{isEditMode ? "Update Tree" : "Save Tree"}</span>
            </>
          )}
        </button>
        {!user && (
          <p className="text-sm text-red-500 mt-2">
            Please log in to save your tree
          </p>
        )}
      </div>
    </div>
  );
};

export default SyntaxTreeD3;
