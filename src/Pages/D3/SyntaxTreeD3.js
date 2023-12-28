// src/SyntaxTreeD3.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import GeneratedCode from '../GeneratedCode';

const SyntaxTreeD3 = () => {
  const [treeData, setTreeData] = useState(null);
  const svgRef = useRef();
  const [generatedCode, setGeneratedCode] = useState("Your code will appear here \n after you click on Generate Code button");

  useEffect(() => {
    if (!treeData) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create a tree layout
    const tree = d3.tree().size([400, 200]);
    console.log(treeData);

    // Create a root hierarchy from the data
    const root = d3.hierarchy(treeData);

    // Assign positions to each node
    tree(root);

    // Create an SVG container
    const svg = d3.select(svgRef.current);


    
    // Draw links
    svg
      .selectAll('path.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill','none')
      .attr('stroke','#ADADAD')
      .attr('d', d3.linkVertical().x((d) => d.x).y((d) => d.y+5));

    
    // Draw nodes
    const nodes = svg
      .selectAll('g.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x},${d.y+20})`)
      .on('click', (event, d) => handleNodeClick(event, d));

    nodes
      .append('circle')
      .attr('r', 15)
      .attr('stroke','black')
      .attr('fill', 'white');
      

    nodes
      .append('text')
      .attr('x', 0)
      .attr('dy', 5)
      .attr('text-anchor', 'middle')
      .text((d) => d.data.value);
  }, [treeData]);

  const handleNodeClick = (event, node) => {
    event.stopPropagation(); // Prevent propagation to the parent SVG
    const childValue = prompt('Enter value for the new child node:');
    if (childValue !== null) {
      const newNode = { value: childValue, children: [] };

      if (!node.data.children) {
        // If the clicked node doesn't have children array, create one
        node.data.children = [newNode];
      } else {
        // Add the new node to the children array
        node.data.children.push(newNode);
      }

      setTreeData({ ...treeData });
    }
  };

  const handleCreateTree = () => {
    const rootValue = prompt('Enter value for the root node:');
    if (rootValue !== null) {
      setTreeData({ value: rootValue, children: [] });
    }
  };


  const generateLatexCode = (node) => {
    // Recursively build the LaTeX code for the tree
    if (!node) {
      return '';
    }
  
    // let latexCode = ` [${node.value}`; // Assume node value is directly accessible
    // let latexCode =  '\\begin{forest}\n'
    let latexCode = '[';
    latexCode += node.value;
     
    if (node.children) {
      latexCode += node.children.map((child) => generateLatexCode(child)).join('');
    }
  
    latexCode += ']';

    // latexCode += '\n\\end{forest}'
  
    return latexCode;
  };

  const handleGenerateLatex = () => {
    const latexCode = `\\begin{forest}\n${generateLatexCode(treeData)}\n\\end{forest}`;
    setGeneratedCode(latexCode);
    console.log(latexCode); // You can replace this with the code to save or display the LaTeX code
  };

  return (
    
    <div className='TreeDiv'>
    <h1>Abstract syntax tree</h1>
    <div className='settings'>
      <button id='createTree' onClick={handleCreateTree}>Create Tree</button>
      
      </div>
      <div className='Tree'>
      <svg
        ref={svgRef}
        width={400}
        height={300}
        onClick={() => setTreeData(null)} // Clear selection when clicking on the background
      />
      </div>
      <button id='generateBtn' onClick={handleGenerateLatex}>Generate LaTeX</button>
      <GeneratedCode id="generatedCode" code={generatedCode}></GeneratedCode>

    </div>
   

    
  
  );
};

export default SyntaxTreeD3;

