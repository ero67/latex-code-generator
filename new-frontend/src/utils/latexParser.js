/**
 * LaTeX Parser for Proof Trees
 * Converts bussproofs LaTeX code back to proof tree data structure
 */

// Helper function to extract content from LaTeX commands
const extractContent = (command, text) => {
  const regex = new RegExp(`\\\\${command}\\{([^}]*)\\}`);
  const match = text.match(regex);
  return match ? match[1] : '';
};

// Helper function to remove math mode formatting
const cleanMathMode = (content) => {
  return content.replace(/\$([^$]*)\$/g, '$1');
};

// Helper function to extract right label from RightLabel command
const extractRightLabel = (text) => {
  const regex = /\\RightLabel\{\\scriptsize\{([^}]*)\}\}/g;
  const match = text.match(regex);
  if (match) {
    return cleanMathMode(match[1].replace(/\\scriptsize\{([^}]*)\}/, '$1'));
  }
  return '';
};

// Helper function to determine node type based on LaTeX command
const getNodeType = (command) => {
  switch (command) {
    case 'AxiomC':
      return 'axiom';
    case 'UnaryInfC':
      return 'unary';
    case 'BinaryInfC':
      return 'binary';
    case 'TrinaryInfC':
      return 'trinary';
    case 'QuaternaryInfC':
      return 'quaternary';
    case 'QuinaryInfC':
      return 'quinary';
    default:
      return 'unknown';
  }
};

// Helper function to count children based on node type
const getChildCount = (nodeType) => {
  switch (nodeType) {
    case 'axiom':
      return 0;
    case 'unary':
      return 1;
    case 'binary':
      return 2;
    case 'trinary':
      return 3;
    case 'quaternary':
      return 4;
    case 'quinary':
      return 5;
    default:
      return 0;
  }
};

// Main parser function
export const parseLatexToProofTree = (latexCode) => {
  try {
    // Remove prooftree environment and clean up
    let cleanCode = latexCode
      .replace(/\\begin\{prooftree\}/g, '')
      .replace(/\\end\{prooftree\}/g, '')
      .replace(/\\documentclass\{[^}]*\}/g, '')
      .replace(/\\usepackage\{[^}]*\}/g, '')
      .replace(/\\begin\{document\}/g, '')
      .replace(/\\end\{document\}/g, '')
      .trim();

    // Split into lines and filter out empty lines
    const lines = cleanCode.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
      throw new Error('No valid proof tree commands found');
    }

    // Parse the proof tree structure
    const nodes = [];
    const nodeMap = new Map();
    let nodeId = 0;

    // First pass: create all nodes
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check for RightLabel
      const rightLabelMatch = trimmedLine.match(/\\RightLabel\{\\scriptsize\{([^}]*)\}\}/);
      const rightLabel = rightLabelMatch ? cleanMathMode(rightLabelMatch[1]) : '';

      // Extract the main command
      const commandMatch = trimmedLine.match(/\\(AxiomC|UnaryInfC|BinaryInfC|TrinaryInfC|QuaternaryInfC|QuinaryInfC)\{([^}]*)\}/);
      
      if (commandMatch) {
        const [, command, content] = commandMatch;
        const cleanedContent = cleanMathMode(content);
        const nodeType = getNodeType(command);
        
        const node = {
          id: nodeId++,
          content: cleanedContent,
          children: [],
          rightLabel: rightLabel,
          mathMode: content.includes('$'),
          nodeType: nodeType,
          lineIndex: index
        };

        nodes.push(node);
        nodeMap.set(index, node);
      }
    });

    if (nodes.length === 0) {
      throw new Error('No valid nodes found in LaTeX code');
    }

    // Build the tree structure
    // For proof trees, we work backwards from the conclusion
    // The last node is typically the root (conclusion)
    const rootNode = buildTreeStructure(nodes);
    
    return {
      rootNode: rootNode,
      success: true,
      message: 'Proof tree parsed successfully'
    };

  } catch (error) {
    return {
      rootNode: null,
      success: false,
      message: `Error parsing LaTeX: ${error.message}`
    };
  }
};

// Helper function to build tree structure
const buildTreeStructure = (nodes) => {
  if (nodes.length === 0) return null;
  
  // For now, create a simple structure where we assume the last node is the root
  // and we build the tree by working backwards
  const rootNode = nodes[nodes.length - 1];
  
  // Simple heuristic: for each node, try to find its children by looking at previous nodes
  // This is a simplified approach - a more sophisticated parser would analyze
  // the actual proof tree structure
  
  const processedNodes = new Set();
  const buildChildren = (node, nodeIndex) => {
    if (processedNodes.has(node.id)) return;
    processedNodes.add(node.id);
    
    const expectedChildren = getChildCount(node.nodeType);
    if (expectedChildren === 0) return;
    
    // Find children by looking at previous nodes that haven't been processed
    const availableNodes = nodes.slice(0, nodeIndex).filter(n => !processedNodes.has(n.id));
    
    // Take the last few nodes as children (simplified approach)
    const children = availableNodes.slice(-expectedChildren);
    
    // Process children recursively
    children.forEach(child => {
      const childIndex = nodes.indexOf(child);
      buildChildren(child, childIndex);
    });
    
    node.children = children;
  };
  
  // Build the tree starting from the root
  const rootIndex = nodes.indexOf(rootNode);
  buildChildren(rootNode, rootIndex);
  
  return rootNode;
};

// Advanced parser that handles more complex proof tree structures
export const parseAdvancedLatexToProofTree = (latexCode) => {
  try {
    // This is a more sophisticated parser that would handle
    // complex proof tree structures with proper dependency analysis
    
    // For now, return a basic implementation
    return parseLatexToProofTree(latexCode);
    
  } catch (error) {
    return {
      rootNode: null,
      success: false,
      message: `Error parsing advanced LaTeX: ${error.message}`
    };
  }
};

// Validation function to check if LaTeX code is valid proof tree syntax
export const validateProofTreeLatex = (latexCode) => {
  const errors = [];
  const warnings = [];

  // Check for required bussproofs commands
  const requiredCommands = ['AxiomC', 'UnaryInfC', 'BinaryInfC', 'TrinaryInfC', 'QuaternaryInfC', 'QuinaryInfC'];
  const hasValidCommand = requiredCommands.some(cmd => latexCode.includes(`\\${cmd}`));
  
  if (!hasValidCommand) {
    errors.push('No valid proof tree commands found. Expected commands: \\AxiomC, \\UnaryInfC, \\BinaryInfC, etc.');
  }

  // Check for prooftree environment
  if (!latexCode.includes('\\begin{prooftree}') || !latexCode.includes('\\end{prooftree}')) {
    warnings.push('Missing \\begin{prooftree} or \\end{prooftree} environment');
  }

  // Check for balanced braces
  const openBraces = (latexCode.match(/\{/g) || []).length;
  const closeBraces = (latexCode.match(/\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push('Unbalanced braces in LaTeX code');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
};

export default {
  parseLatexToProofTree,
  parseAdvancedLatexToProofTree,
  validateProofTreeLatex
};
