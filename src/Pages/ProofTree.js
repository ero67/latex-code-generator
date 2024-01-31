// import React, { useState, useEffect } from 'react';

import React, { useState } from 'react';
import './index.css'
import GeneratedCode from '../Components/GeneratedCode';

// ProofTreeNode Data Structure
let nodeId = 0;
const createProofTreeNode = (content = '', children = [], rightLabel = '') => {
  return { id: nodeId++, content, children, rightLabel };
};

const specialSymbols = {
  '→': ' $\\to$ ',
  '∧': ' $\\land$ ',
  '∨': ' $\\lor$ ',
  '¬': ' $\\neg$ ',
  // Add more symbols as needed
};

// ProofTree Component
const ProofTree = () => {
  const [rootNode, setRootNode] = useState(createProofTreeNode());
  const [generatedCode, setGeneratedCode] = useState("Your code will appear here \n after you click on Generate Code button");
  const [selectedNodeId, setSelectedNodeId] = useState(null);


  const addNode = (parentId) => {
    
    const stack = [rootNode];
    let found = false;
  
    while (stack.length > 0 && !found) {
      const currentNode = stack.pop();
  
      if (currentNode.id === parentId && currentNode.children.length < 3) {
        currentNode.children.push(createProofTreeNode());
        found = true; // Node added, exit the loop
      } else {
        // Add children to the stack for further processing
        currentNode.children.forEach(child => stack.push(child));
      }
    }
  
    if (found) {
      setRootNode({ ...rootNode });
    } else {
      console.log("Parent node not found.");
    }
  };



  const editNodeContent = (nodeId, newContent) => {
    const stack = [rootNode];
    while (stack.length > 0) {
      const currentNode = stack.pop();
  
      if (currentNode.id === nodeId) {
        currentNode.content = newContent;
        break;
      }
  
      // Add children to the stack to be processed
      currentNode.children.forEach(child => stack.push(child));
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
      currentNode.children.forEach(child => stack.push(child));
    }
  
    setRootNode({ ...rootNode });
  };


  
  const insertSymbol = (symbolLatex) => {
    if (selectedNodeId != null) {
      // Find the selected node by ID and update its content
      const updateNodeContent = (node, newSymbol) => {
        if (node.id === selectedNodeId) {
          // Append the new symbol to the current content of the node
          return { ...node, content: node.content + newSymbol };
        } else if (node.children) {
          // Recursively update children
          return { ...node, children: node.children.map(child => updateNodeContent(child, newSymbol)) };
        }
        return node;
      };
  
      // Create a new tree with the updated content
      const newRoot = updateNodeContent(rootNode, symbolLatex);
      setRootNode(newRoot);
    }
  };
  




  const renderTreeNode = (node) => {
    return (
      <div className='proof-tree-node'> 
        {/* render content of current node */}
        <div className='proof-tree-content'>
        <input
             type="text"
             value={node.content}
             onFocus={() => setSelectedNodeId(node.id)}
            //  onClick={() => setSelectedNodeId(node.id)}
             onChange={(e) => editNodeContent(node.id, e.target.value)}
           />
          
          {/* Conditionally render the right label input only if this is a child node */}
          {node.children.length > 0 && (
            <input
              type="text"
              value={node.rightLabel}
              placeholder="Right label"
              onChange={(e) => editNodeRightLabel(node.id, e.target.value)}
            />
          )}
          
          <button onClick={() => addNode(node.id)}>Add Child</button>
        </div>
        <div className='proof-tree-children'>
          {node.children.map((child) => renderTreeNode(child, true))}
        </div>
      </div>
    );
  };
  


  // Render buttons for each special symbol
  const renderSymbolButtons = () => {
    return Object.entries(specialSymbols).map(([symbol, latex]) => (
      <button className='symbolBtn' key={symbol} onClick={() => insertSymbol(latex)}>
        {symbol}
      </button>
    ));
  };
  
  
  // // Function to generate LaTeX code
  // const generateLatexCode = (node) => {
  //   let code = '';
  
  

  //   // Base case: If the node has no children, return it as an axiom
  //   if (node.children.length === 0) {
  //     code = `    \\AxiomC{${node.content}} \n`;
  //   } 
    
    
  //   else {
  //     // Generate code for children and apply the right inference command
  //     const childrenCode = node.children.map(generateLatexCode).join(' ');
  //     let nodeCommand = '   \\UnaryInfC';
  //     if (node.children.length === 2) {
  //       nodeCommand = '    \\BinaryInfC';
  //     } else if (node.children.length === 3) {
  //       nodeCommand = '    \\TrinaryInfC';
  //     }
  
  //     code = `${childrenCode} ${nodeCommand}{${node.content}} \n`;
  //   }
  //   // Add the right label if it exists and this is not the root node
  //   if (node.rightLabel && node.children.length > 0) {
  //     code += `    \\RightLabel{${node.rightLabel}}\n`;
  //   }
    
  
  //   return code;
  // };
  const generateLatexCode = (node) => {
    let code = '';
  
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
    let nodeCommand = '';
    if (node.children.length === 0) {
      nodeCommand = `     \\AxiomC{${node.content}}`;
    } else if (node.children.length === 1) {
      nodeCommand = `     \\UnaryInfC{${node.content}}`;
    } else if (node.children.length === 2) {
      nodeCommand = `    \\BinaryInfC{${node.content}}`;
    } else if (node.children.length === 3) {
      nodeCommand = `     \\TrinaryInfC{${node.content}}`;
    }
  
    // If the node has a right label, it should come before the node's inference command
    if (node.rightLabel) {
      code = `${childrenCode} \\RightLabel{${node.rightLabel}} ${nodeCommand}\n`;
    } else {
      code = `${childrenCode} ${nodeCommand} \n`;
    }
  
    return code;
  };
  
  

  const generateBtn = () => {
    const proofTreeCode = generateLatexCode(rootNode);
    setGeneratedCode(`\\begin{prooftree}\n${proofTreeCode}\n   \\end{prooftree}`);
  };
  

  return (
    <div className="proof-tree-container">
      <h1>Proof Tree</h1>
      <div className='btn-container'>{renderSymbolButtons()}</div>
      {renderTreeNode(rootNode)}
      <div>
      </div>
      <button id="generateBtn" onClick={()=>generateBtn()}>Generate code </button>
      <GeneratedCode id="generatedCode"  code={generatedCode}></GeneratedCode>
    </div>
    
  );
};

export default ProofTree;


