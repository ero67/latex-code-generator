import React, { useState, useEffect } from "react";
import { FaLevelDownAlt, FaMinus, FaPlus, FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import "../index.css";
import GeneratedCode from "../../Components/GeneratedCode";
import { LaTeXEditor } from "../../Components/LaTeXEditor";
import LatexInput from "../../Components/LatexInput";
import ProofTreeInstructions from "../../Components/ProofTree/ProofTreeInstructions";
import LatexImportModal from "../../Components/ProofTree/LatexImportModal";
import { useParams, useNavigate } from "react-router-dom";
import { proofTreeService } from "../../services/prooftree.service";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { parseLatexToProofTree } from "../../utils/latexParser";
import { buildGeometryLine } from "../../utils/latexGeometry";
import { useTranslation } from 'react-i18next';

const findNodeById = (node, targetId) => {
  if (!node) return null;
  if (node.id === targetId) return node;
  for (const child of node.children || []) {
    const found = findNodeById(child, targetId);
    if (found) return found;
  }
  return null;
};

const findParentOfNode = (node, targetId, parent = null) => {
  if (!node) return null;
  if (node.id === targetId) return parent;
  for (const child of node.children || []) {
    const found = findParentOfNode(child, targetId, node);
    if (found) return found;
  }
  return null;
};

const isDescendant = (node, targetId) => {
  if (!node) return false;
  if (node.id === targetId) return true;
  return (node.children || []).some((child) => isDescendant(child, targetId));
};

const detachNode = (clonedRoot, nodeId) => {
  const node = findNodeById(clonedRoot, nodeId);
  const parent = findParentOfNode(clonedRoot, nodeId);
  if (!node || !parent) return null;

  const index = parent.children.findIndex((c) => c.id === nodeId);
  if (index === -1) return null;

  parent.children.splice(index, 1, ...(node.children || []));
  node.children = [];

  return { detachedNode: node, parentNode: parent, originalIndex: index };
};

// --- DATA STRUCTURE ---
let nodeId = 0;
const createProofTreeNode = (
  content = "",
  children = [],
  rightLabel = "",
  mathMode = false
) => {
  return { id: nodeId++, content, children, rightLabel, mathMode };
};

// --- (CORRECTED) SVG VISUALIZATION COMPONENT ---
const ProofTreeVisualizer = ({
  node,
  onNodeClick,
  onAddChild,
  onRemoveNode,
  selectedNodeId,
  zoom = 1,
}) => {
  const CONTROL_RADIUS = 10;
  const CONTROL_GAP = 15;
  const REMOVE_VERTICAL_OFFSET = 22;
  const RIGHT_MARGIN = 10;
  const ID_BADGE_RADIUS = 10;
  const LEFT_BADGE_GAP = 15;

  // Estimate how wide a node box should be based on its displayed text.
  // SVG text measurement via refs/getBBox gets tricky in a recursive render,
  // so we use a stable monospace-based approximation.
  const estimateNodeBoxWidth = (node) => {
    const text = node?.content ? String(node.content) : "[Empty]";
    // Rough monospace character width in px for the current font size.
    const CHAR_PX = 8;
    const H_PADDING_PX = 30; // total horizontal padding inside the rect
    const MIN_W = 150;
    const MAX_W = 420;
    const estimated = text.length * CHAR_PX + H_PADDING_PX;
    return Math.max(MIN_W, Math.min(MAX_W, estimated));
  };

  const calculateTreeDimensions = (node) => {
    const nodeBoxWidth = estimateNodeBoxWidth(node);
    const controlsWidth = CONTROL_GAP + CONTROL_RADIUS + RIGHT_MARGIN;
    const leftBadgeWidth = LEFT_BADGE_GAP + ID_BADGE_RADIUS + RIGHT_MARGIN;
    const nodeFootprintWidth =
      nodeBoxWidth + controlsWidth + leftBadgeWidth + RIGHT_MARGIN;

    if (!node.children || node.children.length === 0) {
      return { width: nodeFootprintWidth, height: 50 };
    }
    const childDimensions = node.children.map(calculateTreeDimensions);
    const totalChildWidth = childDimensions.reduce(
      (sum, dim) => sum + dim.width,
      0
    );
    const maxChildHeight = Math.max(
      ...childDimensions.map((dim) => dim.height)
    );
    const horizontalPadding = (node.children.length - 1) * 20;
    // Ensure the parent node box fits too, not just the children spread.
    let width = Math.max(nodeFootprintWidth, totalChildWidth + horizontalPadding);
    if (node.rightLabel && node.children.length > 0) {
      width += 150;
    }
    return {
      width: width,
      height: maxChildHeight + 80,
    };
  };

  const renderTree = (node, x, y, availableWidth) => {
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const elements = [];
    // Match the rect width to the (estimated) text width, while keeping
    // it within the available render width for this subtree.
    const nodeWidth = Math.min(estimateNodeBoxWidth(node), availableWidth * 0.95);

    // ✨ FIX: Declare totalChildAreaWidth here, in the outer scope, with a default value.
    let totalChildAreaWidth = 0;

    if (hasChildren) {
      const childY = y - 80;
      const childCount = node.children.length;

      // ✨ FIX: Assign the calculated value to the variable in the outer scope.
      totalChildAreaWidth =
        node.children.reduce(
          (acc, child) => acc + calculateTreeDimensions(child).width,
          0
        ) +
        (childCount - 1) * 20;

      let currentChildRenderX = x - totalChildAreaWidth / 2;

      node.children.forEach((child) => {
        const childDim = calculateTreeDimensions(child);
        const childCenterX = currentChildRenderX + childDim.width / 2;
        elements.push(
          ...renderTree(child, childCenterX, childY, childDim.width)
        );
        currentChildRenderX += childDim.width + 20;
      });

      elements.push(
        <line
          key={`hline-${node.id}`}
          x1={x - totalChildAreaWidth / 2}
          y1={y - 5}
          x2={x + totalChildAreaWidth / 2}
          y2={y - 5}
          stroke="#333"
          strokeWidth={2}
        />
      );
    }

    elements.push(
      <g
        key={`group-${node.id}`}
        onClick={() => onNodeClick(node.id)}
        className="cursor-pointer"
      >
        <rect
          key={`rect-${node.id}`}
          x={x - nodeWidth / 2}
          y={y}
          width={nodeWidth}
          height={40}
          fill={isSelected ? "#e3f2fd" : "#fff"}
          stroke={isSelected ? "#1976d2" : "#ccc"}
          strokeWidth={isSelected ? 2 : 1}
          rx={5}
        />
        <text
          key={`text-${node.id}`}
          x={x}
          y={y + 25}
          textAnchor="middle"
          className="text-sm font-mono select-none"
          fill="#333"
        >
          {node.content || "[Empty]"}
        </text>
      </g>
    );

    elements.push(
      <g key={`controls-${node.id}`}>
        <g transform={`translate(${x - nodeWidth / 2 - LEFT_BADGE_GAP}, ${y + 20})`}>
          <circle r={ID_BADGE_RADIUS} fill={isSelected ? "#2563eb" : "#64748b"} />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            className="select-none text-[9px] font-bold fill-white"
          >
            {node.id}
          </text>
        </g>

        <g
          transform={`translate(${x + nodeWidth / 2 + CONTROL_GAP}, ${y + 20})`}
          onClick={(event) => {
            event.stopPropagation();
            onAddChild(node.id);
          }}
          className={`cursor-pointer ${
            node.children.length >= 5 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          <circle r={CONTROL_RADIUS} fill="#16a34a" />
          <foreignObject x="-6" y="-6" width="12" height="12">
            <div className="flex h-full w-full items-center justify-center text-[10px] text-white">
              <FaPlus />
            </div>
          </foreignObject>
        </g>

        {node.id !== 0 && (
          <g
            transform={`translate(${x + nodeWidth / 2 + CONTROL_GAP}, ${y + 20 + REMOVE_VERTICAL_OFFSET})`}
            onClick={(event) => {
              event.stopPropagation();
              onRemoveNode(node.id);
            }}
            className="cursor-pointer"
          >
            <circle r={CONTROL_RADIUS} fill="#dc2626" />
            <foreignObject x="-6" y="-6" width="12" height="12">
              <div className="flex h-full w-full items-center justify-center text-[10px] text-white">
                <FaMinus />
              </div>
            </foreignObject>
          </g>
        )}
      </g>
    );

    // This logic will now work correctly because totalChildAreaWidth is in scope.
    if (hasChildren && node.rightLabel) {
      elements.push(
        <text
          key={`label-${node.id}`}
          x={x + totalChildAreaWidth / 2 + 10}
          y={y - 5}
          textAnchor="start"
          className="text-xs font-mono fill-gray-600"
        >
          ({node.rightLabel})
        </text>
      );
    }

    return elements;
  };

  const dimensions = calculateTreeDimensions(node);
  const viewboxWidth = dimensions.width + 80;
  const viewboxHeight = dimensions.height + 40;

  return (
    <div className="w-full overflow-auto bg-gray-50 p-4 rounded-lg border-2 border-dashed" style={{ height: 500, resize: "both", minHeight: 200, minWidth: 300 }}>
      <div className="flex items-end justify-center" style={{ minWidth: "100%", minHeight: "100%" }}>
        <svg
          width={viewboxWidth * zoom}
          height={viewboxHeight * zoom}
          viewBox={`0 0 ${viewboxWidth} ${viewboxHeight}`}
          className="overflow-visible"
        >
          {renderTree(
            node,
            viewboxWidth / 2,
            viewboxHeight - 60,
            dimensions.width
          )}
        </svg>
      </div>
    </div>
  );
};
// --- MAIN PROOFTREE COMPONENT ---
const ProofTree = () => {
  const { t } = useTranslation();
  const [rootNode, setRootNode] = useState(createProofTreeNode());
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showLaTeXEditor, setShowLaTeXEditor] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [math_notation, setMathNotation] = useState(false);
  const [includePreamble, setIncludePreamble] = useState(true);
  const [includeDocumentTags, setIncludeDocumentTags] = useState(true);
  const [paperSize, setPaperSize] = useState("a4paper");
  const [landscape, setLandscape] = useState(false);
  const [treeName, setTreeName] = useState("");
  const [treeDescription, setTreeDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [shouldAutoFocusNodeInput, setShouldAutoFocusNodeInput] = useState(false);
  const [moveTargetId, setMoveTargetId] = useState("");
  const [movePlacement, setMovePlacement] = useState("above");
  const [treeZoom, setTreeZoom] = useState(1);

  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // --- Tree Manipulation Functions (Unchanged) ---
  const addNode = (parentId) => {
    const stack = [rootNode];
    while (stack.length > 0) {
      const currentNode = stack.pop();
      if (currentNode.id === parentId && currentNode.children.length < 5) {
        currentNode.children.push(createProofTreeNode());
        setRootNode({ ...rootNode });
        return;
      }
      currentNode.children.forEach((child) => stack.push(child));
    }
  };

  const removeNode = (nodeIdToRemove) => {
    const newRoot = JSON.parse(JSON.stringify(rootNode));
    const parentNode = findParentOfNode(newRoot, nodeIdToRemove);
    if (!parentNode) return;

    const childIndex = parentNode.children.findIndex(
      (child) => child.id === nodeIdToRemove
    );
    if (childIndex === -1) return;

    const nodeToRemove = parentNode.children[childIndex];
    parentNode.children.splice(childIndex, 1, ...(nodeToRemove.children || []));
    setRootNode(newRoot);

    if (selectedNodeId === nodeIdToRemove) {
      if (nodeToRemove.children?.length > 0) {
        setSelectedNodeId(nodeToRemove.children[0].id);
      } else {
        setSelectedNodeId(parentNode.id);
      }
    }
  };

  const moveNodeRelativeToTarget = (sourceNodeId, targetNodeId, placement) => {
    if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId) return;

    const newRoot = JSON.parse(JSON.stringify(rootNode));
    const sourceNode = findNodeById(newRoot, sourceNodeId);
    const sourceParent = findParentOfNode(newRoot, sourceNodeId);

    if (!sourceNode || !sourceParent) return;
    if (isDescendant(sourceNode, targetNodeId)) {
      toast.error(t('proof_tree.cannot_move_subtree'));
      return;
    }

    const sourceIndex = sourceParent.children.findIndex(
      (child) => child.id === sourceNodeId
    );
    if (sourceIndex === -1) return;

    sourceParent.children.splice(sourceIndex, 1, ...(sourceNode.children || []));
    sourceNode.children = [];

    const refreshedTargetNode = findNodeById(newRoot, targetNodeId);
    const refreshedTargetParent = findParentOfNode(newRoot, targetNodeId);

    if (!refreshedTargetNode) {
      toast.error(t('proof_tree.target_unavailable'));
      return;
    }

    if (placement === "below") {
      sourceNode.children = [refreshedTargetNode];

      if (!refreshedTargetParent) {
        setRootNode(sourceNode);
        setSelectedNodeId(sourceNode.id);
        setMoveTargetId("");
        return;
      }

      const targetIndex = refreshedTargetParent.children.findIndex(
        (child) => child.id === targetNodeId
      );
      if (targetIndex === -1) return;

      refreshedTargetParent.children[targetIndex] = sourceNode;
      setRootNode(newRoot);
      setSelectedNodeId(sourceNode.id);
      setMoveTargetId("");
      return;
    } else if (placement === "above") {
      const targetChildren = [...(refreshedTargetNode.children || [])];
      sourceNode.children = targetChildren;
      refreshedTargetNode.children = [sourceNode];

      if (!refreshedTargetParent) {
        setRootNode(refreshedTargetNode);
        setSelectedNodeId(sourceNode.id);
        setMoveTargetId("");
        return;
      }

      const targetIndex = refreshedTargetParent.children.findIndex(
        (child) => child.id === targetNodeId
      );
      if (targetIndex === -1) return;
      refreshedTargetParent.children[targetIndex] = refreshedTargetNode;
      setRootNode(newRoot);
      setSelectedNodeId(sourceNode.id);
      setMoveTargetId("");
      return;
    } else {
      if (!refreshedTargetParent) {
        toast.error(t('proof_tree.cannot_move_root_lr'));
        return;
      }

      if (
        refreshedTargetParent.children.length >= 5 &&
        sourceParent.id !== refreshedTargetParent.id
      ) {
        toast.error(t('proof_tree.target_max_nodes'));
        return;
      }

      const targetIndex = refreshedTargetParent.children.findIndex(
        (child) => child.id === targetNodeId
      );
      if (targetIndex === -1) return;

      const insertIndex = placement === "left" ? targetIndex : targetIndex + 1;
      refreshedTargetParent.children.splice(insertIndex, 0, sourceNode);
    }

    setRootNode(newRoot);
    setSelectedNodeId(sourceNode.id);
    setMoveTargetId("");
  };

  const moveNodeLeft = (nodeIdToMove) => {
    const newRoot = JSON.parse(JSON.stringify(rootNode));
    const parent = findParentOfNode(newRoot, nodeIdToMove);
    if (!parent) return;

    const grandparent = findParentOfNode(newRoot, parent.id);
    if (!grandparent) return;

    const parentIndex = grandparent.children.findIndex((c) => c.id === parent.id);
    if (parentIndex <= 0) return;

    const leftBranch = grandparent.children[parentIndex - 1];
    if (leftBranch.children.length >= 5) {
      toast.error(t('proof_tree.left_branch_max'));
      return;
    }

    const result = detachNode(newRoot, nodeIdToMove);
    if (!result) return;

    const refreshedLeftBranch = findNodeById(newRoot, leftBranch.id);
    refreshedLeftBranch.children.push(result.detachedNode);

    setRootNode(newRoot);
    setSelectedNodeId(result.detachedNode.id);
  };

  const moveNodeRight = (nodeIdToMove) => {
    const newRoot = JSON.parse(JSON.stringify(rootNode));
    const parent = findParentOfNode(newRoot, nodeIdToMove);
    if (!parent) return;

    const grandparent = findParentOfNode(newRoot, parent.id);
    if (!grandparent) return;

    const parentIndex = grandparent.children.findIndex((c) => c.id === parent.id);
    if (parentIndex === -1 || parentIndex >= grandparent.children.length - 1) return;

    const rightBranch = grandparent.children[parentIndex + 1];
    if (rightBranch.children.length >= 5) {
      toast.error(t('proof_tree.right_branch_max'));
      return;
    }

    const result = detachNode(newRoot, nodeIdToMove);
    if (!result) return;

    const refreshedRightBranch = findNodeById(newRoot, rightBranch.id);
    refreshedRightBranch.children.unshift(result.detachedNode);

    setRootNode(newRoot);
    setSelectedNodeId(result.detachedNode.id);
  };

  const swapNodeLeft = (nodeIdToMove) => {
    const newRoot = JSON.parse(JSON.stringify(rootNode));
    const parent = findParentOfNode(newRoot, nodeIdToMove);
    if (!parent) return;

    const index = parent.children.findIndex((c) => c.id === nodeIdToMove);
    if (index <= 0) return;

    [parent.children[index - 1], parent.children[index]] = [
      parent.children[index],
      parent.children[index - 1],
    ];
    setRootNode(newRoot);
  };

  const swapNodeRight = (nodeIdToMove) => {
    const newRoot = JSON.parse(JSON.stringify(rootNode));
    const parent = findParentOfNode(newRoot, nodeIdToMove);
    if (!parent) return;

    const index = parent.children.findIndex((c) => c.id === nodeIdToMove);
    if (index === -1 || index >= parent.children.length - 1) return;

    [parent.children[index], parent.children[index + 1]] = [
      parent.children[index + 1],
      parent.children[index],
    ];
    setRootNode(newRoot);
  };

  const moveNodeUp = (nodeIdToMove) => {
    const newRoot = JSON.parse(JSON.stringify(rootNode));
    const parent = findParentOfNode(newRoot, nodeIdToMove);
    if (!parent) return;

    const grandparent = findParentOfNode(newRoot, parent.id);
    if (!grandparent) {
      toast.warn(t('proof_tree.cannot_move_up_root'));
      return;
    }

    const node = findNodeById(newRoot, nodeIdToMove);
    if (grandparent.children.length >= 5) {
      toast.error(t('proof_tree.cannot_move_up_max'));
      return;
    }
    if (parent.children.length - 1 + (node.children || []).length > 5) {
      toast.error(t('proof_tree.cannot_move_promote'));
      return;
    }

    const result = detachNode(newRoot, nodeIdToMove);
    if (!result) return;

    const parentIndex = grandparent.children.findIndex((c) => c.id === parent.id);
    if (parentIndex === -1) return;

    grandparent.children.splice(parentIndex + 1, 0, result.detachedNode);

    setRootNode(newRoot);
    setSelectedNodeId(result.detachedNode.id);
  };

  const moveNodeDown = (nodeIdToMove) => {
    const newRoot = JSON.parse(JSON.stringify(rootNode));
    const parent = findParentOfNode(newRoot, nodeIdToMove);
    if (!parent) return;

    const node = findNodeById(newRoot, nodeIdToMove);
    const index = parent.children.findIndex((c) => c.id === nodeIdToMove);
    if (index === -1) return;

    let targetSiblingId = null;
    let insertLeft = false;
    if (index > 0) {
      targetSiblingId = parent.children[index - 1].id;
      insertLeft = true;
    } else if (index < parent.children.length - 1) {
      targetSiblingId = parent.children[index + 1].id;
    } else {
      toast.warn(t('proof_tree.cannot_move_down_sibling'));
      return;
    }

    const targetSibling = findNodeById(newRoot, targetSiblingId);
    if (targetSibling.children.length >= 5) {
      toast.error(t('proof_tree.cannot_move_down_max'));
      return;
    }
    if (parent.children.length - 1 + (node.children || []).length > 5) {
      toast.error(t('proof_tree.cannot_move_promote'));
      return;
    }

    const result = detachNode(newRoot, nodeIdToMove);
    if (!result) return;

    const refreshedTarget = findNodeById(newRoot, targetSiblingId);
    if (!refreshedTarget) return;

    if (insertLeft) {
      refreshedTarget.children.push(result.detachedNode);
    } else {
      refreshedTarget.children.unshift(result.detachedNode);
    }

    setRootNode(newRoot);
    setSelectedNodeId(result.detachedNode.id);
  };

  const insertParentAboveNode = (nodeIdToWrap) => {
    const newRoot = JSON.parse(JSON.stringify(rootNode));
    const parentNode = findParentOfNode(newRoot, nodeIdToWrap);
    const targetNode = findNodeById(newRoot, nodeIdToWrap);
    if (!targetNode) return;

    const wrapperNode = createProofTreeNode(
      "",
      [targetNode],
      "",
      targetNode.mathMode
    );

    if (!parentNode) {
      setRootNode(wrapperNode);
      setSelectedNodeId(wrapperNode.id);
      return;
    }

    const index = parentNode.children.findIndex((child) => child.id === nodeIdToWrap);
    if (index === -1) return;

    parentNode.children[index] = wrapperNode;
    setRootNode(newRoot);
    setSelectedNodeId(wrapperNode.id);
  };

  const editNodeContent = (nodeId, newContent) => {
    const updateNode = (node) => {
      if (node.id === nodeId) {
        node.content = newContent;
        return;
      }
      node.children.forEach(updateNode);
    };
    const newRoot = JSON.parse(JSON.stringify(rootNode));
    updateNode(newRoot);
    setRootNode(newRoot);
  };

  const editNodeRightLabel = (nodeId, newRightLabel) => {
    const updateNode = (node) => {
      if (node.id === nodeId) {
        node.rightLabel = newRightLabel;
        return;
      }
      node.children.forEach(updateNode);
    };
    const newRoot = JSON.parse(JSON.stringify(rootNode));
    updateNode(newRoot);
    setRootNode(newRoot);
  };

  const toggleMathMode = (nodeId, isMathMode) => {
    const updateMathMode = (node) => {
      if (node.id === nodeId) {
        node.mathMode = isMathMode;
      } else {
        node.children.forEach(updateMathMode);
      }
    };
    const newRoot = JSON.parse(JSON.stringify(rootNode));
    updateMathMode(newRoot);
    setRootNode(newRoot);
  };

  const handleMathNotationChange = () => {
    const newMathMode = !math_notation;
    setMathNotation(newMathMode);

    const toggleAll = (node, mode) => {
      node.mathMode = mode;
      node.children.forEach((child) => toggleAll(child, mode));
    };
    const newRoot = JSON.parse(JSON.stringify(rootNode));
    toggleAll(newRoot, newMathMode);
    setRootNode(newRoot);
  };

  const selectedNode =
    selectedNodeId !== null ? findNodeById(rootNode, selectedNodeId) : null;

  const selectableMoveTargets = [];
  const collectMoveTargets = (node) => {
    if (!node || !selectedNode) return;
    if (node.id !== selectedNode.id && !isDescendant(selectedNode, node.id)) {
      selectableMoveTargets.push(node);
    }
    node.children.forEach(collectMoveTargets);
  };

  if (rootNode && selectedNode) {
    collectMoveTargets(rootNode);
  }

  useEffect(() => {
    if (selectedNodeId !== null) {
      setShouldAutoFocusNodeInput(true);
    }
  }, [selectedNodeId]);

  const generateLatexCode = (node) => {
    // ✨ FIX: This helper function now correctly handles both global and local math modes.
    const formatContent = (content, mathMode) => {
      // Case 1: Global Math Mode is ON for this node.
      // Wrap the entire content string in single '$' and we're done.
      if (mathMode) {
        return `$${content}$`;
      }

      // Case 2: Global Math Mode is OFF.
      // We find all words that start with a '\' (like \lor, \land, etc.)
      // and wrap just those words in '$' signs.
      const regex = /(\\[a-zA-Z]+)/g;

      // In the replacement string '$$$1$$', the '$$' creates a literal '$'
      // and '$1' is the command that was found (e.g., \lor).
      // This correctly turns 'b \lor c' into 'b $\lor$ c'.
      return content.replace(regex, "$$$1$$");
    };

    let childrenCode = node.children
      .map((child) => generateLatexCode(child))
      .join(" ");

    const contentFormatted = formatContent(node.content, node.mathMode);
    let nodeCommand = "";

    switch (node.children.length) {
      case 0:
        nodeCommand = `\\AxiomC{${contentFormatted}}`;
        break;
      case 1:
        nodeCommand = `\\UnaryInfC{${contentFormatted}}`;
        break;
      case 2:
        nodeCommand = `\\BinaryInfC{${contentFormatted}}`;
        break;
      case 3:
        nodeCommand = `\\TrinaryInfC{${contentFormatted}}`;
        break;
      case 4:
        nodeCommand = `\\QuaternaryInfC{${contentFormatted}}`;
        break;
      case 5:
        nodeCommand = `\\QuinaryInfC{${contentFormatted}}`;
        break;
      default:
        break;
    }

    let code = "";
    if (node.rightLabel) {
      // Apply the same robust formatting to the right label.
      const rightLabelFormatted = formatContent(node.rightLabel, node.mathMode);
      code = `${childrenCode} \\RightLabel{\\scriptsize{${rightLabelFormatted}}}\n${nodeCommand}\n`;
    } else {
      code = `${childrenCode} ${nodeCommand}\n`;
    }

    return code;
  };

  const generateBtn = () => {
    const proofTreeCode = generateLatexCode(rootNode); // This function generates the LaTeX code for the tree

    let latexCode = ""; // Initialize the LaTeX code string

    // Check if the preamble should be included
    if (includePreamble) {
      latexCode +=
        "\\documentclass{article}\n" + buildGeometryLine(paperSize, landscape) + "\\usepackage{bussproofs}\n\\pagestyle{empty}\n\\begin{document}\n";
    }
    if (includeDocumentTags && !includePreamble) {
      latexCode += "\\usepackage{bussproofs}\n";
    }

    // Add the proof tree environment with the code

    latexCode += "\\begin{prooftree}\n";

    latexCode += `${proofTreeCode}\n`; // Add the main proof tree code

    latexCode += "\\end{prooftree}\n";

    // Check if document end tags should be included
    if (includePreamble) {
      latexCode += "\\end{document}";
    }

    setGeneratedCode(latexCode); // Set the generated LaTeX code to state
  };

  const handleSave = async () => {
    if (!user || !rootNode) {
      toast.error(t('common.please_login_create', { item: t('proof_tree.name') }));
      return;
    }

    if (!treeName.trim()) {
      toast.error(t('common.please_enter_name', { item: t('proof_tree.name') }));
      return;
    }

    setIsSaving(true);
    try {
      const treeToSave = {
        name: treeName,
        description: treeDescription,
        treeData: rootNode,
        settings: {
          math_notation,
          includePreamble,
          includeDocumentTags,
        },
        userId: user.id,
      };

      if (isEditMode) {
        // Update existing proof tree
        await proofTreeService.updateProofTree(id, treeToSave);
        toast.success(t('common.update_success', { item: t('proof_tree.name') }));
      } else {
        // Create new proof tree
        const response = await proofTreeService.saveProofTree(treeToSave);
        toast.success(t('common.save_success', { item: t('proof_tree.name') }));
        // Navigate to edit mode with the new tree ID
        navigate(`/proof-trees/edit/${response.data._id}`);
      }
    } catch (error) {
      console.error("Error saving proof tree:", error);
      toast.error(t('common.save_failed', { item: t('proof_tree.name') }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = (importedNode) => {
    if (importedNode) {
      // Reset nodeId to continue from the imported tree's max ID
      const findMaxId = (node) => {
        let maxId = node.id || 0;
        if (node.children) {
          node.children.forEach((child) => {
            maxId = Math.max(maxId, findMaxId(child));
          });
        }
        return maxId;
      };
      nodeId = findMaxId(importedNode) + 1;

      setRootNode(importedNode);
      setSelectedNodeId(null);
      toast.success(t('common.import_success_image'));
    }
  };

  useEffect(() => {
    const loadProofTreeData = async () => {
      if (id && user) {
        try {
          const response = await proofTreeService.getProofTree(id);
          const loadedTree = response.data;

          setRootNode(loadedTree.treeData);
          setTreeName(loadedTree.name || "");
          setTreeDescription(loadedTree.description || "");
          setMathNotation(loadedTree.settings.math_notation);
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
          nodeId = findMaxId(loadedTree.treeData) + 1;
        } catch (error) {
          console.error("Error loading proof tree:", error);
        }
      }
    };

    loadProofTreeData();
  }, [id, user]);

  // Auto-import LaTeX code from Image-to-LaTeX page
  useEffect(() => {
    // Only auto-import on create pages (not edit pages)
    if (isEditMode) {
      return;
    }

    const storageKey = "pendingLatexImport_Proof Tree";
    const pendingLatexCode = sessionStorage.getItem(storageKey);

    if (pendingLatexCode) {
      try {
        const parseResult = parseLatexToProofTree(pendingLatexCode);
        
        if (parseResult.success && parseResult.rootNode) {
          handleImport(parseResult.rootNode);
          sessionStorage.removeItem(storageKey);
          toast.success(t('common.import_success_image'));
        } else {
          toast.error(t('common.import_failed', { message: parseResult.message || "Invalid code" }));
          sessionStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error("Error auto-importing LaTeX code:", error);
        toast.error(t('common.import_error', { message: error.message }));
        sessionStorage.removeItem(storageKey);
      }
    }
  }, [isEditMode]);

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {t('proof_tree.title_builder')}
      </h1>
      <ProofTreeInstructions />
      {/* --- 1. Tree Visualization Section --- */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-700">
            {t('common.tree_visualization')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTreeZoom((z) => Math.max(0.25, z - 0.25))}
              disabled={treeZoom <= 0.25}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-sm font-medium"
            >
              −
            </button>
            <span className="text-xs text-gray-600 min-w-[3rem] text-center">
              {Math.round(treeZoom * 100)}%
            </span>
            <button
              onClick={() => setTreeZoom((z) => Math.min(3, z + 0.25))}
              disabled={treeZoom >= 3}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-sm font-medium"
            >
              +
            </button>
            <button
              onClick={() => setTreeZoom(1)}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs font-medium"
            >
              {t('common.reset')}
            </button>
          </div>
        </div>
        <ProofTreeVisualizer
          node={rootNode}
          onNodeClick={setSelectedNodeId}
          onAddChild={addNode}
          onRemoveNode={removeNode}
          selectedNodeId={selectedNodeId}
          zoom={treeZoom}
        />
      </div>
      {/* --- 2. Node Editor Panel --- */}
      {selectedNode ? (
        <div className="w-full max-w-2xl bg-white px-4 py-3 rounded-lg shadow-md mb-6 transition-all duration-300">
          <h3 className="text-base font-semibold mb-2 text-gray-800">
            {t('proof_tree.edit_node', { id: selectedNode.id })}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('proof_tree.node_content')}
              </label>
                <LatexInput
                  value={selectedNode.content}
                  onChange={(value) => {
                    if (shouldAutoFocusNodeInput) {
                      setShouldAutoFocusNodeInput(false);
                    }
                    editNodeContent(selectedNode.id, value);
                  }}
                  mathNotation={math_notation}
                  autoFocus={shouldAutoFocusNodeInput}
                />
            </div>

            {selectedNode.children.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('proof_tree.right_label')}
                </label>
                <LatexInput
                  value={selectedNode.rightLabel}
                  onChange={(value) =>
                    editNodeRightLabel(selectedNode.id, value)
                  }
                  mathNotation={math_notation}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => addNode(selectedNode.id)}
                  disabled={selectedNode.children.length >= 5}
                  className="px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 text-xs font-medium"
                >
                  {t('common.add_child')}
                </button>

                {selectedNode.id !== rootNode.id && (() => {
                  const parentOfSel = findParentOfNode(rootNode, selectedNode.id);
                  const selIdx = parentOfSel
                    ? parentOfSel.children.findIndex((c) => c.id === selectedNode.id)
                    : -1;
                  const grandparentOfSel = parentOfSel
                    ? findParentOfNode(rootNode, parentOfSel.id)
                    : null;
                  const nodeChildCount = (selectedNode.children || []).length;
                  const parentChildCount = parentOfSel ? parentOfSel.children.length : 0;
                  const promotionFits = parentChildCount - 1 + nodeChildCount <= 5;

                  const canUp = !!grandparentOfSel && grandparentOfSel.children.length < 5 && promotionFits;
                  const canDown = parentOfSel && parentChildCount > 1 && promotionFits &&
                    ((selIdx > 0 && parentOfSel.children[selIdx - 1].children.length < 5) ||
                     (selIdx < parentChildCount - 1 && parentOfSel.children[selIdx + 1].children.length < 5));
                  const parentIdx = grandparentOfSel
                    ? grandparentOfSel.children.findIndex((c) => c.id === parentOfSel.id)
                    : -1;
                  const canLeft = !!grandparentOfSel && parentIdx > 0 &&
                    grandparentOfSel.children[parentIdx - 1].children.length < 5;
                  const canRight = !!grandparentOfSel && parentIdx >= 0 &&
                    parentIdx < grandparentOfSel.children.length - 1 &&
                    grandparentOfSel.children[parentIdx + 1].children.length < 5;
                  const canSwapLeft = selIdx > 0;
                  const canSwapRight = selIdx >= 0 && selIdx < parentChildCount - 1;

                  return (
                    <>
                      <button
                        onClick={() => moveNodeUp(selectedNode.id)}
                        disabled={!canUp}
                        className="px-3 py-1.5 bg-slate-500 text-white rounded-md hover:bg-slate-600 disabled:bg-gray-300 text-xs font-medium inline-flex items-center gap-1"
                        title="Move node up one level (becomes sibling of parent)"
                      >
                        <FaArrowDown /> {t('common.down')}
                      </button>
                      <button
                        onClick={() => moveNodeDown(selectedNode.id)}
                        disabled={!canDown}
                        className="px-3 py-1.5 bg-slate-500 text-white rounded-md hover:bg-slate-600 disabled:bg-gray-300 text-xs font-medium inline-flex items-center gap-1"
                        title="Move node down one level (becomes child of sibling)"
                      >
                        <FaArrowUp /> {t('common.up')}
                      </button>
                      <button
                        onClick={() => moveNodeLeft(selectedNode.id)}
                        disabled={!canLeft}
                        className="px-3 py-1.5 bg-slate-500 text-white rounded-md hover:bg-slate-600 disabled:bg-gray-300 text-xs font-medium inline-flex items-center gap-1"
                        title="Move node into left sibling branch"
                      >
                        <FaArrowLeft /> {t('common.left')}
                      </button>
                      <button
                        onClick={() => moveNodeRight(selectedNode.id)}
                        disabled={!canRight}
                        className="px-3 py-1.5 bg-slate-500 text-white rounded-md hover:bg-slate-600 disabled:bg-gray-300 text-xs font-medium inline-flex items-center gap-1"
                        title="Move node into right sibling branch"
                      >
                        <FaArrowRight /> {t('common.right')}
                      </button>
                      <button
                        onClick={() => swapNodeLeft(selectedNode.id)}
                        disabled={!canSwapLeft}
                        className="px-3 py-1.5 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 text-xs font-medium"
                        title="Swap position with left sibling"
                      >
                        {t('common.swap_left')}
                      </button>
                      <button
                        onClick={() => swapNodeRight(selectedNode.id)}
                        disabled={!canSwapRight}
                        className="px-3 py-1.5 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 text-xs font-medium"
                        title="Swap position with right sibling"
                      >
                        {t('common.swap_right')}
                      </button>
                      <button
                        onClick={() => insertParentAboveNode(selectedNode.id)}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-xs font-medium inline-flex items-center gap-1.5"
                      >
                        <FaLevelDownAlt />
                        {t('common.insert_node_below')}
                      </button>
                    </>
                  );
                })()}

                {selectedNode.id !== rootNode.id && (
                  <button
                    onClick={() => removeNode(selectedNode.id)}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs font-medium"
                  >
                    {t('common.remove_node')}
                  </button>
                )}
              </div>
              <label className="flex items-center cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={selectedNode.mathMode}
                  onChange={(e) =>
                    toggleMathMode(selectedNode.id, e.target.checked)
                  }
                  id={`math-mode-${selectedNode.id}`}
                  className="mr-2"
                />
                <span className="text-xs text-gray-600 font-medium">
                  {t('common.math_mode_label')}
                </span>
              </label>
            </div>

            {selectedNode.id !== rootNode.id && selectableMoveTargets.length > 0 && (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <div className="mb-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {t('proof_tree.move_relative')}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={moveTargetId}
                    onChange={(e) => setMoveTargetId(e.target.value)}
                    className="min-w-[220px] rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('common.select_target_node')}</option>
                    {selectableMoveTargets.map((node) => (
                      <option key={node.id} value={node.id}>
                        ID {node.id}: {node.content || "[Empty]"}
                      </option>
                    ))}
                  </select>
                  <select
                    value={movePlacement}
                    onChange={(e) => setMovePlacement(e.target.value)}
                    className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="left">{t('common.to_the_left')}</option>
                    <option value="right">{t('common.to_the_right')}</option>
                    <option value="above">{t('common.above')}</option>
                    <option value="below">{t('common.below')}</option>
                  </select>
                  <button
                    onClick={() =>
                      moveNodeRelativeToTarget(
                        selectedNode.id,
                        Number(moveTargetId),
                        movePlacement
                      )
                    }
                    disabled={!moveTargetId}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 text-xs font-medium"
                  >
                    {t('common.move_node')}
                  </button>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                  {t('proof_tree.move_help')}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 mb-6 p-4 bg-gray-100 rounded-lg">
          {t('common.click_node_to_edit')}
        </div>
      )}
      {/* --- 3. Configuration & Other Sections (Largely Unchanged) --- */}
      <div className="w-full mb-6 bg-white p-5 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          {t('common.tree_configuration')}
        </h2>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={math_notation}
            onChange={handleMathNotationChange}
            className="mr-2"
          />
          <span className="text-sm text-gray-600 font-medium">
            {t('common.global_math_mode')}
          </span>
        </label>
      </div>
      {/* LaTeX Settings */}
      <div className="w-full bg-gray-100 p-4 rounded-lg shadow-sm mb-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">
          {t('common.latex_settings')}
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
              {t('common.include_preamble')}
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
              {t('common.include_bussproofs')}
            </span>
          </label>
          {includePreamble && (
            <>
              <label className="flex items-center cursor-pointer">
                <span className="text-sm text-gray-600 font-medium mr-2">{t('common.paper_size')}</span>
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
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={landscape}
                  onChange={() => setLandscape(!landscape)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600 font-medium">
                  {t('common.landscape')}
                </span>
              </label>
            </>
          )}
        </div>
      </div>
      {/* Import/Export and Generate Code Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <button
          onClick={() => setShowImportModal(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors flex items-center"
          data-umami-event="Import Proof Tree from LaTeX button"
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span>{t('common.import_latex')}</span>
        </button>
        {generatedCode && (
          <button
            onClick={() => setShowLaTeXEditor(!showLaTeXEditor)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>{showLaTeXEditor ? t('common.show_code_only') : t('common.edit_compile')}</span>
          </button>
        )}
        <button
          onClick={generateBtn}
          className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 transition-colors flex items-center"
          data-umami-event="Generate Proof Tree LaTeX button"
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
          <span>{t('common.generate_latex')}</span>
        </button>
      </div>
      {/* Generated Code */}
      {generatedCode && (
        <div className="w-full mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{t('common.generated_latex_code')}</h3>
          
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
          {t('proof_tree.info_title')}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('proof_tree.tree_name')}
            </label>
            <input
              type="text"
              value={treeName}
              onChange={(e) => setTreeName(e.target.value)}
              placeholder={t('proof_tree.tree_name_placeholder')}
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
              placeholder={t('proof_tree.description_placeholder')}
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
          disabled={!user || !rootNode || isSaving}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
          data-umami-event={isEditMode ? "Update Proof Tree button" : "Save Proof Tree button"}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              <span>{isEditMode ? t('proof_tree.updating') : t('proof_tree.saving')}</span>
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
              <span>
                {isEditMode ? t('proof_tree.update_tree') : t('proof_tree.save_tree')}
              </span>
            </>
          )}
        </button>
        {!user && (
          <p className="text-sm text-red-500 mt-2">
            {t('common.please_login_save', { item: t('proof_tree.name') })}
          </p>
        )}
      </div>
      {/* Import Modal */}
      <LatexImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
    </div>
  );
};

export default ProofTree;

// // NOTE DONE : PROOF TREES : right label nech ma mensiu velkost pisma jak nazvy v nodoch
// // NOTE DONE: PROOF TREES : dat na vyber ci generovat takto {$E \to B$} abo takto {E  $\to$  B}.
// //                     To znamena ze dat na vyber ci vsetko bude v matematickom pisme to znamena ze $takto$ alebo nie
// // NOTE DONE: PROOF TREES : namiesto tlacitok hore pre davanie specialnych znakov pridat ze ak napise "\" tak mu to da na vyber tie specialne znaky, jak taky autocomplete cca
// // NOTE DONE: PROOF TREES : podpora az 5tich potomkov https://mathweb.ucsd.edu/~sbuss/ResearchWeb/bussproofs/BussGuide2_Smith2012.pdf
// import React, { useState, useEffect } from "react";
// import "../index.css";
// import GeneratedCode from "../../Components/GeneratedCode";
// import LatexInput from "../../Components/LatexInput";
// import ProofTreeInstructions from "../../Components/ProofTree/ProofTreeInstructions";
// import { useParams, useNavigate } from "react-router-dom";
// import { proofTreeService } from "../../services/prooftree.service";
// import { useAuth } from "../../context/AuthContext";

// // ProofTreeNode Data Structure
// let nodeId = 0;
// // const createProofTreeNode = (content = "", children = [], rightLabel = "") => {
// //   return { id: nodeId++, content, children, rightLabel };
// // };

// const createProofTreeNode = (
//   content = "",
//   children = [],
//   rightLabel = "",
//   mathMode = false
// ) => {
//   return { id: nodeId++, content, children, rightLabel, mathMode };
// };

// // ProofTree Component
// const ProofTree = () => {
//   const [rootNode, setRootNode] = useState(createProofTreeNode());
//   const [generatedCode, setGeneratedCode] = useState(
//     "Your code will appear here \n after you click on Generate Code button"
//   );
//   // const [selectedNodeId, setSelectedNodeId] = useState(null);
//   const [math_notation, setMathNotation] = useState(false);

//   const handleOptionChange = (option) => {
//     setMathNotation(option);
//   };

//   const [includePreamble, setIncludePreamble] = useState(false);
//   const [includeDocumentTags, setIncludeDocumentTags] = useState(false);

//   const [treeName, setTreeName] = useState("");
//   const [treeDescription, setTreeDescription] = useState("");
//   const [isSaving, setIsSaving] = useState(false);

//   const { user } = useAuth();
//   const { id } = useParams(); // Get tree ID from URL for edit mode
//   const navigate = useNavigate();
//   const isEditMode = Boolean(id);

//   const toggleMathModeForAllNodes = (node, mathMode) => {
//     node.mathMode = mathMode; // Set mathMode for the current node
//     node.children.forEach((child) =>
//       toggleMathModeForAllNodes(child, mathMode)
//     ); // Recursively set for children
//   };

//   const handleMathNotationChange = () => {
//     const newMathMode = !math_notation;
//     setMathNotation(newMathMode);

//     // Create a deep copy of rootNode to ensure immutability
//     const rootNodeCopy = JSON.parse(JSON.stringify(rootNode));
//     toggleMathModeForAllNodes(rootNodeCopy, newMathMode);
//     setRootNode(rootNodeCopy); // Update the rootNode with new mathMode settings
//   };

//   const toggleMathMode = (nodeId, isMathMode) => {
//     // Logic to update the specific node's mathMode property
//     const updateMathMode = (node) => {
//       if (node.id === nodeId) {
//         node.mathMode = isMathMode;
//       } else {
//         node.children.forEach(updateMathMode);
//       }
//     };
//     updateMathMode(rootNode);
//     setRootNode({ ...rootNode });
//   };
//   const addNode = (parentId) => {
//     const stack = [rootNode];
//     let found = false;

//     while (stack.length > 0 && !found) {
//       const currentNode = stack.pop();

//       if (currentNode.id === parentId && currentNode.children.length < 5) {
//         currentNode.children.push(createProofTreeNode());
//         found = true; // Node added, exit the loop
//       } else {
//         // Add children to the stack for further processing
//         currentNode.children.forEach((child) => stack.push(child));
//       }
//     }

//     if (found) {
//       setRootNode({ ...rootNode });
//     } else {
//       console.log("Parent node not found.");
//     }
//   };

//   const removeNode = (nodeIdToRemove) => {
//     const removeNodeRecursive = (currentNode, nodeIdToRemove) => {
//       for (let i = 0; i < currentNode.children.length; i++) {
//         if (currentNode.children[i].id === nodeIdToRemove) {
//           currentNode.children.splice(i, 1); // Remove the node
//           return true; // Node found and removed
//         }

//         // Recurse into children
//         if (removeNodeRecursive(currentNode.children[i], nodeIdToRemove)) {
//           return true; // Node found and removed in deeper level
//         }
//       }
//       return false; // Node not found in this branch
//     };

//     // Start the recursive removal process
//     if (!removeNodeRecursive(rootNode, nodeIdToRemove)) {
//       console.log("Node not found.");
//     } else {
//       setRootNode({ ...rootNode }); // Update state to trigger re-render
//     }
//   };

//   // function to edit the content of a node based on its ID
//   const editNodeContent = (nodeId, newContent) => {
//     const stack = [rootNode];
//     while (stack.length > 0) {
//       const currentNode = stack.pop();

//       if (currentNode.id === nodeId) {
//         currentNode.content = newContent;
//         break;
//       }

//       // adding children to the stack... so they are processed
//       currentNode.children.forEach((child) => stack.push(child));
//     }

//     setRootNode({ ...rootNode });
//   };

//   const editNodeRightLabel = (nodeId, newRightLabel) => {
//     const stack = [rootNode];
//     while (stack.length > 0) {
//       const currentNode = stack.pop();

//       if (currentNode.id === nodeId) {
//         currentNode.rightLabel = newRightLabel;
//         break; // Stop the loop as we've found and updated the node
//       }

//       // Add children to the stack for further processing
//       currentNode.children.forEach((child) => stack.push(child));
//     }

//     setRootNode({ ...rootNode });
//   };

//   const renderTreeNode = (node, isRoot = true) => {
//     return (
//       <div className="proof-tree-node">
//         <div className="proof-tree-content">
//           <div className="node-input-group">
//             <label htmlFor={`node-content-${node.id}`}>Node Content</label>
//             <LatexInput
//               id={`node-content-${node.id}`}
//               value={node.content}
//               onChange={(value) => editNodeContent(node.id, value)}
//               mathNotation={math_notation}
//             />
//             {/* Checkbox for Math Mode */}
//           </div>

//           {node.children.length > 0 && (
//             <div className="node-input-group">
//               <label htmlFor={`node-right-label-${node.id}`}>Right Label</label>
//               <LatexInput
//                 id={`node-right-label-${node.id}`}
//                 value={node.rightLabel}
//                 onChange={(value) => editNodeRightLabel(node.id, value)}
//                 mathNotation={math_notation}
//               />
//             </div>
//           )}
//           <div className="node-action-buttons">
//             <button className="add-child-btn" onClick={() => addNode(node.id)}>
//               +
//             </button>
//             {!isRoot && ( // Conditionally show the Remove Node button
//               <button
//                 className="remove-child-btn"
//                 onClick={() => removeNode(node.id)}
//               >
//                 <b>-</b>
//               </button>
//             )}

//             {/* <div> */}
//             <input
//               type="checkbox"
//               checked={node.mathMode}
//               onChange={(e) => toggleMathMode(node.id, e.target.checked)}
//               id={`math-mode-${node.id}`}
//             />
//             {/* <label htmlFor={`math-mode-${node.id}`}>Math Mode</label> */}
//             {/* </div> */}
//           </div>
//         </div>

//         <div className="proof-tree-children">
//           {node.children.map((child) => renderTreeNode(child, false))}{" "}
//           {/* Mark children as non-root */}
//         </div>
//       </div>
//     );
//   };

//   const generateLatexCode = (node) => {
//     let code = "";

//     // Improved function to conditionally wrap content in math mode
//     // and ensure LaTeX commands are always correctly formatted
//     const formatContent = (content, mathMode) => {
//       // This regular expression finds LaTeX commands
//       const regex = /(\\[a-zA-Z]+){1}(\{[^}]*\})?/g; // Match commands, possibly followed by their arguments in {}
//       let formattedContent = content.replace(regex, (match) => `$${match}$`); // Wrap each found command with $...$
//       if (mathMode) {
//         // If the entire content is in math mode, wrap everything once instead of individual components
//         formattedContent = `$${formattedContent.replace(/\$/g, "")}$`; // Remove inner $ signs and wrap the whole content
//       }
//       return formattedContent;
//     };

//     // Generate code for children first
//     let childrenCode = node.children
//       .map((child) => generateLatexCode(child))
//       .join(" ");

//     // Determine the appropriate command based on the number of children
//     let nodeCommand = "";
//     const contentInMathMode = formatContent(node.content, node.mathMode); // Apply math mode if needed

//     switch (node.children.length) {
//       case 0:
//         nodeCommand = `\\AxiomC{${contentInMathMode}}`;
//         break;
//       case 1:
//         nodeCommand = `\\UnaryInfC{${contentInMathMode}}`;
//         break;
//       case 2:
//         nodeCommand = `\\BinaryInfC{${contentInMathMode}}`;
//         break;
//       case 3:
//         nodeCommand = `\\TrinaryInfC{${contentInMathMode}}`;
//         break;
//       case 4:
//         nodeCommand = `\\QuaternaryInfC{${contentInMathMode}}`;
//         break;
//       case 5:
//         nodeCommand = `\\QuinaryInfC{${contentInMathMode}}`;
//         break;
//       default:
//         console.log("Unsupported number of children");
//         break;
//     }

//     // If the node has a right label, adjust for math mode
//     if (node.rightLabel) {
//       const rightLabelInMathMode = formatContent(
//         node.rightLabel,
//         node.mathMode
//       ); // Apply node's math mode to right label
//       code = `${childrenCode} \\RightLabel{\\scriptsize{${rightLabelInMathMode}}}\n${nodeCommand}\n`;
//     } else {
//       code = `${childrenCode} ${nodeCommand}\n`;
//     }

//     return code;
//   };

//   const generateBtn = () => {
//     const proofTreeCode = generateLatexCode(rootNode); // This function generates the LaTeX code for the tree

//     let latexCode = ""; // Initialize the LaTeX code string

//     // Check if the preamble should be included
//     if (includePreamble) {
//       latexCode +=
//         "\\documentclass{article}\n\\usepackage{bussproofs}\n\\begin{document}\n";
//     }
//     if (includeDocumentTags && !includePreamble) {
//       latexCode += "\\usepackage{bussproofs}\n";
//     }

//     // Add the proof tree environment with the code

//     latexCode += "\\begin{prooftree}\n";

//     latexCode += `${proofTreeCode}\n`; // Add the main proof tree code

//     latexCode += "\\end{prooftree}\n";

//     // Check if document end tags should be included
//     if (includePreamble) {
//       latexCode += "\\end{document}";
//     }

//     setGeneratedCode(latexCode); // Set the generated LaTeX code to state
//   };
//   useEffect(() => {
//     const loadProofTreeData = async () => {
//       if (id && user) {
//         try {
//           const response = await proofTreeService.getProofTree(id);
//           const loadedTree = response.data;

//           setRootNode(loadedTree.treeData);
//           setTreeName(loadedTree.name || "");
//           setTreeDescription(loadedTree.description || "");
//           setMathNotation(loadedTree.settings.math_notation);
//           setIncludePreamble(loadedTree.settings.includePreamble);
//           setIncludeDocumentTags(loadedTree.settings.includeDocumentTags);

//           // Find highest node ID to continue numbering
//           const findMaxId = (node) => {
//             let maxId = node.id || 0;
//             if (node.children) {
//               node.children.forEach((child) => {
//                 maxId = Math.max(maxId, findMaxId(child));
//               });
//             }
//             return maxId;
//           };
//           nodeId = findMaxId(loadedTree.treeData) + 1;
//         } catch (error) {
//           console.error("Error loading proof tree:", error);
//         }
//       }
//     };

//     loadProofTreeData();
//   }, [id, user]);

//   const handleSave = async () => {
//     if (!user || !rootNode) {
//       alert("Please log in and create a proof tree first");
//       return;
//     }

//     if (!treeName.trim()) {
//       alert("Please enter a name for your proof tree");
//       return;
//     }

//     setIsSaving(true);
//     try {
//       const treeToSave = {
//         name: treeName,
//         description: treeDescription,
//         treeData: rootNode,
//         settings: {
//           math_notation,
//           includePreamble,
//           includeDocumentTags,
//         },
//         userId: user.id,
//       };

//       if (isEditMode) {
//         // Update existing proof tree
//         await proofTreeService.updateProofTree(id, treeToSave);
//         alert("Proof tree updated successfully!");
//       } else {
//         // Create new proof tree
//         const response = await proofTreeService.saveProofTree(treeToSave);
//         alert("Proof tree saved successfully!");
//         // Navigate to edit mode with the new tree ID
//         navigate(`/proof-trees/edit/${response.data._id}`);
//       }
//     } catch (error) {
//       console.error("Error saving proof tree:", error);
//       alert("Failed to save proof tree. Please try again.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
//       <h1 className="text-3xl font-bold mb-8 text-center">Proof Trees</h1>

//       <ProofTreeInstructions />

//       {/* Tree Configuration Section */}
//       <div className="w-full mb-6 bg-white p-5 rounded-lg shadow">
//         <h2 className="text-lg font-semibold mb-3 text-gray-700">
//           Tree Configuration
//         </h2>
//         <div className="flex flex-wrap gap-4 items-center">
//           <label className="flex items-center cursor-pointer">
//             <input
//               type="checkbox"
//               id="math"
//               name="math"
//               value="math"
//               checked={math_notation}
//               onChange={handleMathNotationChange}
//               className="mr-2"
//             />
//             <span className="text-sm text-gray-600 font-medium">
//               Global Mathematical Font
//             </span>
//           </label>
//         </div>
//       </div>

//       {/* Tree Builder Section */}
//       <div className="w-full mb-8 bg-white p-5 rounded-lg shadow">
//         <h2 className="text-lg font-semibold mb-3 text-gray-700">
//           Tree Structure
//         </h2>
//         <div className="bg-gray-50 p-4 rounded-md border-2 border-dashed border-gray-300 min-h-[200px]">
//           {renderTreeNode(rootNode)}
//         </div>
//       </div>

//       {/* Tree Metadata Section */}
//       <div className="w-full bg-white p-5 rounded-lg shadow mb-8">
//         <h3 className="text-lg font-semibold mb-3 text-gray-700">
//           Proof Tree Information
//         </h3>
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Tree Name *
//             </label>
//             <input
//               type="text"
//               value={treeName}
//               onChange={(e) => setTreeName(e.target.value)}
//               placeholder="Enter a name for your proof tree"
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Description (Optional)
//             </label>
//             <textarea
//               value={treeDescription}
//               onChange={(e) => setTreeDescription(e.target.value)}
//               placeholder="Enter a description for your proof tree"
//               rows={3}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//         </div>
//       </div>

//       {/* LaTeX Settings */}
//       <div className="w-full bg-gray-100 p-4 rounded-lg shadow-sm mb-8">
//         <h3 className="text-lg font-semibold mb-3 text-gray-700">
//           LaTeX Settings
//         </h3>
//         <div className="flex flex-wrap gap-6">
//           <label className="flex items-center cursor-pointer">
//             <input
//               type="checkbox"
//               id="includePreamble"
//               checked={includePreamble}
//               onChange={() => setIncludePreamble(!includePreamble)}
//               className="mr-2"
//             />
//             <span className="text-sm text-gray-600 font-medium">
//               Include whole LaTeX Preamble
//             </span>
//           </label>

//           <label className="flex items-center cursor-pointer">
//             <input
//               type="checkbox"
//               id="includeDocumentTags"
//               checked={includeDocumentTags}
//               onChange={() => setIncludeDocumentTags(!includeDocumentTags)}
//               className="mr-2"
//             />
//             <span className="text-sm text-gray-600 font-medium">
//               Include import of the bussproofs package
//             </span>
//           </label>
//         </div>
//       </div>

//       {/* Generate Code Button */}
//       <button
//         onClick={generateBtn}
//         className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 mb-8 transition-colors flex items-center"
//       >
//         <svg
//           className="w-4 h-4 mr-2"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
//           />
//         </svg>
//         <span>Generate LaTeX Code</span>
//       </button>

//       {/* Generated Code */}
//       <GeneratedCode id="generatedCode" code={generatedCode} />

//       {/* Save/Update Button */}
//       <div className="mb-8">
//         <button
//           onClick={handleSave}
//           disabled={!user || !rootNode || isSaving}
//           className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
//         >
//           {isSaving ? (
//             <>
//               <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
//               <span>{isEditMode ? "Updating..." : "Saving..."}</span>
//             </>
//           ) : (
//             <>
//               <svg
//                 className="w-4 h-4 mr-2"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
//                 />
//               </svg>
//               <span>
//                 {isEditMode ? "Update Proof Tree" : "Save Proof Tree"}
//               </span>
//             </>
//           )}
//         </button>
//         {!user && (
//           <p className="text-sm text-red-500 mt-2">
//             {t('common.please_login_save', { item: t('proof_tree.name') })}
//           </p>
//         )}
//       </div>
//     </div>
//   );
// };
