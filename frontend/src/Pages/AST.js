// NOTE DONE : AST : dat na vyber ci pri generovani maju byt ohranicene hodnoty v nodoch " $ $" ... matematickep pismo ci co
// NOTE DONE : AST : dat na vyber ako chcem mat otoceny strom
// TODO: AST : dat moznost pomenovat hrany (kill me pls)
//TODO:pomenovavanie hran uz viem pisat labele  do stredu hran uz len pridat logiku ze ked
//klikenm na link ta sa len zisti na ktory link som klikol a na zaklade user inputu dam ten label aj do mojej struktury

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import GeneratedCode from "../Components/GeneratedCode";

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
      const index = currentNode.children.findIndex(child => child.id === targetId);
  
      if (index >= 0) { // Node is found
        currentNode.children.splice(index, 1); // Remove the node
        return true;
      } else { // Search in children
        currentNode.children.forEach(child => {
          if (deleteRecursively(targetId, child)) {
            return true;
          }
        });
      }
      return false;
    };
  
    // Clone the tree data to ensure immutability
    const newTreeData = JSON.parse(JSON.stringify(treeData));
    if (newTreeData.id === nodeData.id) { // If the root is the node to remove
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
          console.log("first if");
          // setHeight(height + 50);
        } else {
          console.log("second if");
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

  // useEffect(() => {
  //   let newHeight = 0;
  //   if (indexOfOrientation === 0 ) {
  //     const newDepth = calculateDepth(treeData);
  //     newHeight = newDepth * 100;
  //     setSvgHeight(newHeight);
  //   }
  //    else if ( indexOfOrientation === 2) {
  //     // const newWidth = calculateMaxWidth(treeData);
  //     // newHeight = newWidth * (indexOfOrientation === 1 ? 100 : 100);
  //     newHeight=400;
  //     setSvgHeight(newHeight);
  //   }
  //   else if (indexOfOrientation === 3 || indexOfOrientation === 1) {
  //     setSvgHeight(400);
  //   }

  //   console.log(`Updated svgHeight: ${newHeight}`);
  // }, [indexOfOrientation, treeData, calculateDepth, calculateMaxWidth]); // Remove svgHeight from dependencies

  // useEffect(() => {
  //   if (indexOfOrientation === 0) {
  //     const newDepth = calculateDepth({ ...treeData });
  //     setSvgHeight(newDepth * 100);
  //   } else if (indexOfOrientation === 2) {
  //     const newDepth = calculateDepth({ ...treeData });
  //     setSvgHeight(newDepth * 100);
  //   } else if (indexOfOrientation === 3) {
  //     const newWidth = calculateMaxWidth({ ...treeData });
  //     setSvgHeight(newWidth * 100);
  //   } else if (indexOfOrientation === 1) {
  //     const newWidth = calculateMaxWidth({ ...treeData });
  //     setSvgHeight(newWidth * 75);
  //     setHeight(newWidth * 75);
  //   }
  //   console.log(`this is svgHeight ${svgHeight}`);
  // }, [indexOfOrientation, treeData,svgHeight,calculateDepth,calculateMaxWidth]);

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

  // const generateLatexCode = (node, parentLabel = "") => {
  //   if (!node) {
  //     return "";
  //   }
  //   let nodeLabel = isChecked ? `$${node.value}$` : node.value;
  //   let latexCode = "[\n  " + nodeLabel;

  //   if (parentLabel) {
  //     latexCode += `, edge label={node[midway,right,font=\\scriptsize,inner sep=1pt]{${parentLabel.text}}}`;
  //   }

  //   if (node.children && node.children.length > 0) {
  //     const childStrings = node.children.map((child) => {
  //       let childLabel = child.label
  //         ? { text: child.label, position: "right" }
  //         : "";
  //       return generateLatexCode(child, childLabel);
  //     });
  //     latexCode += childStrings.join("\n").replace(/^/gm, "  ");
  //   }

  //   latexCode += "\n]";

  //   return latexCode;
  // };

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
    }
    else if (includeDocumentTags) {
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
  

  return (
    <div className="TreeDiv">
      <h1>Abstract Syntax Tree</h1>

      <div class="containerText">
        <p id="question" style={{ fontWeight: "bold" }}>
          How to use ?
        </p>
        {/* <div></div> */}
        <p>
          <b>1.</b> Click on Create Tree button and type in the value of the root node.
        </p>
        <p>
        <b>2.</b> Click on the node you want to expand and enter the value of the
          child.
        </p>
        <p>
        <b>3.</b> If you want to label the edge, click on the edge and enter the
          label you want.
        </p>
        <p><b>4.</b> Using Turn Left button you can turn the tree 90 degrees to the left.</p>
        <p><b>5.</b> By using right click on the node you can remove the node from the tree structure.</p>
        <p></p>
      </div>
      <div className="settings">
        <button id="createTree" onClick={handleCreateTree}>
          Create New Tree
        </button>
      </div>
      <div className="settings">
        <label htmlFor="math">Mathematical font </label>
        <input
          type="checkbox"
          id="math"
          name="math"
          value="math"
          checked={isChecked}
          onChange={() => setIsChecked(!isChecked)}
        />
        <button
          id="buttonMath"
          // onClick={() => handleOptionChange(false)}
          onClick={handleOrientationClick}
          // onClick={() => setTreeOrientation("top-down")}
          // style={{ backgroundColor: "#7393B3" }}
        >
          Turn Left
        </button>
        {/* <button
        id="buttonNoMath"
        onClick={() => handleOptionChange(true)}
        style={{ backgroundColor: isHorizontal === true ? "#7393B3" : "white" }}
      >
        Horizontal
      </button> */}
      </div>

      <div className="Tree">
        <svg
          ref={svgRef}
          width={600}
          height={600}
          // height={1000}
          onClick={() => setTreeData(null)} // Clear selection when clicking on the background
        />
      </div>
      <div className="settingsLatex">
        <label htmlFor="includePreamble">Include whole LaTeX Preamble</label>
        <input
          type="checkbox"
          id="includePreamble"
          checked={includePreamble}
          onChange={() => setIncludePreamble(!includePreamble)}
        />

        <label htmlFor="includeDocumentTags">
          Include import of the forest package
        </label>
        <input
          type="checkbox"
          id="includeDocumentTags"
          checked={includeDocumentTags}
          onChange={() => setIncludeDocumentTags(!includeDocumentTags)}
        />
      </div>

      <button id="generateBtn" onClick={handleGenerateLatex}>
        Generate LaTeX
      </button>
      <GeneratedCode id="generatedCode" code={generatedCode}></GeneratedCode>
    </div>
  );
};

export default SyntaxTreeD3;
