// NOTE DONE : AST : dat na vyber ci pri generovani maju byt ohranicene hodnoty v nodoch " $ $" ... matematickep pismo ci co
// TODO: AST : dat na vyber ako chcem mat otoceny strom
// TODO: AST : dat moznost pomenovat hrany (kill me pls)

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

    // Draw links
    if(isHorizontal){
    svg
      .selectAll("path.link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#ADADAD")
      .attr(
        "d",
        d3
          .linkHorizontal()
           .x((d) => d.y+10)
          .y((d) => d.x)
          
      )
      .on("click", () => handleLinkClick());

      // // Adding labels to the links
      // svg.selectAll(".link-label")
      // .data(root.links())
      // .enter()
      // .append("text")
      // .attr("class", "link-label")
      // .attr("fill", "black") // Set the text color
      // .attr("transform", function(d) {
      //     var midX = (d.source.x + d.target.x) / 2;
      //     var midY = (d.source.y + d.target.y) / 2 + 10; // Adjusted to align with your link's curve
      //     return "translate(" + midY + "," + midX + ")";
      // })
      // .attr("dy", ".35em")
      // .attr("text-anchor", "middle")
      // .text("label");

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
    else{
      svg
      .selectAll("path.link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#ADADAD")
      .attr(
        "d",
        d3
          .linkVertical()
          .x((d) => d.x)
          .y((d) => d.y + 5)
          
      );

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
  });

  const handleNodeClick = useCallback(
    (event, node) => {
      // event.stopPropagation(); // Prevent propagation to the parent SVG
      const childValue = prompt("Enter value for the new child node:");
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
    },
    [treeData]
  );

    const handleLinkClick = () =>{
      console.log("clicked on link");
    };

  const handleOptionChange = (isHorizontal) => {
    setIsHorizontal(isHorizontal);
  };

  const handleCreateTree = () => {
    const rootValue = prompt("Enter value for the root node:");
    if (rootValue !== null) {
      setTreeData({ value: rootValue, children: [] });
    }
  };

  const generateLatexCode = (node) => {
    // Recursively build the LaTeX code for the tree
    if (!node) {
      return "";
    }

    // let latexCode = ` [${node.value}`; // Assume node value is directly accessible
    // let latexCode =  '\\begin{forest}\n'
    let latexCode = "[";
    if (isChecked) {
      latexCode += `$${node.value}$`;
    } else {
      latexCode += node.value;
    }
    // latexCode += node.value;

    if (node.children) {
      latexCode += node.children
        .map((child) => generateLatexCode(child))
        .join("");
    }

    latexCode += "]";

    // latexCode += '\n\\end{forest}'

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
        <p>3. After you are finished, generated the code for created tree.</p>
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
