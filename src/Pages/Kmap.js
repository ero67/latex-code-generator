
import React, { useState } from 'react';
// import * as React from 'react';
import './index.css'
import Cell from "../Components/Cell";
import GeneratedCode from './GeneratedCode';
import ImplicantsList from '../Components/ImplicantsList';
import EdgeImplicantList from '../Components/EdgeImplicantList';

// import { Link, useNavigate } from 'react-router-dom';
// import Button from '@mui/material/Button';

// Bootstrap CSS
// import "bootstrap/dist/css/bootstrap.min.css";

// import Implicant from "./Components/Implicant"
// import { Stage, Layer, Rect } from "react-konva";
// import { Stage, Layer, Rect, Text, Circle, Line } from 'react-konva';



const Kmap = () => {
    const [tableSize, setTableSize] = useState('0x0');
    const [option, setOption] = useState(0);
    const [opposite, setOpposite] = useState(1);
    const [disabled, Disable] = useState(false);
      
    // edge implicant
    const [markingEdgeImplicant,setMarkingEdgeImplicant] = useState(false);
    const [edgeImplicants, addEdgeImplicant] = useState([]);
    const [numberOfEdgeImplicants, setNumberOfEdgeImplicants] = useState(0);
    const [edgeImplicant,addPartOfEdgeImplicant] = useState([]);

    const [finishImplicantDisabled, setfinishImplicantDisabled] = useState(true);
    const [classicImplicantDisabled, setClassicImplicantDisabled] = useState(true);
    const [edgeImplicantDisabled, setEdgeImplicantDisabled] = useState(true);
    const [cornerImplicantDisabled, setCornerImplicantDisabled] = useState(true);


    
    // default implicant
    const [implicants, addImplicant] = useState([]);
    const [markingImplicant,setMarkingImplicant]= useState(false);
    const [numberOfImplicants, setNumberOfImplicants] = useState(0);
    const [implicant,addPartOfImplicant] = useState([]);

    

    // corner implicant
    const [implicantCorner, addImplicantCorner]= useState(false);

    const [generatedCode, setGeneratedCode] = useState("Your code will appear here \n after you click on Generate Code button");
    // const code='a';


    // const navigate= useNavigate();
    // const navigateToCodePage = () => {
    //   navigate ('/generated-code', {state: {code: generatedCode}})
    // }


    // const generateCodePage = () =>{
    //   const code = new URLSearchParams();
    //   console.log(generateCodeLaTeX());
    //   code.append('code', generateCodeLaTeX());
    //   navigate('/generated-code');
    // }

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
        setClassicImplicantDisabled(false);
        if(tableSize==='4x4'){
          setCornerImplicantDisabled(false);
          setEdgeImplicantDisabled(false);
        }
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

  const addCornerImplicant = () =>{
    addImplicantCorner(true);
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
      code += "]\n";

      code += "       \\manualterms{";
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

      let indexes_2_x_1=[
        [0],
        [1]
      ]
      // generating the code for manualterms
      for(let row = 0; row < rows; row++ ){
        for(let col = 0; col < cols ; col++){
          if(cols===2 && rows===2){
            code += content[indexes_2_x_2[row][col]];
          }
          else if(cols===1){
            code += content[indexes_2_x_1[row][col]];
          }
          else{
            code += content[indexes[row][col]];
          }
          if(row*cols + col < content.length - 1){
            code += ",";
          }
        }
      }

      code +="}\n";
      

      //generating code for classic implicant
      //required number of {} in \implicant command is 2 so wa can hardcode it
      if(implicants.length>0){
      for(let row =0; row < implicants.length; row ++){
        
        if(implicants[row][0]===undefined){
      
          continue;
        }
        else if ((implicants[row].length===1 )){
      
          code += "       \\implicant{";
          code += implicants[row][0];
          code += "}";
          code += "{";
          code += implicants[row][0];
          code +="}\n";
        }
        else{
          code += "       \\implicant{";
          code += implicants[row][0];
          code += "}";
          code += "{";
          code += implicants[row][1];
          code +="}\n";
        }
      }
    }

      if(implicantCorner && rows===4 && cols===4){
        code += "       \\implicantcorner\n";
      }
      else if(implicantCorner && (rows!==4 || cols!==4)){
        alert('Implicant na rohy sa dá zaznačiť len na poliach rozmeru 4x4')
      }

      // logic for generating code for edge implicant
      // required number of {} for \implicantedge command is 4
      // if i want to mark only 2 cells i need to put both indexes twice
      for(let row =0; row < edgeImplicants.length; row ++){
        
        
        if(edgeImplicants[row].length===2){
          code += "       \\implicantedge";
          code +="{";
          code += edgeImplicants[row][0];
          code +="}";
          code +="{";
          code += edgeImplicants[row][0];
          code +="}";

          code +="{";
          code += edgeImplicants[row][1];
          code +="}";
          code +="{";
          code += edgeImplicants[row][1];
          code +="}\n";
        }
        else if(edgeImplicants[row].length===4) {
          code += "       \\implicantedge";
          code +="{";
          code += edgeImplicants[row][0];
          code +="}";
          code +="{";
          code += edgeImplicants[row][1];
          code +="}";

          code +="{";
          code += edgeImplicants[row][2];
          code +="}";
          code +="{";
          code += edgeImplicants[row][3];
          code +="}\n";

        }
        else{
          // alert("Number of Cells for edge implicant is 2 or 4.Anything else is");
          continue;
        }
        // code += edgeImplicants[row][0];
        // code += "}";
        // code += "{";
        // code += edgeImplicants[row][1];
        // code +="}";
        }


      code += "\\end{karnaugh-map}";
      // console.log(code);
      // alert(code);
      setGeneratedCode(code);

      // console.log(generatedCode);
      // console.log(implicants);
      // setGeneratedCode(generatedCode+code);
      // console.log(generatedCode);
      // alert(generatedCode);
      // console.log(generatedCode);
      // console.log(implicants);
      // return code;
      
  };


  const finishImplicant = () =>{
    // if(numberOfImplicants>=2){
      if(markingImplicant){  
        console.log('this is implicant when finished button is pressed');
        console.log(implicant);
        addImplicant([...implicants, implicant]);
        addPartOfImplicant([]);
        setNumberOfImplicants(0);
        setMarkingImplicant(false);
      }
      else if(markingEdgeImplicant){
        addEdgeImplicant([...edgeImplicants,edgeImplicant]);
        addPartOfEdgeImplicant([]);
        setNumberOfEdgeImplicants(0);
        setMarkingEdgeImplicant(false);
        console.log(edgeImplicants);
      }
      setfinishImplicantDisabled(true);
      setClassicImplicantDisabled(false);
      if(tableSize==='4x4'){
        setEdgeImplicantDisabled(false);
        setCornerImplicantDisabled(false);
      }
    // }
  }

  const addingimplicant = () => {
      setMarkingImplicant(!markingImplicant);
      setfinishImplicantDisabled(false);
      setClassicImplicantDisabled(false);
      setEdgeImplicantDisabled(true);
      setCornerImplicantDisabled(true);
       
  }

  const addingEdgeimplicant = () => {
    setMarkingEdgeImplicant(!markingEdgeImplicant);

    setfinishImplicantDisabled(false);
    setClassicImplicantDisabled(true);
    setEdgeImplicantDisabled(false);
    setCornerImplicantDisabled(true); 
  }
  const handleCellClick = (row, col) => {
    let indexes=[]
    let rows=0;
    let cols=0;
    if(tableSize==='2x2'){
       indexes=[
        [0,1],
        [2,3]
      ]
      rows=2;
      cols=2;
    }
    else if(tableSize==='2x1'){
      indexes=[
        [0],
        [1]
      ]
      rows=2;
      cols=1;
    }
    else{
      indexes= [
        [0,1,3,2],
        [4,5,7,6],
        [12,13,15,14],
        [8,9,11,10]
      ];
      rows=4;
      cols=4;
    }
  

    console.log(disabled,markingImplicant);
    // disabled means that we are in the implicant part of this page
    // if am am marking basic implicant
    if(disabled && markingImplicant && implicant.length <= 1){
        addPartOfImplicant([...implicant,indexes[row][col]]);
        setNumberOfImplicants(numberOfImplicants+1);
        console.log("this is implicant");
        console.log(implicant);
       
      }

      // if i am choosing esge implicant and also disbled is true
      // disabled means that we are in the implicant part of this page
      else if(disabled && markingEdgeImplicant){
        if(row === 0 || row === rows-1 || col === 0 || col === cols-1){
            addPartOfEdgeImplicant([...edgeImplicant,indexes[row][col]]);
            setNumberOfEdgeImplicants(numberOfEdgeImplicants+1);
            console.log("this is edge implicant");
            console.log(edgeImplicant);
        }
        else{
          alert("you can only select Cells on edges");
        }
      }

    
  };


  // const sortEdgeImplicants = () =>{
    
  // }


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
              />
            );
          }
          table.push(<div className="row" key={row}>{currentRow}</div>);
      }

      return <div className='karnaugh-map' >{table}</div>;
  }

  // const generateTable = () => {
  //   const [rows, cols] = tableSize.split('x').map(Number);
  //   const table = [];
  
  //   for (let row = 0; row < rows; row++) {
  //     const currentRow = [];
  
  //     for (let col = 0; col < cols; col++) {
  //       const cellValue = row * cols + col;
  //       const isImplicantCell = implicants.some(implicant =>
  //         implicant.includes(cellValue)
  //       );
  
  //       const backgroundColor = isImplicantCell ? 'yellow' : 'white';
  
  //       currentRow.push(
  //         <Cell
  //           key={`${row}${col}`}
  //           option={option}
  //           onClick={handleCellClick}
  //           row={row}
  //           col={col}
  //           style={{ backgroundColor }}
  //         />
  //       );
  //     }
  
  //     table.push(<div className="row" key={row}>{currentRow}</div>);
  //   }
  
  //   return <div className='karnaugh-map'>{table}</div>;
  // };
  
  
    
    

    return (
      <div className="Kmap">
      <h1>Karnaugh maps</h1>
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
                <button id="submitBtn" onClick={()=>handleDisable()} disabled={disabled}>Submit</button>
                
                 {/* <button id="submitBtn" onClick={()=>generateCodeLaTeX()} disabled={!disabled}>Generate code </button> */}
              
                <button id ="addImplicant" disabled={classicImplicantDisabled} onClick={()=>addingimplicant()} style={{ backgroundColor: markingImplicant === true ? "red" : 'white' }}>+ Add impl</button>
                <button id="addImplicant" disabled={edgeImplicantDisabled} onClick={()=>addingEdgeimplicant()} style={{ backgroundColor: markingEdgeImplicant === true ? "red" : 'white' }}>+ Edge impl</button>
                <button id ="cornerImplicant" disabled={cornerImplicantDisabled} onClick={()=>addCornerImplicant()} >+ Corner impl</button>
                <button id="finishImplicant" disabled={finishImplicantDisabled} onClick={()=>finishImplicant()}>Finish Implicant</button>
            </div>
        </div>
              {generateTable()}
              <ImplicantsList id="implicantlist" implicants={implicants}></ImplicantsList>
              <EdgeImplicantList id="implicantlist" edgeImplicants={edgeImplicants}></EdgeImplicantList>

              
              <button id="generateBtn" onClick={()=>generateCodeLaTeX()} disabled={!disabled}>Generate code </button>
              
              <GeneratedCode id="generatedCode" disabled = {!disabled} code={generatedCode}>
              </GeneratedCode>
              
      </div>
      
    );
}

export default Kmap;

