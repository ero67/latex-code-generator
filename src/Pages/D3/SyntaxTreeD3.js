// src/SyntaxTreeD3.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const SyntaxTreeD3 = () => {
  const [treeData, setTreeData] = useState(null);
  const svgRef = useRef();

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
      .attr('fill', 'grey');
      

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

  return (
    <div className='TreeDiv'>
      <button onClick={handleCreateTree}>Create Tree</button>
      <svg
        ref={svgRef}
        width={400}
        height={300}
        onClick={() => setTreeData(null)} // Clear selection when clicking on the background
      />
    </div>
  );
};

export default SyntaxTreeD3;

