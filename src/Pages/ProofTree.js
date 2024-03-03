// NOTE DONE : PROOF TREES : right label nech ma mensiu velkost pisma jak nazvy v nodoch
// NOTE DONE: PROOF TREES : dat na vyber ci generovat takto {$E \to B$} abo takto {E  $\to$  B}.
//                     To znamena ze dat na vyber ci vsetko bude v matematickom pisme to znamena ze $takto$ alebo nie
// NOTE DONE: PROOF TREES : namiesto tlacitok hore pre davanie specialnych znakov pridat ze ak napise "\" tak mu to da na vyber tie specialne znaky, jak taky autocomplete cca
// NOTE DONE: PROOF TREES : podpora az 5tich potomkov https://mathweb.ucsd.edu/~sbuss/ResearchWeb/bussproofs/BussGuide2_Smith2012.pdf
import React, { useState } from "react";
import "./index.css";
import GeneratedCode from "../Components/GeneratedCode";
import LatexInput from "../Components/LatexInput";

// ProofTreeNode Data Structure
let nodeId = 0;
const createProofTreeNode = (content = "", children = [], rightLabel = "") => {
  return { id: nodeId++, content, children, rightLabel };
};

// const specialSymbols = {
//   "→": " $\\to$ ",
//   "∧": " $\\land$ ",
//   "∨": " $\\lor$ ",
//   "¬": " $\\neg$ ",
//   // Add more symbols as needed
// };

// ProofTree Component
const ProofTree = () => {
  const [rootNode, setRootNode] = useState(createProofTreeNode());
  const [generatedCode, setGeneratedCode] = useState(
    "Your code will appear here \n after you click on Generate Code button"
  );
  // const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [math_notation, setMathNotation] = useState(false);

  const handleOptionChange = (option) => {
    setMathNotation(option);
  };
  const addNode = (parentId) => {
    const stack = [rootNode];
    let found = false;

    while (stack.length > 0 && !found) {
      const currentNode = stack.pop();

      if (currentNode.id === parentId && currentNode.children.length < 5) {
        currentNode.children.push(createProofTreeNode());
        found = true; // Node added, exit the loop
      } else {
        // Add children to the stack for further processing
        currentNode.children.forEach((child) => stack.push(child));
      }
    }

    if (found) {
      setRootNode({ ...rootNode });
    } else {
      console.log("Parent node not found.");
    }
  };

  // function to edit the content of a node based on its ID
  const editNodeContent = (nodeId, newContent) => {
    const stack = [rootNode];
    while (stack.length > 0) {
      const currentNode = stack.pop();

      if (currentNode.id === nodeId) {
        currentNode.content = newContent;
        break;
      }

      // adding children to the stack... so they are processed
      currentNode.children.forEach((child) => stack.push(child));
    }

    setRootNode({ ...rootNode });
  };

  const editNodeRightLabel = (nodeId, newRightLabel) => {
    const stack = [rootNode];
    while (stack.length > 0) {
      const currentNode = stack.pop();

      if (currentNode.id === nodeId) {
        currentNode.rightLabel = newRightLabel;
        break; // Stop the loop as we've found and updated the node
      }

      // Add children to the stack for further processing
      currentNode.children.forEach((child) => stack.push(child));
    }

    setRootNode({ ...rootNode });
  };

  // const insertSymbol = (symbolLatex) => {
  //   if (selectedNodeId != null) {
  //     // Find the selected node by ID and update its content
  //     const updateNodeContent = (node, newSymbol) => {
  //       if (node.id === selectedNodeId) {
  //         // Append the new symbol to the current content of the node
  //         return { ...node, content: node.content + newSymbol };
  //       } else if (node.children) {
  //         // Recursively update children
  //         return {
  //           ...node,
  //           children: node.children.map((child) =>
  //             updateNodeContent(child, newSymbol)
  //           ),
  //         };
  //       }
  //       return node;
  //     };

  //     // Create a new tree with the updated content
  //     const newRoot = updateNodeContent(rootNode, symbolLatex);
  //     setRootNode(newRoot);
  //   }
  // };

  // function to render the tree nodes
  const renderTreeNode = (node) => {
    return (
      <div className="proof-tree-node">
        {/* render content of current node */}
        <div className="proof-tree-content">
          <LatexInput
            value={node.content}
            onChange={(value) => editNodeContent(node.id, value)}
            mathNotation={math_notation}
          />

          {/* Conditionally render the right label input only if this is a child node */}
          {node.children.length > 0 && (
            <LatexInput
              value={node.rightLabel}
              onChange={(value) => editNodeRightLabel(node.id, value)}
              mathNotation={math_notation}
            />
          )}

          <button onClick={() => addNode(node.id)}>Add Child</button>
        </div>
        <div className="proof-tree-children">
          {node.children.map((child) => renderTreeNode(child, true))}
        </div>
      </div>
    );
  };

  //  /* <input
  //               type="text"
  //               value={node.rightLabel}
  //               placeholder="Right label"
  //               // onFocus={() => setSelectedNodeId(node.id)}
  //               onChange={(e) => editNodeRightLabel(node.id, e.target.value)}
  //             /> */

  // Render buttons for each special symbol
  // const renderSymbolButtons = () => {
  //   return Object.entries(specialSymbols).map(([symbol, latex]) => (
  //     <button
  //       className="symbolBtn"
  //       key={symbol}
  //       onClick={() => insertSymbol(latex)}
  //     >
  //       {symbol}
  //     </button>
  //   ));
  // };

  const generateLatexCode = (node) => {
    let code = "";

    // Generate code for children first
    let childrenCode = "";
    for (let i = 0; i < node.children.length; i++) {
      const childLatexCode = generateLatexCode(node.children[i]);
      childrenCode += childLatexCode;
      if (i < node.children.length - 1) {
        childrenCode += " "; // Add a space between codes, but not after the last one
      }
    }

    // Determine the appropriate command based on the number of children
    let nodeCommand = "";
    if (node.children.length === 0) {
      if (math_notation === false) {
        nodeCommand = `     \\AxiomC{${node.content}}`;
      } else {
        nodeCommand = `     \\AxiomC{$${node.content}$}`;
      }
    } else if (node.children.length === 1) {
      if (math_notation === false) {
        nodeCommand = `     \\UnaryInfC{${node.content}}`;
      } else {
        nodeCommand = `     \\UnaryInfC{$${node.content}$}`;
      }
    } else if (node.children.length === 2) {
      if (math_notation === false) {
        nodeCommand = `    \\BinaryInfC{${node.content}}`;
      } else {
        nodeCommand = `    \\BinaryInfC{$${node.content}$}`;
      }
    } else if (node.children.length === 3) {
      if (math_notation === false) {
        nodeCommand = `     \\TrinaryInfC{${node.content}}`;
      } else {
        nodeCommand = `     \\TrinaryInfC{$${node.content}$}`;
      }
    } else if (node.children.length === 4) {
      if (math_notation === false) {
        nodeCommand = `     \\QuinaryInfC{${node.content}}`;
      } else {
        nodeCommand = `     \\QuinaryInfC{$${node.content}$}`;
      }
    } else if (node.children.length === 5) {
      if (math_notation === false) {
        nodeCommand = `     \\QuaternaryInfC{${node.content}}`;
      } else {
        nodeCommand = `     \\QuaternaryInfC{$${node.content}$}`;
      }
    }

    // If the node has a right label, it should come before the node's inference command
    if (node.rightLabel) {
      // code = `${childrenCode} \\RightLabel{${node.rightLabel}} ${nodeCommand}\n`;
      if(math_notation === false){
        code = `${childrenCode}       \\RightLabel{\\scriptsize{${node.rightLabel}}}\n ${nodeCommand}\n`;
    } else {
        code = `${childrenCode}       \\RightLabel{\\scriptsize{$${node.rightLabel}$}}\n ${nodeCommand}\n`;
    }
  }
    else{
      code = `${childrenCode} ${nodeCommand} \n`;

    }
  

    return code;
  };

  const generateBtn = () => {
    const proofTreeCode = generateLatexCode(rootNode);
    setGeneratedCode(
      `\\begin{prooftree}\n${proofTreeCode}\n   \\end{prooftree}`
    );
  };

  return (
    <div className="proof-tree-container">
      <h1>Proof Tree</h1>
      <div id="buttonsPT">
      <button
        id="buttonMath"
        onClick={() => handleOptionChange(true)}
        style={{ backgroundColor: math_notation === true ? "#7393B3" : "white" }}
      >
        Math
      </button>
      <button
        id="buttonNoMath"
        onClick={() => handleOptionChange(false)}
        style={{ backgroundColor: math_notation === false ? "#7393B3" : "white" }}
      >
        No Math
      </button>

      </div>
      {/* <div className="btn-container">{renderSymbolButtons()}</div> */}
      {renderTreeNode(rootNode)}
      <div></div>
      <button id="generateBtn" onClick={() => generateBtn()}>
        Generate code{" "}
      </button>
      <GeneratedCode id="generatedCode" code={generatedCode}></GeneratedCode>
    </div>
  );
};

export default ProofTree;
