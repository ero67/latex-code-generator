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
  const [orientation, setTreeOrientation] = useState("top-down");

  const [nodeId, setNodeId] = useState(0);

  const [indexOfOrientation, setIndexOfOrientation] = useState(0);

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
    // if(isHorizontal){
      if(indexOfOrientation===1){
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
      else if  (indexOfOrientation===0){
        ////////////////////////////topdown
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
//////////////////////////////////topdown
      }
      else if(indexOfOrientation===2){
//////////////////////////////////bottom up
      const svgHeight = 300; // Assuming your SVG has a fixed height of 500

      // Adjusting links for bottom-up orientation
      svg.selectAll("path.link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#ADADAD")
        .attr("stroke-width", "4px")
        .attr("d", d3.linkVertical()
              .x(d => d.x) // x-coordinates stay the same
              .y(d => svgHeight - (d.y + 5))) // Invert y-coordinates for bottom-up
        .on("click", (event, d) => handleLinkClick(event, d)); // Pass both event and link data
      
      // Adjusting nodes for bottom-up orientation
      const nodes = svg.selectAll("g.node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${svgHeight - (d.y + 20)})`) // Invert y-coordinates for bottom-up
        .on("click", (event, d) => handleNodeClick(event, d));
      
      nodes.append("circle")
        .attr("r", 15)
        .attr("stroke", "black")
        .attr("fill", "white");
      
      nodes.append("text")
        .attr("x", 0)
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .text(d => d.data.value);
/////////////////////////////////bottom up
      }
      else if(indexOfOrientation===3){
        const svgWidth = 400;
          svg
            .selectAll("path.link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", "#ADADAD")
            .attr("stroke-width", "4px")
            .attr("d", d3.linkHorizontal()
                 .x((d) => svgWidth - (d.y + 5)) // Invert x-coordinate for right-to-left
                 .y((d) => d.x))
            .on("click", (event, d) => handleLinkClick(event, d)); // Pass both event and link data
        
          const nodes = svg
            .selectAll("g.node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", (d) => `translate(${svgWidth - (d.y + 20)},${d.x})`) // Invert x-coordinate for right-to-left
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
//////////////////////////////// for everything
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
          if(indexOfOrientation===1){
            // Calculate the midpoint for each link
             midX = (d.source.x + d.target.x) / 2;
             midY = (d.source.y + d.target.y) / 2;
            // Position the label at the midpoint
            d3.select(this)
              .attr("x", midY + 10) 
              .attr("y", midX);
          }
//////////////////////////////for everything
          else if (indexOfOrientation===0){

            ///////////////////////////top down
            // Calculate the midpoint for each link in a vertical layout
             midY = (d.source.y + d.target.y) / 2 + 10; // Midpoint's X position (horizontal)
             midX = (d.source.x + d.target.x) / 2; // Midpoint's Y position (vertical)
            // Position the label at the midpoint
            d3.select(this)
              .attr("x", midX)
              .attr("y", midY);
            ///////////////////////////top down
          }
          else if(indexOfOrientation===2){
                      ////////////////////botom up
            const svgHeight=300;
            midX = (d.source.x + d.target.x) / 2;
            // Midpoint's Y position needs to be inverted for bottom-up layout
            // Adjusted to place labels correctly along the inverted y-axis
            const midYInverted = svgHeight - ((d.source.y + d.target.y) / 2 + 10);
        
            // Position the label at the inverted midpoint
            d3.select(this)
              .attr("x", midX)
              .attr("y", midYInverted);
            ///////////////////////bottom up
          }
          else if(indexOfOrientation===3){
            const svgWidth = 500;
            const midX = (d.source.x + d.target.x) / 2;
    const midY = (d.source.y + d.target.y) / 2;
    // Adjust label positioning for right-to-left by inverting the x-position (midY in this case)
    d3.select(this)
      .attr("x", svgWidth - midY - 10) // Subtract midY from svgWidth and adjust by the same offset used before
      .attr("y", midX); // midX remains the same as it's along the y-axis, which isn't inverted
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

    const handleOrientationClick=()=>{
      if(indexOfOrientation===0){
        setIndexOfOrientation(1);
      }
      else if(indexOfOrientation===1){
        setIndexOfOrientation(2);
      }
      else if(indexOfOrientation===2){
        setIndexOfOrientation(3);
      }
      else if(indexOfOrientation===3){
        setIndexOfOrientation(0);
      }
    }



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



  const generateLatexCode = (node, parentLabel = "") => {
    if (!node) {
      return "";
    }
    let nodeLabel = isChecked ? `$${node.value}$` : node.value;
    let latexCode = "[\n  " + nodeLabel;

    if (parentLabel) {
      latexCode += `, edge label={node[midway,right,font=\\scriptsize,inner sep=1pt]{${parentLabel.text}}}`;
    }

    if (node.children && node.children.length > 0) {
      const childStrings = node.children.map((child) => {
        let childLabel = child.label ? {text: child.label, position: "right"} : "";
        return generateLatexCode(child, childLabel);
      });
      latexCode += childStrings.join("\n").replace(/^/gm, '  ');
    }

    latexCode += "\n]";

    return latexCode;
};


  
  

  const handleGenerateLatex = () => {
    let latexCode = "";
    if(indexOfOrientation===0){
      latexCode = `\\begin{forest}\n${generateLatexCode(treeData)}\n\\end{forest}`;
    }
    else if(indexOfOrientation===1){
      latexCode = `\\begin{forest}
      for tree ={grow'= 0,}
      ${generateLatexCode(treeData)}\n\\end{forest}`;
    }
    else if(indexOfOrientation===2){
      latexCode = `\\begin{forest}
      for tree ={grow'= 90,}
      ${generateLatexCode(treeData)}\n\\end{forest}`;
    }
    else if(indexOfOrientation===3){
      latexCode = `\\begin{forest}
      for tree={grow'=180,} 
      ${generateLatexCode(treeData)}
\\end{forest}`;

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
        // onClick={() => handleOptionChange(false)}
        onClick={handleOrientationClick}
        // onClick={() => setTreeOrientation("top-down")}
        style={{ backgroundColor: isHorizontal === false ? "#7393B3" : "white" }}
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
