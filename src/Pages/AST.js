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
  const [isHorizontal, setIsHorizontal] = useState(false);
  const svgRef = useRef();
  const [generatedCode, setGeneratedCode] = useState(
    "Your code will appear here \n after you click on Generate Code button"
  );

  const [nodeId, setNodeId] = useState(0);

  useEffect(() => {
    if (!treeData) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create a tree layout
    const tree = d3.tree().size([400, 200]);
    console.log(treeData);

    // Create a root hierarchy from the data
    const root = d3.hierarchy(treeData);

    // Assign positions to each node
    tree(root);

    // Create an SVG container
    const svg = d3.select(svgRef.current);

//Create initial links and nodes for horizontal tree
    if(isHorizontal){
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
             .x((d) => d.y+5)
            .y((d) => d.x)
            
        )
        .on("click", (event, d) => handleLinkClick(event, d)); // Pass both event and link data
  
        
  
  
        const nodes = svg
        .selectAll("g.node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${d.y + 20},${d.x})`)
        .on("click", (event, d) => handleNodeClick(event, d));
      
  
      nodes
        .append("circle")
        .attr("r", 15)
        .attr("stroke", "black")
        .attr("fill", "white");
  
      nodes
        .append("text")
        .attr("x", 0)
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .text((d) => d.data.value);
      }

      //Create initial links and nodes for vertical tree
      else{
        svg
        .selectAll("path.link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none")
        // .attr("stroke","transparent") // Invisible stroke
        // .attr("stroke-width", "10px") // Wider stroke for easier clicking
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
    
      // Draw nodes
      const nodes = svg
        .selectAll("g.node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${d.x},${d.y + 20})`)
        .on("click", (event, d) => handleNodeClick(event, d));
  
      nodes
        .append("circle")
        .attr("r", 15)
        .attr("stroke", "black")
        .attr("fill", "white");
  
      nodes
        .append("text")
        .attr("x", 0)
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .text((d) => d.data.value);
      }

      svg.selectAll(".link-label")
        .data(root.links())
        .enter()
        .append("text")
        .attr("class", "link-label")
        .attr("fill", "black") // Set the text color to ensure visibility
        .attr("text-anchor", "middle") // Center the text on its position
        .attr("dy", "0.35em") // Vertically center the text
        .each(function(d) {
          var midX=null;
          var midY=null;
          if(isHorizontal){
            // Calculate the midpoint for each link
             midX = (d.source.x + d.target.x) / 2;
             midY = (d.source.y + d.target.y) / 2;
            // Position the label at the midpoint
            d3.select(this)
              .attr("x", midY + 10) 
              .attr("y", midX);
          }
          else{
            // Calculate the midpoint for each link in a vertical layout
             midY = (d.source.y + d.target.y) / 2 + 10; // Midpoint's X position (horizontal)
             midX = (d.source.x + d.target.x) / 2; // Midpoint's Y position (vertical)
            // Position the label at the midpoint
            d3.select(this)
              .attr("x", midX)
              .attr("y", midY);
          }
              console.log("this is the source");
              console.log(d.source);
              console.log("this is the target");
              console.log(d.target);
        })
        .text(d => d.target.data.label || ''); // Use the label from the target node data
    });

   

    const handleNodeClick = useCallback(
      (event, node) => {
        // event.stopPropagation(); // Prevent propagation to the parent SVG
        const childValue = prompt("Enter value for the new child node:");
        if (childValue !== null) {
          const newNode = { id: nodeId ,value: childValue, children: [], label: ""};
          setNodeId(nodeId + 1);
          if (!node.data.children) {
            // If the clicked node doesn't have children array, create one
            node.data.children = [newNode];
          } else {
            // Add the new node to the children array
            node.data.children.push(newNode);
          }
  
          setTreeData({ ...treeData });
        }
      },
      [treeData, nodeId]
    );

    const handleLinkClick = useCallback((event, link) => {
      // Prevent the event from bubbling to avoid triggering click events on other elements
      // event.stopPropagation();
  
      const newLabel = prompt("Enter label for the edge:");
      if (newLabel !== null && newLabel !== "") {
          const updateLabelInTreeData = (node, sourceId, targetId, newLabel) => {
              if (node.id === sourceId) {
                  node.children = node.children.map(child => {
                      if (child.id === targetId) {
                          return { ...child, label: newLabel }; // Update the label
                      }
                      return child;
                  });
              }
              if (node.children) {
                  node.children.forEach(child => updateLabelInTreeData(child, sourceId, targetId, newLabel));
              }
          };
  
          // Clone the tree data to ensure changes are detected by React
          const newTreeData = { ...treeData };
          updateLabelInTreeData(newTreeData, link.source.data.id, link.target.data.id, newLabel);
          setTreeData(newTreeData);
      }
  }, [treeData]);

    

  const handleOptionChange = (isHorizontal) => {
    setIsHorizontal(isHorizontal);
  };

  const handleCreateTree = () => {
    const rootValue = prompt("Enter value for the root node:");
    if (rootValue !== null) {
      setTreeData({ value: rootValue, children: [], label: ""});
    }
  };

  // const generateLatexCode = (node) => {
  //   // Recursively build the LaTeX code for the tree
  //   if (!node) {
  //     return "";
  //   }

  //   // let latexCode = ` [${node.value}`; // Assume node value is directly accessible
  //   // let latexCode =  '\\begin{forest}\n'
  //   let latexCode = "[";
  //   if (isChecked) {
  //     latexCode += `$${node.value}$`;
  //   } else {
  //     latexCode += node.value;
  //   }
  //   // latexCode += node.value;

  //   if (node.children) {
  //     latexCode += node.children
  //       .map((child) => generateLatexCode(child))
  //       .join("");
  //   }

  //   latexCode += `,edge label={node[midway,left,font=\\scriptsize]{Label 1}}]`;

  //   // latexCode += '\n\\end{forest}'

  //   return latexCode;
  // };

  const generateLatexCode = (node, parentLabel = "") => {
    if (!node) {
      return "";
    }
    // Start the LaTeX code for the current node. Use $ for math mode if isChecked is true.
    let nodeLabel = isChecked ? `$${node.value}$` : node.value;
    let latexCode = "[\n  " + nodeLabel; // Add a new line and indent for readability.
  
    // If there is a parent label, add the edge label to the current node in LaTeX format.
    if (parentLabel) {
      latexCode += `, edge label={node[midway,${parentLabel.position},font=\\scriptsize]{${parentLabel.text}}}`;
    }
  
    // If the current node has children, recursively generate their LaTeX code.
    if (node.children && node.children.length > 0) {
      const childStrings = node.children.map((child, index) => {
        // Create an edge label object with text and position .
        let childLabel = child.label ? {text: child.label, position: index % 2 === 0 ? "left" : "right"} : "";
        return generateLatexCode(child, childLabel);
      });
      // Join all children LaTeX code with new lines for readability and indentations.
      latexCode += childStrings.join("\n").replace(/^/gm, '  '); // Add indentation to each line of child code.
    }
  
    latexCode += "\n]"; // Close the current node's LaTeX code block.
  
    return latexCode;
  };
  
  

  const handleGenerateLatex = () => {
    let latexCode = "";
    if(!isHorizontal){
      latexCode = `\\begin{forest}\n${generateLatexCode(treeData)}\n\\end{forest}`;
    }
    else{
      latexCode = `\\begin{forest}
      for tree ={grow'= 0,}
      ${generateLatexCode(treeData)}\n\\end{forest}`;
    }
    setGeneratedCode(latexCode);
    // console.log(latexCode);
    console.log(isChecked);
  };

  return (
    <div className="TreeDiv">
      <h1>Abstract syntax tree</h1>

      <div class="containerText">
        <p id="question" style={{ fontWeight: "bold" }}>
          How to use ?
        </p>
        {/* <div></div> */}
        <p>
          1. Click on Create Tree button and type in the value of the root node.
        </p>
        <p>
          2. Click on the node you want to expand and enter the value of the
          child.
        </p>
        <p>
          3. If you want to label the edge, click on the edge and enter the label you want.
        </p>
        <p>4. After you are finished, generated the code for created tree.</p>
        <p></p>
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
        onClick={() => handleOptionChange(false)}
        style={{ backgroundColor: isHorizontal === false ? "#7393B3" : "white" }}
      >
        Vertical
      </button>
      <button
        id="buttonNoMath"
        onClick={() => handleOptionChange(true)}
        style={{ backgroundColor: isHorizontal === true ? "#7393B3" : "white" }}
      >
        Horizontal
      </button>
    </div>
      <div className="settings">
        <button id="createTree" onClick={handleCreateTree}>
          Create Tree
        </button>
      </div>
      <div className="Tree">
        <svg
          ref={svgRef}
          width={500}
          height={500}
          onClick={() => setTreeData(null)} // Clear selection when clicking on the background
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
