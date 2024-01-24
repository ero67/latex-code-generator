import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

const ProofTree = () => {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [currentStatement, setCurrentStatement] = useState('');
  const canvas = new fabric.Canvas(canvasRef.current, {
    width: 800,
    height: 600,
  });
  useEffect(() => {
    // Initialize Fabric.js canvas
    

    // Handle canvas click event to add nodes
    canvas.on('mouse:down', (event) => {
      if (event.target === canvas) {
        addNode(event.e.clientX, event.e.clientY);
      }
    });
  }, []);

  const addNode = (x, y) => {
    if (currentStatement.trim() !== '') {
      // Create a Fabric.js object representing a node
      const rect = new fabric.Rect({
        width: 100,
        height: 50,
        fill: 'white',
        stroke: 'black',
        strokeWidth: 2,
        left: x,
        top: y,
      });

      // Create a Fabric.js text object for the logical statement
      const text = new fabric.Text(currentStatement, {
        left: x + 30,
        top: y + 10,
        fontSize: 16,
      });

      // Add the objects to the canvas and the nodes state
      canvas.add(rect, text);
      setNodes([...nodes, { statement: currentStatement, objects: [rect, text] }]);
      setCurrentStatement('');
    }
  };

  const generateLatexCode = () => {
    const latexCode = nodes.map((node) => node.statement).join(' \\to ');
    console.log(latexCode);
    // You can use the generated LaTeX code as needed
  };

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="Enter logical statement"
          value={currentStatement}
          onChange={(e) => setCurrentStatement(e.target.value)}
        />
        {/* Button to manually add nodes */}
        <button onClick={() => addNode(100, 100)}>Add Node</button>
      </div>
      {/* Canvas for rendering the proof tree */}
      <canvas ref={canvasRef}></canvas>
      <div>
        <button onClick={generateLatexCode}>Generate LaTeX Code</button>
      </div>
    </div>
  );
};

export default ProofTree;
