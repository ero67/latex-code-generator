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
// const createProofTreeNode = (content = "", children = [], rightLabel = "") => {
//   return { id: nodeId++, content, children, rightLabel };
// };

const createProofTreeNode = (content = "", children = [], rightLabel = "", mathMode = false) => {
  return { id: nodeId++, content, children, rightLabel, mathMode };
};


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

  const [includePreamble, setIncludePreamble] = useState(false);
  const [includeDocumentTags, setIncludeDocumentTags] = useState(false);

  const toggleMathModeForAllNodes = (node, mathMode) => {
    node.mathMode = mathMode; // Set mathMode for the current node
    node.children.forEach(child => toggleMathModeForAllNodes(child, mathMode)); // Recursively set for children
  };
  
  const handleMathNotationChange = () => {
    const newMathMode = !math_notation;
    setMathNotation(newMathMode);
  
    // Create a deep copy of rootNode to ensure immutability
    const rootNodeCopy = JSON.parse(JSON.stringify(rootNode));
    toggleMathModeForAllNodes(rootNodeCopy, newMathMode);
    setRootNode(rootNodeCopy); // Update the rootNode with new mathMode settings
  };
  


  const toggleMathMode = (nodeId, isMathMode) => {
    // Logic to update the specific node's mathMode property
    const updateMathMode = (node) => {
      if (node.id === nodeId) {
        node.mathMode = isMathMode;
      } else {
        node.children.forEach(updateMathMode);
      }
    };
    updateMathMode(rootNode);
    setRootNode({...rootNode});
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

  const removeNode = (nodeIdToRemove) => {
    const removeNodeRecursive = (currentNode, nodeIdToRemove) => {
      for (let i = 0; i < currentNode.children.length; i++) {
        if (currentNode.children[i].id === nodeIdToRemove) {
          currentNode.children.splice(i, 1); // Remove the node
          return true; // Node found and removed
        }
  
        // Recurse into children
        if (removeNodeRecursive(currentNode.children[i], nodeIdToRemove)) {
          return true; // Node found and removed in deeper level
        }
      }
      return false; // Node not found in this branch
    };
  
    // Start the recursive removal process
    if (!removeNodeRecursive(rootNode, nodeIdToRemove)) {
      console.log("Node not found.");
    } else {
      setRootNode({ ...rootNode }); // Update state to trigger re-render
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
  // const renderTreeNode = (node) => {
  //   return (
  //     <div className="proof-tree-node">
  //       {/* render content of current node */}
  //       <div className="proof-tree-content">
  //         <LatexInput
  //           value={node.content}
  //           onChange={(value) => editNodeContent(node.id, value)}
  //           mathNotation={math_notation}
  //         />

  //         {/* Conditionally render the right label input only if this is a child node */}
  //         {node.children.length > 0 && (
  //           <LatexInput
  //             value={node.rightLabel}
  //             onChange={(value) => editNodeRightLabel(node.id, value)}
  //             mathNotation={math_notation}
  //           />
  //         )}

  //         <button onClick={() => addNode(node.id)}>Add Child</button>
  //       </div>
  //       <div className="proof-tree-children">
  //         {node.children.map((child) => renderTreeNode(child, true))}
  //       </div>
  //     </div>
  //   );
  // };


  const renderTreeNode = (node, isRoot = true) => {
    return (
      <div className="proof-tree-node">
        <div className="proof-tree-content">
          <div className="node-input-group">
            <label htmlFor={`node-content-${node.id}`}>Node Content</label>
            <LatexInput
              id={`node-content-${node.id}`}
              value={node.content}
              onChange={(value) => editNodeContent(node.id, value)}
              mathNotation={math_notation}
            />
            {/* Checkbox for Math Mode */}
        
          </div>
  
          {node.children.length > 0 && (
            <div className="node-input-group">
              <label htmlFor={`node-right-label-${node.id}`}>Right Label</label>
              <LatexInput
                id={`node-right-label-${node.id}`}
                value={node.rightLabel}
                onChange={(value) => editNodeRightLabel(node.id, value)}
                mathNotation={math_notation}
              />
            </div>
          )}
          <div className="node-action-buttons">
          <button className="add-child-btn" onClick={() => addNode(node.id)}>+</button>
          {!isRoot && ( // Conditionally show the Remove Node button
            <button className="remove-child-btn" onClick={() => removeNode(node.id)}>
              <b>-</b>
            </button>
          )}

          {/* <div> */}
          <input
            type="checkbox"
            checked={node.mathMode}
            onChange={(e) => toggleMathMode(node.id, e.target.checked)}
            id={`math-mode-${node.id}`}
          />
          {/* <label htmlFor={`math-mode-${node.id}`}>Math Mode</label> */}
        {/* </div> */}
          </div>
        </div>
  
        <div className="proof-tree-children">
          {node.children.map(child => renderTreeNode(child, false))} {/* Mark children as non-root */}
        </div>
      </div>
    );
  };
  



const generateLatexCode = (node) => {
  let code = "";

  // Improved function to conditionally wrap content in math mode
  // and ensure LaTeX commands are always correctly formatted
  const formatContent = (content, mathMode) => {
      // This regular expression finds LaTeX commands
      const regex = /(\\[a-zA-Z]+){1}(\{[^}]*\})?/g; // Match commands, possibly followed by their arguments in {}
      let formattedContent = content.replace(regex, (match) => `$${match}$`); // Wrap each found command with $...$
      if (mathMode) {
          // If the entire content is in math mode, wrap everything once instead of individual components
          formattedContent = `$${formattedContent.replace(/\$/g, '')}$`; // Remove inner $ signs and wrap the whole content
      }
      return formattedContent;
  };

  // Generate code for children first
  let childrenCode = node.children.map(child => generateLatexCode(child)).join(' ');

  // Determine the appropriate command based on the number of children
  let nodeCommand = "";
  const contentInMathMode = formatContent(node.content, node.mathMode); // Apply math mode if needed

  switch(node.children.length) {
      case 0:
          nodeCommand = `\\AxiomC{${contentInMathMode}}`;
          break;
      case 1:
          nodeCommand = `\\UnaryInfC{${contentInMathMode}}`;
          break;
      case 2:
          nodeCommand = `\\BinaryInfC{${contentInMathMode}}`;
          break;
      case 3:
          nodeCommand = `\\TrinaryInfC{${contentInMathMode}}`;
          break;
      case 4:
          nodeCommand = `\\QuaternaryInfC{${contentInMathMode}}`;
          break;
      case 5:
          nodeCommand = `\\QuinaryInfC{${contentInMathMode}}`;
          break;
      default:
          console.log("Unsupported number of children");
          break;
  }

  // If the node has a right label, adjust for math mode
  if (node.rightLabel) {
      const rightLabelInMathMode = formatContent(node.rightLabel, node.mathMode); // Apply node's math mode to right label
      code = `${childrenCode} \\RightLabel{\\scriptsize{${rightLabelInMathMode}}}\n${nodeCommand}\n`;
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
    latexCode += "\\documentclass{article}\n\\usepackage{bussproofs}\n\\begin{document}\n";
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


  return (
    <div className="proof-tree-container">
      <h1>Proof Tree</h1>
      <div class="containerText">
        <p id="question" style={{ fontWeight: "bold" }}>
          How to use ?
        </p>
        {/* <div></div> */}
        <p>
        <b>1.</b> Choose if you want to use mathematical font or not by clicking on
          the checkbox.
        </p>
        <p>
        <b>2.</b> Put the content of the node in the input field.
        </p>
        <p>
          <b>3.</b> To add a child node click on the "+" button, to remove node click the "-" button.
        </p>
        <p><b>4.</b> If you want to put a Right Label between parent and child node fill the bottom input field .</p>
        <p><b>5.</b> You can also select which nodes should have math mode one by clicking the checkbox in the node.</p>
        <p></p>
        
      </div>
      <div id="buttonsPT">
      {/* <button
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
      </button> */}
      <label htmlFor="math" >Mathematical font </label>
      <input
        type="checkbox"
        id="math"
        name="math"
        value="math"
        checked={math_notation}
        // onChange={() => setMathNotation(!math_notation)}
        onChange={handleMathNotationChange}
      />

      </div>
      {/* <div className="btn-container">{renderSymbolButtons()}</div> */}
      {renderTreeNode(rootNode)}
      <div></div>
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
      <button  id="generateBtn" onClick={() => generateBtn()}>
        Generate code{" "}
      </button>
      <GeneratedCode id="generatedCode" code={generatedCode}></GeneratedCode>
    </div>
  );
};

export default ProofTree;
