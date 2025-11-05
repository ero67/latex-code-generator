// NOTE DONE : AST : dat na vyber ci pri generovani maju byt ohranicene hodnoty v nodoch " $ $" ... matematickep pismo ci co
// NOTE DONE : AST : dat na vyber ako chcem mat otoceny strom
// TODO: AST : dat moznost pomenovat hrany (kill me pls)
//TODO:pomenovavanie hran uz viem pisat labele  do stredu hran uz len pridat logiku ze ked
//klikenm na link ta sa len zisti na ktory link som klikol a na zaklade user inputu dam ten label aj do mojej struktury

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import GeneratedCode from "../../Components/GeneratedCode";
import LatexImportModal from "../../Components/AST/LatexImportModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { parseAstLatex } from "../../utils/astParser";

const SyntaxTreeD3 = () => {
  const [treeData, setTreeData] = useState(null);

  const [isChecked, setIsChecked] = useState(false);

  const svgRef = useRef();
  const [generatedCode, setGeneratedCode] = useState(
    "Your code will appear here \n after you click on Generate Code button"
  );

  const [nodeId, setNodeId] = useState(0);

  const [indexOfOrientation, setIndexOfOrientation] = useState(0);

  const [height, setHeight] = useState(100);

  const [svgHeight, setSvgHeight] = useState(100);

  const [includePreamble, setIncludePreamble] = useState(false);
  const [includeDocumentTags, setIncludeDocumentTags] = useState(false);

  //Saving vars
  const [treeName, setTreeName] = useState("");
  const [treeDescription, setTreeDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const { user } = useAuth();
  const { id } = useParams(); // Get tree ID from URL for edit mode
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

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

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create a tree layout
    const tree = d3.tree().size([600, 400]);

    // Create a root hierarchy from the data
    const root = d3.hierarchy(treeData);

    // Assign positions to each node
    tree(root);

    // Create an SVG container
    const svg = d3.select(svgRef.current);

    if (indexOfOrientation === 1) {
      renderLeftRightTree(svg, root);
    } else if (indexOfOrientation === 0) {
      renderTopDownTree(svg, root);
    } else if (indexOfOrientation === 2) {
      renderBottomUpTree(svg, root, 600);
    } else if (indexOfOrientation === 3) {
      renderRightToLeftTree(svg, root, 600, 600);
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

  function renderRightToLeftTree(svg, root, svgWidth, svgHeight) {
    // Draw the links (edges) between nodes
    svg
      .selectAll("path.link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#ADADAD")
      .attr("stroke-width", "4px")
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

    // Add circles to represent nodes
    nodes
      .append("circle")
      .attr("r", 15)
      .attr("stroke", "black")
      .attr("fill", "white");

    // Add labels to the nodes
    nodes
      .append("text")
      .attr("x", 0)
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .text((d) => d.data.value);
  }

  function renderLeftRightTree(svg, root) {
    // Draw the links (edges) between nodes
    svg
      .selectAll("path.link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#ADADAD")
      .attr("stroke-width", "4px")
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

    // Add circles to represent nodes
    nodes
      .append("circle")
      .attr("r", 15)
      .attr("stroke", "black")
      .attr("fill", "white");

    // Add labels to the nodes
    nodes
      .append("text")
      .attr("x", 0)
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .text((d) => d.data.value);
  }

  function renderTopDownTree(svg, root) {
    // Draw the links (edges) between nodes
    svg
      .selectAll("path.link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#ADADAD")
      .attr("stroke-width", "4px")
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

    // Add circles to represent nodes
    nodes
      .append("circle")
      .attr("r", 15)
      .attr("stroke", "black")
      .attr("fill", "white");

    // Add labels to the nodes
    nodes
      .append("text")
      .attr("x", 0)
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .text((d) => d.data.value);
  }

  function renderBottomUpTree(svg, root, svgHeight) {
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
      .attr("stroke-width", "4px")
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

    // Add circles to represent nodes
    nodes
      .append("circle")
      .attr("r", 15)
      .attr("stroke", "black")
      .attr("fill", "white");

    // Add labels to the nodes
    nodes
      .append("text")
      .attr("x", 0)
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .text((d) => d.data.value);
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
      const childValue = prompt("Enter value for the new child node:");
      if (childValue !== null) {
        const newNode = {
          id: nodeId,
          value: childValue,
          children: [],
          label: "",
        };
        setNodeId(nodeId + 1);
        // const currentDepth = calculateDepth(treeData);
        // const currentWidth = calculateMaxWidth(treeData);
        if (!node.data.children) {
          // If the clicked node doesn't have children array, create one
          node.data.children = [newNode];
          // setHeight(height + 50);
        } else {
          // Add the new node to the children array
          node.data.children.push(newNode);

          // if (indexOfOrientation === 0 || indexOfOrientation === 2) {
          //   const newDepth = calculateDepth({ ...treeData });
          //   if (newDepth > currentDepth) {
          //     setHeight(height + newDepth * 15);
          //     setSvgHeight(height + newDepth * 15);
          //   }
          // }
        }

        setTreeData({ ...treeData });
      }
    },
    [treeData, nodeId]
  );

  useEffect(() => {
    const loadTreeData = async () => {
      if (id && user) {
        try {
          const response = await axios.get(
            `${API_URL}/ast/${id}`
          );
          const loadedTree = response.data.data;

          setTreeData(loadedTree.treeData);
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
          setNodeId(findMaxId(loadedTree.treeData) + 1);
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
      // Prevent the event from bubbling to avoid triggering click events on other elements
      // event.stopPropagation();

      const newLabel = prompt("Enter label for the edge:");
      if (newLabel !== null && newLabel !== "") {
        const updateLabelInTreeData = (node, sourceId, targetId, newLabel) => {
          if (node.id === sourceId) {
            node.children = node.children.map((child) => {
              if (child.id === targetId) {
                return { ...child, label: newLabel }; // Update the label
              }
              return child;
            });
          }
          if (node.children) {
            node.children.forEach((child) =>
              updateLabelInTreeData(child, sourceId, targetId, newLabel)
            );
          }
        };

        // Clone the tree data to ensure changes are detected by React
        const newTreeData = { ...treeData };
        updateLabelInTreeData(
          newTreeData,
          link.source.data.id,
          link.target.data.id,
          newLabel
        );
        setTreeData(newTreeData);
      }
    },
    [treeData]
  );

  const handleCreateTree = () => {
    const rootValue = prompt("Enter value for the root node:");
    if (rootValue !== null) {
      setHeight(100);
      setTreeData({ value: rootValue, children: [], label: "" });
    }
  };

  const handleImportFromLatex = (tree) => {
    // Expect tree: { value, children: [...] }
    setTreeData(tree);
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
    const maxId = assignIds(tree, 0);
    setNodeId(maxId + 1);
  };

  const generateLatexCode = (node, parentLabel = "") => {
    if (!node) {
      return "";
    }
    let nodeLabel = isChecked ? `$${node.value}$` : node.value;
    let latexCode = "[\n  " + nodeLabel;

    if (parentLabel) {
      // Use parentLabel.position to set the label's position dynamically
      latexCode += `, edge label={node[midway,${parentLabel.position},font=\\scriptsize,inner sep=1pt]{${parentLabel.text}}}`;
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
          : "";
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
            node you want to expand and enter the value of the child.
          </p>
          <p>
            <span className="font-bold text-blue-600">3.</span> If you want to
            label the edge, click on the edge and enter the label you want.
          </p>
          <p>
            <span className="font-bold text-blue-600">4.</span> Using Turn Left
            button you can turn the tree 90 degrees to the left.
          </p>
          <p>
            <span className="font-bold text-blue-600">5.</span> By using right
            click on the node you can remove the node from the tree structure.
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
            <span>Create New Tree</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-6 py-2 bg-teal-600 text-white font-medium rounded hover:bg-teal-700 transition-colors flex items-center"
            data-umami-event="Import AST from LaTeX button"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span>Import from LaTeX</span>
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
        </div>
      </div>
      <LatexImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportFromLatex}
      />

      {/* Tree Visualization Container */}
      <div className="w-full mb-8 bg-white p-5 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          Tree Visualization
        </h2>
        <div className="flex justify-center">
          <svg
            ref={svgRef}
            width={600}
            height={600}
            className="border border-gray-200 rounded"
            onClick={() => setTreeData(null)} // Clear selection when clicking on the background
          />
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

      {/* Generate Code Button */}
      <button
        id="generateBtn"
        onClick={handleGenerateLatex}
        className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600 mb-8 transition-colors flex items-center"
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

      {/* Generated Code */}
      <GeneratedCode id="generatedCode" code={generatedCode} />
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
