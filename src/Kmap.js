
import React, { useState } from 'react';
import './index.css'
import Cell from "./Components/Cell";
// import Implicant from "./Components/Implicant"
// import { Stage, Layer, Rect } from "react-konva";
// import { Stage, Layer, Rect, Text, Circle, Line } from 'react-konva';



const Kmap = () => {
    const [tableSize, setTableSize] = useState('0x0');
    const [option, setOption] = useState(null);
    const [opposite, setOpposite] = useState(1);
    const [disabled, Disable] = useState(false);
    const [implicants, addImplicant] = useState([]);
    const [markingImplicant,setMarkingImplicant]= useState(false);
 

    // zmena velkosti tabulky
    const handleTableSizeChange = (event) => {
        setTableSize(event.target.value);
    };

    // zmena hodnoty ktoru budeme davat do cells na ktore budeme klikat
    const handleOptionChange = (value) =>{
      setOption(value);
      if(value===1){
        setOpposite(0);
      } 
      else{
        setOpposite(1);
      } 
      //console.log(value);
    }
    
    const handleDisable = () =>{
        const cells = document.getElementsByClassName("cell");
        for (let cell of cells) {
          // If the cell is empty, set its value to the opposite number
          if (!cell.textContent) {
            alert('fill all the cells');
            return;
          }
        }
        
        Disable(true);
        setOption(null);
        setOpposite(null);
    } 


    // Define a function to fill the cells with the opposite number
  const fillCells = () => {
    // Loop through all the cells in the table
    const cells = document.getElementsByClassName("cell");
    for (let cell of cells) {
      // If the cell is empty, set its value to the opposite number
      if (!cell.textContent) {
        cell.textContent = opposite;
      }
    }
  };

  const getContentOfCells = () =>{
    const cells = document.getElementsByClassName("cell");
    let content = [];
    for (let cell of cells) {
      content.push(cell.textContent);
      console.log(cell.textContent);
    }
    
    return content;
  };
  
  const generateCodeLaTeX = () =>{
      const [rows, cols] = tableSize.split('x').map(Number);
      const content = getContentOfCells();
      let code = "";
      code += "\\begin{karnaugh-map}";
      code += "[";
      code += cols;
      code += "][";
      code += rows;
      code += "]";

      code += "\\manualterms{";
      // indexes of cells on grid of karnaugh-map package
      let indexes= [
        [0,1,3,2],
        [4,5,7,6],
        [12,13,15,14],
        [8,9,11,10]
      ];

      let indexes_2_x_2=[
        [0,1],
        [2,3]
      ]
      // generating the code for manualterms
      for(let row = 0; row < rows; row++ ){
        for(let col = 0; col < cols ; col++){
          if(cols<=2){
            code += content[indexes_2_x_2[row][col]];
          }
          else{
            code += content[indexes[row][col]];
          }
          if(row*cols + col < content.length - 1){
            code += ",";
          }
        }
      }

      code +="}";

      code += "\\end{karnaugh-map}";
      console.log(code);
      alert(code);
      return code;
      
  };

  const addingimplicant = () => {
      setMarkingImplicant(!markingImplicant);
  }

  const handleCellClick = (row, col) => {
    // console.log(markingImplicant);
    // console.log(disabled);
    // code += "\\implicant"

    let indexes= [
      [0,1,3,2],
      [4,5,7,6],
      [12,13,15,14],
      [8,9,11,10]
    ];

    if(disabled && markingImplicant){
         addImplicant([...implicants, indexes[row][col]]);
         console.log(implicants);
      

    }
    
  };
  const generateTable = () => {
      const [rows, cols] = tableSize.split('x').map(Number);
      const table = [];
      for (let row = 0; row < rows; row++) {
          const currentRow = [];
          for (let col = 0; col < cols; col++) {
            currentRow.push(
              <Cell 
              key={`${row}${col}`} 
              option={option}
              onClick={handleCellClick} 
              row={row}
              col={col}
              marking={markingImplicant}
              />
            );
          }
          table.push(<div className="row">{currentRow}</div>);
      }

      return <div className='karnaugh-map'>{table}</div>;
  }


    
    

    return (
      <div className="Kmap">
      <h1>Karnaughove mapy</h1>
        <div className="settings" disabled={disabled}>
            {/* <div className="tableSize"> */}
                {/* <label htmlFor="tableSize" disabled={disabled}>Select Table Size: </label> */}
                <select id="tableSize" onChange={handleTableSizeChange} disabled={disabled} value={tableSize}>
                    <option value="0x0">Select map size</option>
                    <option value="2x1">2 x 1</option>
                    <option value="2x2">2 x 2</option>
                    <option value="2x4">4 x 2</option>
                    <option value="4x4">4 x 4</option>
                </select>
            {/* </div> */}
            <div className='Buttons'>
                <button id="button0" disabled={disabled} onClick={()=>handleOptionChange(0)} style={{ backgroundColor: option === 0 ? "green" : 'white' }}>0</button>
                <button id="button1" disabled={disabled} onClick={()=>handleOptionChange(1)} style={{ backgroundColor: option === 1 ? "green" : 'white' }}>1</button>
                <button id="autofill" disabled={disabled} onClick={fillCells}>Fill the rest</button>
                <button id="submitBtn" onClick={handleDisable} disabled={disabled}>Submit</button>
                <button onClick={()=>generateCodeLaTeX()}>test</button>
                <button onClick={()=>addingimplicant()} style={{ backgroundColor: markingImplicant === true ? "grey" : 'white' }}>Add impl</button>
            </div>
        </div>
        <div className='container' >
              {/* <canvas></canvas> */}
              {generateTable()}  
              </div>
        
      </div>
    );
}

export default Kmap;

