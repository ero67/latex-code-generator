// TODO: KARNAUGHOE MAPY : pridat to ze sa zakruzkuje/nejakym sposobom oznaci implicant
// TODO: KARNAUGHOVE MAPY : aby user nemusel klikat presne v danom poradi na cells.... proste nech len klikne hocijak... nech to zoradi indexy aby fungoval LaTeX kod

import React, { useState, useEffect } from "react";
import "./index.css";
import Cell from "../Components/Cell";
import GeneratedCode from "../Components/GeneratedCode";
import ImplicantsList from "../Components/ImplicantsList";
import EdgeImplicantList from "../Components/EdgeImplicantList";
import Instructions from "../Components/Instructions";
// import { active } from "d3";

const Kmap = () => {
  const [tableSize, setTableSize] = useState("0x0");
  const [option, setOption] = useState(0);
  const [opposite, setOpposite] = useState(1);
  const [disabled, Disable] = useState(false);

  // edge implicant
  const [markingEdgeImplicant, setMarkingEdgeImplicant] = useState(false);
  const [edgeImplicants, addEdgeImplicant] = useState([]);
  const [numberOfEdgeImplicants, setNumberOfEdgeImplicants] = useState(0);
  const [edgeImplicant, addPartOfEdgeImplicant] = useState([]);

  const [finishImplicantDisabled, setfinishImplicantDisabled] = useState(true);
  const [classicImplicantDisabled, setClassicImplicantDisabled] =
    useState(true);
  const [edgeImplicantDisabled, setEdgeImplicantDisabled] = useState(true);
  const [cornerImplicantDisabled, setCornerImplicantDisabled] = useState(true);

  // default implicant
  const [implicants, addImplicant] = useState([]);
  const [markingImplicant, setMarkingImplicant] = useState(false);
  const [numberOfImplicants, setNumberOfImplicants] = useState(0);
  const [implicant, addPartOfImplicant] = useState([]);
  const [indexesOfImplicant, addIndexOfImplicant]= useState([]);


  //useStates for coloring implicants
  const [singeImplicantIndexes, addPartOfSingleImplicantIndex] = useState([]);
  const [implicantCellIndexes, addImplicantCellIndexes] = useState([]);

  const [singeEdgeImplicantIndexes, addPartOfSingleEdgeImplicantIndex] =
    useState([]);
  const [edgeimplicantCellIndexes, addEdgeImplicantCellIndexes] = useState([]);

  // corner implicant
  const [implicantCorner, addImplicantCorner] = useState(false);

  const [generatedCode, setGeneratedCode] = useState(
    "Your code will appear here \n after you click on Generate Code button"
  );
  // drAwing implicants
  const [mapHeight, setMapHeight] = useState(null); // Store the start point
  const [mapWidth, setMapWidth] = useState(null); // Store the end point

  const [activeImplicantIndex, setActiveImplicantIndex] = useState(null);
  const [activeImplicantType, setActiveImplicantType] = useState(null);

  const handleImplicantClick = (index, typeOfImplicant) => {
    setActiveImplicantIndex(index);
    setActiveImplicantType(typeOfImplicant);
  };
  //function for finding out what color should the cell be after hovering over list
  function getCellColor(
    row,
    col,
    // activeImplicantIndex,
    activeImplicantType,
    implicantCellIndexes,
    edgeimplicantCellIndexes,
    defaultColor,
    activeColor
  ) {
    // Check if there is an active implicant
    // console.log(activeImplicantType);
    let activeImplicanCellIndexes = edgeimplicantCellIndexes;
    if (activeImplicantType === "default") {
      activeImplicanCellIndexes = implicantCellIndexes;
    } else if (activeImplicantType === "edge") {
      activeImplicanCellIndexes = edgeimplicantCellIndexes;
    }

    if (activeImplicantIndex !== null) {
      const activeImplicant = activeImplicanCellIndexes[activeImplicantIndex];
      if(activeImplicant === undefined){return;}
      if (
        activeImplicant.some((cell) => cell.row === row && cell.col === col)
      ) {
        return activeColor; // Color for active implicant cells
      }
    }

    // Check if the cell belongs to any other implicant
    if(activeImplicantIndex!==null){
    for (let i = 0; i < activeImplicanCellIndexes.length; i++) {
      if (i !== activeImplicantIndex) {
        const implicant = activeImplicanCellIndexes[i];
        if (implicant.some((cell) => cell.row === row && cell.col === col)) {
          return defaultColor; // Color for non-active implicant cells
        }
      }
    }
  }
    return null; // No color if the cell is not part of any implicant
  }



  function getColorForImplicant() {
    return colors[19];
  }

  // zmena velkosti tabulky
  const handleTableSizeChange = (event) => {
    setTableSize(event.target.value);
  };

  // zmena hodnoty ktoru budeme davat do cells na ktore budeme klikat
  const handleOptionChange = (value) => {
    setOption(value);
    if (value === 1) {
      setOpposite(0);
    } else {
      setOpposite(1);
    }
    //console.log(value);
  };

  // handling initail state of buttons shown
  const handleDisable = () => {
    // const cells = document.getElementsByClassName("cell");
    // for (let cell of cells) {
    //   // If the cell is empty, set its value to the opposite number
    //   if (!cell.textContent) {
    //     alert("fill all the cells");
    //     return;
    //   }
    // }

    Disable(true);
    setClassicImplicantDisabled(false);
    setEdgeImplicantDisabled(false);
    if (tableSize === "4x4") {
      setCornerImplicantDisabled(false);
    }
    setOption(null);
    setOpposite(null);

    const kmapContainer = document.querySelector(".karnaugh-map");
    const rect = kmapContainer.getBoundingClientRect();
    // console.log(rect.height, rect.width);
    setMapHeight(rect.height);
    setMapWidth(rect.width);
  };

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

  const getContentOfCells = () => {
    const cells = document.getElementsByClassName("cell");
    let content = [];
    for (let cell of cells) {
      content.push(cell.textContent);
      // console.log(cell.textContent);
    }

    return content;
  };

 

  const addCornerImplicant = () => {

    // Correctly adding all corner indices in a single update
    const newEdgeImplicant = [...edgeImplicant, 0, 2, 8, 10];
    // addPartOfEdgeImplicant(newEdgeImplicant);
    // console.log(newEdgeImplicant);

    const newSingleEdgeImplicantIndexes = [
      { row: 0, col: 0 },
      { row: 0, col: 3 },
      { row: 3, col: 0 },
      { row: 3, col: 3 },
    ];

    addPartOfSingleEdgeImplicantIndex(newSingleEdgeImplicantIndexes);
    // console.log(newSingleEdgeImplicantIndexes);

    // Final state updates
    addEdgeImplicant([...edgeImplicants, newEdgeImplicant]);
    addImplicantCorner(true);
    addEdgeImplicantCellIndexes([
      ...edgeimplicantCellIndexes,
      newSingleEdgeImplicantIndexes,
    ]);
    addPartOfEdgeImplicant([]);
    addPartOfSingleEdgeImplicantIndex([]);
    setNumberOfEdgeImplicants(0);
  };

  const generateCodeLaTeX = () => {
    const [rows, cols] = tableSize.split("x").map(Number);
    const content = getContentOfCells();
    let code = `\\begin{karnaugh-map}[${cols}][${rows}]\n`;
    code += "       \\manualterms{";
    // indexes of cells on grid of karnaugh-map package
    let indexes = [
      [0, 1, 3, 2],
      [4, 5, 7, 6],
      [12, 13, 15, 14],
      [8, 9, 11, 10],
    ];

    let indexes_2_x_2 = [
      [0, 1],
      [2, 3],
    ];

    let indexes_2_x_1 = [[0], [1]];
    // generating the code for manualterms
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (cols === 2 && rows === 2) {
          code += content[indexes_2_x_2[row][col]];
        } else if (cols === 1) {
          code += content[indexes_2_x_1[row][col]];
        } else {
          code += content[indexes[row][col]];
        }
        if (row * cols + col < content.length - 1) {
          code += ",";
        }
      }
    }

    code += "}\n";
    //generating code for classic implicant
    //required number of {} in \implicant command is 2 so we can hardcode it
    if (implicants.length > 0) {
      for (let row = 0; row < implicants.length; row++) {
        if (implicants[row][0] === undefined) {
          continue;
        } else if (implicants[row].length === 1) {
          code += `       \\implicant{${implicants[row][0]}}{${implicants[row][0]}}\n`;
        } else {
          code += `       \\implicant{${implicants[row][0]}}{${implicants[row][1]}}\n`;
        }
      }
    }

   
    if (implicantCorner && rows === 4 && cols === 4) {
      code += "       \\implicantcorner\n";
    } else if (implicantCorner && (rows !== 4 || cols !== 4)) {
      alert("Implicant na rohy sa dá zaznačiť len na poliach rozmeru 4x4");
    }

    // logic for generating code for edge implicant
    // required number of {} for \implicantedge command is 4
    // if i want to mark only 2 cells i need to put both indexes twice
    for (let row = 0; row < edgeImplicants.length; row++) {
      if (edgeImplicants[row].length === 2) {
        code += `       \\implicantedge{${edgeImplicants[row][0]}}{${edgeImplicants[row][0]}}{${edgeImplicants[row][1]}}{${edgeImplicants[row][1]}}\n`;
        // code += `       \\implicantedge{${indexes[row][0]}}{${edgeImplicants[row][0]}}{${edgeImplicants[row][1]}}{${edgeImplicants[row][1]}}\n`;
      } else if (edgeImplicants[row].length === 4 || edgeImplicants[row].length === 6 || edgeImplicants[row].length === 8) {
        const [firstindex,secondindex,thirdindex,fourthindex] = edgeImplicants[row];
        if((firstindex===0 && secondindex===2 && thirdindex===8 && fourthindex===10)&&implicantCorner){
          
          continue;
        }
       else {
        code += `       \\implicantedge{${edgeImplicants[row][0]}}{${edgeImplicants[row][1]}}{${edgeImplicants[row][2]}}{${edgeImplicants[row][3]}}\n`;
        
      }}
    }

    code += "\\end{karnaugh-map}";
    setGeneratedCode(code);
  };
  // adding all cell which are supposed to be in chosen implicant

  // function calculateImplicantIndices(startPoint, endPoint) {
  //  //if iser clicks the start and end of the implicant in other way around
  //   if(((endPoint.row+endPoint.col) < (startPoint.row+startPoint.col))){
  //     console.log("treba zoradit");
  //     let temp = endPoint;
  //     endPoint = startPoint;
  //     startPoint = temp;
  //     let temp2 = implicant[0];
  //     implicant[0] = implicant[1];
  //     implicant[1] = temp2;

  //   }
  //   addImplicant([...implicants, implicant]);



  //   const implicantIndices = [];
  //   if (endPoint === null) {
  //     endPoint = startPoint;
  //   }
  //   // check if its a single cell selection
  //   if (startPoint.row === endPoint.row && startPoint.col === endPoint.col) {
  //     return [startPoint];
  //   }

  //   // Otherwise, calculate indices for rectangular or linear implicants
  //   for (let r = startPoint.row; r <= endPoint.row; r++) {
  //     for (let c = startPoint.col; c <= endPoint.col; c++) {
  //       implicantIndices.push({ row: r, col: c });
  //     }
  //   }

  //   return implicantIndices;
  // }

  function calculateImplicantIndices(startPoint, endPoint) {
    // Initialize implicantIndices array for storing the result
    const implicantIndices = [];
    const [rows, cols] = tableSize.split("x").map(Number);

    let indexes = [
      [0, 1, 3, 2],
      [4, 5, 7, 6],
      [12, 13, 15, 14],
      [8, 9, 11, 10],
    ];

    let indexes_2_x_2 = [
      [0, 1],
      [2, 3],
    ];
    // Ensure both startPoint and endPoint are defined
    if (!endPoint) endPoint = startPoint;

    // Identify the top-left and bottom-right corners of the selection
    const topLeft = {
        row: Math.min(startPoint.row, endPoint.row),
        col: Math.min(startPoint.col, endPoint.col),
    };
    const bottomRight = {
        row: Math.max(startPoint.row, endPoint.row),
        col: Math.max(startPoint.col, endPoint.col),
    };
console.log(topLeft, bottomRight)
    // Check if it's a single cell selection
    // if (topLeft.row === bottomRight.row && topLeft.col === bottomRight.col) {
    //     // If single cell, directly add to implicants and return the single cell in an array
    //     addImplicant([...implicants, [topLeft]]);
    //     return [topLeft];
    // }

    // Calculate indices for rectangular or linear implicants based on corrected corners
    for (let r = topLeft.row; r <= bottomRight.row; r++) {
        for (let c = topLeft.col; c <= bottomRight.col; c++) {
            implicantIndices.push({ row: r, col: c });
        }
    }
    if(rows===2 && cols===2){
      implicant[0]=indexes_2_x_2[topLeft.row][topLeft.col];
      implicant[1]=indexes_2_x_2[bottomRight.row][bottomRight.col];
    }
    else{
      implicant[0]=indexes[topLeft.row][topLeft.col];
      implicant[1]=indexes[bottomRight.row][bottomRight.col];
    }

    // Add the newly calculated implicant to the list of implicants
    addImplicant([...implicants, implicant]);

    // Return the indices of the cells forming the implicant
    return implicantIndices;
}


// sorting edge implicant so user can click in any order and it will be generated correctly
  const sortVerticalEdgeImplicants = (combinedArray) => {
    const [rows, cols] = tableSize.split("x").map(Number);
    // let isHorizoontalEdge = false;
    // if(implicants[0].row===0)

    // return implicants.sort((a, b) => {
    //   if (a.col < b.col) return -1;
    //   if (a.col > b.col) return 1;
    //   return a.row - b.row;
    // });

     // Check for horizontal or vertical alignment based on user clicks
  let allHorizontalEdges = combinedArray.every(item => item.row === 0 || item.row === rows - 1);
  let allVerticalEdges = combinedArray.every(item => item.col === 0 || item.col === cols - 1);

  
  // Decide on the primary sorting criterion based on the edge alignment
  let prioritizeRow = allHorizontalEdges && !allVerticalEdges;
  if(combinedArray[0].row === combinedArray[1].row){
    // allVerticalEdges = true;
    prioritizeRow = true;
  }
  return combinedArray.sort((a, b) => {
    // Apply sorting based on the determined priority
    if (prioritizeRow) {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    } else { // Default to prioritizing column for vertical edges or general case
      if (a.col !== b.col) return a.col - b.col;
      return a.row - b.row;
    }
  });

  };

  const combineArrays = (implicants, indexes) => {
    return implicants.map((implicant, i) => ({
      ...implicant,
      index: indexes[i]
    }));
  };

  const separateArrays = (sortedCombinedArray) => {
    const sortedImplicants = sortedCombinedArray.map(item => ({ row: item.row, col: item.col }));
    const sortedIndexes = sortedCombinedArray.map(item => item.index);
    return [sortedImplicants, sortedIndexes];
  };
  
  
  
  
  
  
  // Now, 'sortedImplicants' should be in the correct order for generating LaTeX code
  


  //handle logic of finish implicant button and all things that this button press triggers
  const finishImplicant = () => {
    // if(numberOfImplicants>=2){
    if (markingImplicant) {
      // console.log("this is implicant when finished button is pressed");
      // console.log(implicant);
      //adds implicant to the all implicants list
      if (implicant.length > 0) {
      
        // addImplicant([...implicants, implicant]); // addind implicant in calulateImplicantIndices
    
        //logic for addding indexes of all cells which are part of the implicant to the another array
        let singeImplicantIndex = [];
        if (singeImplicantIndexes[1] === undefined) {
          singeImplicantIndex = calculateImplicantIndices(
            singeImplicantIndexes[0],
            singeImplicantIndexes[0]
          );
        } else {
          singeImplicantIndex = calculateImplicantIndices(
            singeImplicantIndexes[0],
            singeImplicantIndexes[1]
          );
        }

        addImplicantCellIndexes([...implicantCellIndexes, singeImplicantIndex]);
        // console.log(singeImplicantIndexes[0], singeImplicantIndexes[1]);
      }
      //reseting variables connected with adding implicant
      addPartOfSingleImplicantIndex([]);
      addPartOfImplicant([]);
      setNumberOfImplicants(0);
      setMarkingImplicant(false);
    } else if (markingEdgeImplicant) {
      // console.log(edgeImplicant.length);
      // console.log(edgeImplicant);
      if (edgeImplicant.length > 1 && (edgeImplicant.length===2 || edgeImplicant.length===4 || edgeImplicant.length===6 || edgeImplicant.length===8)) {
        console.log("this is the test fir estge implicant indexes");
        console.log(edgeImplicant) ;
        const combinedArray = combineArrays(singeEdgeImplicantIndexes,edgeImplicant);
        const sortedImplicants = sortVerticalEdgeImplicants(combinedArray);
        const [sorted,sortedindexesEdgeImplicant] = separateArrays(sortedImplicants);
        addEdgeImplicant([...edgeImplicants, sortedindexesEdgeImplicant]);
        // addEdgeImplicant([...edgeImplicants, edgeImplicant]);
        // addImplicantCellIndexes([...implicantCellIndexes,singeImplicantIndexes])
        addEdgeImplicantCellIndexes([
          ...edgeimplicantCellIndexes,
          singeEdgeImplicantIndexes,
        ]);
        console.log("testttttttttttttttttttttttttttt");
        // console.log(singeEdgeImplicantIndexes);
        
        // console.log(sorted);
        // console.log(sortedindexesEdgeImplicant);
        // console.log(sortedImplicants);
        // console.log(edgeimplicantCellIndexes);
      }
      ////// CLEARING DATA FOR EDGE IMPLICANT AFTER ADDING IT TO HE FINAL ARRAY
      // addEdgeImplicant([...edgeImplicants,edgeImplicant]);
      addPartOfEdgeImplicant([]);
      addPartOfSingleEdgeImplicantIndex([]);
      setNumberOfEdgeImplicants(0);
      setMarkingEdgeImplicant(false);

    }
    setfinishImplicantDisabled(true);
    setClassicImplicantDisabled(false);
    setEdgeImplicantDisabled(false);
    if (tableSize === "4x4") {
      setCornerImplicantDisabled(false);
    }
    // console.log("toto su sususususususdusaddasdsadasdasdasdasd")
    // console.log(implicantCellIndexes) ;
    drawImplicants(implicantCellIndexes);
    // }
  };

  //set up buttons settings and interface when adding deafult implicant
  const addingimplicant = () => {
    setMarkingImplicant(!markingImplicant);
    setfinishImplicantDisabled(false);
    setClassicImplicantDisabled(false);
    setEdgeImplicantDisabled(true);
    setCornerImplicantDisabled(true);
  };

  //set up buttons settings and interface when adding edge implicant
  const addingEdgeimplicant = () => {
    setMarkingEdgeImplicant(!markingEdgeImplicant);

    setfinishImplicantDisabled(false);
    setClassicImplicantDisabled(true);
    setEdgeImplicantDisabled(false);
    setCornerImplicantDisabled(true);
  };


  // useEffect(() => {
  //   addClick(numberOfClicks+1);
  // },[implicant,edgeImplicant]);

  // const [numberOfClicks, addClick] = useState(0);
  const handleCellClick = (row, col) => {

    let indexes = [];
    let rows = 0;
    let cols = 0;
    if (tableSize === "2x2") {
      indexes = [
        [0, 1],
        [2, 3],
      ];
      rows = 2;
      cols = 2;
    } else if (tableSize === "2x1") {
      indexes = [[0], [1]];
      rows = 2;
      cols = 1;
    } else {
      indexes = [
        [0, 1, 3, 2],
        [4, 5, 7, 6],
        [12, 13, 15, 14],
        [8, 9, 11, 10],
      ];
      rows = 4;
      cols = 4;
    }

    //testtesttest
    // console.log(disabled, markingImplicant);
    // disabled means that we are in the implicant part of this page
    // if am am marking basic implicant
    if (disabled && markingImplicant && implicant.length <= 1) {
      addPartOfImplicant([...implicant, indexes[row][col]]);
      addPartOfSingleImplicantIndex([...singeImplicantIndexes, { row, col }]);
      setNumberOfImplicants(numberOfImplicants + 1);
      // console.log("this is implicant");
      // console.log(implicant);
    }

    // if i am choosing esge implicant and also disbled is true
    // disabled means that we are in the implicant part of this page
    else if (disabled && markingEdgeImplicant) {
      if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
        addPartOfEdgeImplicant([...edgeImplicant, indexes[row][col]]);
        addPartOfSingleEdgeImplicantIndex([
          ...singeEdgeImplicantIndexes,
          { row, col },
        ]);
     
        setNumberOfEdgeImplicants(numberOfEdgeImplicants + 1);
        // console.log("this is edge implicant");
        // console.log(edgeImplicant);
      } else {
        alert("you can only select Cells on edges");
        setMarkingEdgeImplicant(false);
        setfinishImplicantDisabled(true);
        setClassicImplicantDisabled(false);
        setCornerImplicantDisabled(false);
      }

    }
    
    // console.log(implicant.length);
    // console.log(implicant);

    //   addClick(numberOfClicks+1);
    // // console.log(numberOfClicks);
    // if(numberOfClicks===3){
    //   finishImplicant();
    //   addClick(0);
    // }
  };

  useEffect(() => {
    console.log(implicant.length);
    console.log(implicant);
    if(implicant.length===2){
      finishImplicant();
    };
    // Additional actions here based on the updated 'implicant' state
  }, [implicant]); // This effect runs whenever 'implicant' changes
  

  // TODO function for sorting edge implicants so they are generated correctly no matter the order of being clicked

  const generateTable = () => {
    // get the number of rows and columns from the tableSize string
    const [rows, cols] = tableSize.split("x").map(Number);
    const table = [];

    //iterate through the rows and columns to create the cells
    for (let row = 0; row < rows; row++) {
      const currentRow = [];
      for (let col = 0; col < cols; col++) {
        // part of the code for coloring implicant cells
        let cellColor = null;
        if (activeImplicantType === "default") {
          implicantCellIndexes.forEach((implicant, index) => {
            if (
              implicant.some((cell) => cell.row === row && cell.col === col)
            ) {
              cellColor = getColorForImplicant();
            }
          });
        } else if (activeImplicantType === "edge") {
          edgeimplicantCellIndexes.forEach((implicant, index) => {
            if (
              implicant.some((cell) => cell.row === row && cell.col === col)
            ) {
              cellColor = getColorForImplicant();
            }
          });
        }
        // part of the code for generating jsx and html code for cells
        currentRow.push(
          <Cell
            key={`${row}${col}`}
            option={option}
            onClick={handleCellClick}
            row={row}
            col={col}
            disabled={disabled}
            // cellColor = {cellColor}
            cellColor={getCellColor(
              row,
              col,
              // activeImplicantIndex,
              activeImplicantType,
              implicantCellIndexes,
              edgeimplicantCellIndexes,
              null,
              "#b5b5b5"
            )}
          />
        );
      }
      table.push(
        <div className="row" key={row}>
          {currentRow}
        </div>
      );
    }

    return <div className="karnaugh-map">{table}</div>;
  };

  const handleGoBackButton = () => {
    Disable(false);
    setClassicImplicantDisabled(true);
    setEdgeImplicantDisabled(true);
    setCornerImplicantDisabled(true);
    setMarkingEdgeImplicant(false);
    setMarkingImplicant(false);
    setfinishImplicantDisabled(true);
    addImplicant([]);
    addEdgeImplicant([]);
    addImplicantCellIndexes([]);
    addEdgeImplicantCellIndexes([]);
  };

  // const handleClearButton = () =>{
  //     setOption(0);
  //     setOpposite(1);
  //     // Loop through all the cells in the table
  //     const cells = document.getElementsByClassName("cell");
  //     for (let cell of cells) {
  //       // If the cell is empty, set its value to the opposite number
  //         cell.textContent = '';
  //     }
  //     // window.location.reload(false)
  //   }

  // Initialize an empty object to store implicant-to-color mappings
  const implicantColorMap = {};

  const colors = [
    "rgba(207, 0, 0, 0.5)", // red
    "rgba(0, 255, 54, 0.5)", // green
    "rgba(255, 242, 23, 0.5)", // yellow
    "rgba(0, 71, 215, 0.5)", // blue
    "rgba(196, 41, 215, 0.5)", // Purple
    "rgba(236, 151, 227, 0.5)", // Pink
    "rgba(0, 199, 190, 0.5)", // Turquoise
    "rgba(255, 165, 0, 0.5)", // Orange
    
    "rgba(255, 105, 180, 0.5)", // Hot Pink
    "rgba(75, 0, 130, 0.5)", // Indigo
    "rgba(64, 224, 208, 0.5)", // Turquoise
    "rgba(255, 69, 0, 0.5)", // Red-Orange
    "rgba(144, 238, 144, 0.5)", // Light Green
    "rgba(173, 216, 230, 0.5)", // Light Blue
    "rgba(244, 164, 96, 0.5)", // Sandy Brown
    "rgba(210, 105, 30, 0.5)", // Chocolate
    "rgba(255, 228, 181, 0.5)", // Moccasin
    "rgba(255, 99, 71, 0.5)", // Tomato
    "rgba(176, 224, 230, 0.5)", // Powder Blue
    "rgba(128, 128, 128, 0.5)", // Gray
  ];
  



  // Function to generate a unique ID for an implicant 
  const generateImplicantId = (implicant) => {
    return implicant.map((cell) => `${cell.row},${cell.col}`).join("-");
  };

  const assignColorsToImplicants = (implicants) => {
    implicants.forEach((implicant) => {
      const id = generateImplicantId(implicant);
      if (!implicantColorMap[id]) {
        // Assign the next available color in the cycle
        const colorIndex =
          Object.keys(implicantColorMap).length % colors.length;
        implicantColorMap[id] = colors[colorIndex];
      }
    });
  };

  //useEffect function which draws implicants when something changes
  useEffect(() => {
    drawImplicants(implicantCellIndexes);
  });

  //calculating boundaries for rectangle representing implicant
  const calculateImplicantBoundaries = (implicant) => {
    const rows = implicant.map((cell) => cell.row);
    const cols = implicant.map((cell) => cell.col);

    // Determine the bounding box of the implicant
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    return { minRow, maxRow, minCol, maxCol };
  };

  //function which draws implicants
  const drawImplicants = (implicants) => {
    // Ensure colors are assigned to new implicants
    assignColorsToImplicants(implicants);

    const [rows, cols] = tableSize.split("x").map(Number);
    const canvas = document.getElementById("kmapCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings

    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    implicants.forEach((implicant) => {
      const id = generateImplicantId(implicant);
      const color = implicantColorMap[id]; // Retrieve the assigned color

      const { minRow, maxRow, minCol, maxCol } =
        calculateImplicantBoundaries(implicant);

      const x = minCol * cellWidth;
      const y = minRow * cellHeight;
      const width = (maxCol - minCol + 1) * cellWidth - 20;
      const height = (maxRow - minRow + 1) * cellHeight - 20;

      ctx.beginPath();
      ctx.rect(x + 10, y + 10, width, height);
      ctx.fillStyle = color;
      ctx.fill();
    });
    // if(edgeimplicantCellIndexes.length>0){
    //   const sortedImplicantEdgeCellIndexes = sortVerticalEdgeImplicants(edgeimplicantCellIndexes);
    //   drawEdgeImplicants(sortedImplicantEdgeCellIndexes);
  
    // }
    // else{
      drawEdgeImplicants(edgeimplicantCellIndexes);
    // }
    // console.log("edge implicant cell indexeee/eeeeeesseseses");
    // console.log(edgeimplicantCellIndexes);
    
  };
  

//function for diving edge implicants into parts since the edge implicants are constructed from multiple rectangles for one implicant
  const divideEdgeImplicantsIntoTwo = (edgeImplicant) => {
    let firstPartofEdgeImplicant = [];
    let secondPartofEdgeImplicant = [];
    let thirdPartofEdgeImplicant = [];
    let fourthPartofEdgeImplicant = [];
    let isEdge=false;

    if(edgeImplicant.length === 2){
      firstPartofEdgeImplicant.push(edgeImplicant[0]);
      secondPartofEdgeImplicant.push(edgeImplicant[1]);
    }
    else if(edgeImplicant.length === 4){
      // check if edgeimplicant is corner implicant
      if(((edgeImplicant[0].row===0 && edgeImplicant[0].col===0)&&(edgeImplicant[1].row===0 && edgeImplicant[1].col===3)&&(edgeImplicant[2].row===3 && edgeImplicant[2].col===0)
      &&(edgeImplicant[3].row===3 && edgeImplicant[3].col===3))){
      // &&(edgeImplicant[3].row===3 && edgeImplicant[3].col===3))&& implicantCorner){
          firstPartofEdgeImplicant.push(edgeImplicant[0]);
          secondPartofEdgeImplicant.push(edgeImplicant[1]);
          thirdPartofEdgeImplicant.push(edgeImplicant[2]);
          fourthPartofEdgeImplicant.push(edgeImplicant[3]);
          isEdge=true;
      }
      else{
        if(edgeImplicant[0].row === edgeImplicant[1].row){
          firstPartofEdgeImplicant.push(edgeImplicant[0]);
          firstPartofEdgeImplicant.push(edgeImplicant[1]);
          secondPartofEdgeImplicant.push(edgeImplicant[2]);
          secondPartofEdgeImplicant.push(edgeImplicant[3]);

        }
        
        firstPartofEdgeImplicant.push(edgeImplicant[0]);
        firstPartofEdgeImplicant.push(edgeImplicant[1]);
        secondPartofEdgeImplicant.push(edgeImplicant[2]);
        secondPartofEdgeImplicant.push(edgeImplicant[3]);
        // console.log(`first part of edge implicant: ${firstPartofEdgeImplicant}`);
        // console.log(firstPartofEdgeImplicant);
        // console.log(`second part of edge implicant: ${secondPartofEdgeImplicant}`);
        // console.log(secondPartofEdgeImplicant)
      }
    }
    return [firstPartofEdgeImplicant, secondPartofEdgeImplicant,thirdPartofEdgeImplicant,fourthPartofEdgeImplicant,isEdge];
  };

  // function which draws all needed parts of edge implicant
  const drawEdgeImplicants = (edgeImplicants) => {
    const [rows, cols] = tableSize.split("x").map(Number);
    const canvas = document.getElementById("kmapCanvas");
    if (!canvas) return;

    assignColorsToImplicants(edgeImplicants);

    const ctx = canvas.getContext("2d");
    // ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings

    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    edgeImplicants.forEach((implicant) => {
      const id = generateImplicantId(implicant);
      const color = implicantColorMap[id]; // Retrieve the assigned color
    
      const [firstPart, secondPart,thirdPart, fourthPart, isEdge] = divideEdgeImplicantsIntoTwo(implicant);
      if(isEdge){
        drawImplicantPart(firstPart, color, ctx, cellWidth, cellHeight);
        drawImplicantPart(secondPart, color, ctx, cellWidth, cellHeight);
        drawImplicantPart(thirdPart, color, ctx, cellWidth, cellHeight);
        drawImplicantPart(fourthPart, color, ctx, cellWidth, cellHeight);
      }
      else{
      // Draw first part
      drawImplicantPart(firstPart, color, ctx, cellWidth, cellHeight);
    
      // Draw second part
      drawImplicantPart(secondPart, color, ctx, cellWidth, cellHeight);
      }
    });
  };

  //function for drawing one implicant part
  const drawImplicantPart = (implicantPart, color, ctx, cellWidth, cellHeight) => {

    const { minRow, maxRow, minCol, maxCol } = calculateImplicantBoundaries(implicantPart);

    let x;
    let y;
    // console.log(implicantPart);
    // console.log(implicantPart[0].col);
    if(implicantPart[0]===undefined){
      return;
    }

    if(implicantPart[0].col === 0){
      x = minCol * cellWidth - 10;
    }
    else if(implicantPart[0].col === 3){
      x = minCol * cellWidth + 10;
    }
    else{
      x = minCol * cellWidth;
    }
    if(implicantPart[0].row === 0){
      y = minRow * cellHeight - 5;
    }
    else if(implicantPart[0].row === 3){
      y = minRow * cellHeight + 5;
    }
    else{
      y = minRow * cellHeight;
    }
    
    const width = (maxCol - minCol + 1) * cellWidth - 0; // Adjusted for padding
    const height = (maxRow - minRow + 1) * cellHeight - 5; // Adjusted for padding
  
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const handleRemoveImplicant = (index) => {
    const newImplicants = implicants.filter((_, i) => i !== index);
    const newImplicantsIndexes =implicantCellIndexes.filter((_, i) => i !== index);
    addImplicant(newImplicants);
    addImplicantCellIndexes(newImplicantsIndexes);
  };
  
  const handleRemoveEdgeImplicant = (index) => {
    const [firstindex,secondindex,thirdindex,fourthindex] = edgeImplicants[index];
    if(firstindex===0 && secondindex===2 && thirdindex===8 && fourthindex===10){
      addImplicantCorner(false);
    }
    const newEdgeImplicants = edgeImplicants.filter((_, i) => i !== index);
    const newEdgeImplicantsIndexes =edgeimplicantCellIndexes.filter((_, i) => i !== index);
    addEdgeImplicant(newEdgeImplicants);
    addEdgeImplicantCellIndexes(newEdgeImplicantsIndexes);
  };

  return (
  
    <div className="Kmap">
      <h1>Karnaugh maps</h1>
      <Instructions></Instructions>
      <div className="settings" disabled={disabled}>
        <div className="Buttons">
          <select
            id="tableSize"
            onChange={handleTableSizeChange}
            disabled={disabled}
            value={tableSize}
          >
            <option value="0x0">Select map size</option>
            <option value="2x1">2 x 1</option>
            <option value="2x2">2 x 2</option>
            <option value="2x4">4 x 2</option>
            <option value="4x4">4 x 4</option>
          </select>
          <button
            id="button0"
            disabled={disabled}
            onClick={() => handleOptionChange(0)}
            style={{ backgroundColor: option === 0 ? "green" : "white" }}
          >
            0
          </button>
          <button
            id="button1"
            disabled={disabled}
            onClick={() => handleOptionChange(1)}
            style={{ backgroundColor: option === 1 ? "green" : "white" }}
          >
            1
          </button>
          <button id="autofill" disabled={disabled} onClick={fillCells}>
            Fill the rest
          </button>
          <button
            id="submitBtn"
            onClick={() => handleDisable()}
            disabled={disabled}
          >
            Submit
          </button>

          {/* <button id="clearBtn" onClick={()=>handleClearButton()} disabled={disabled}>Clear Cells</button> */}
          {/* create button and when its clicked console log hello */}
          <button id="goback" disabled={!disabled} onClick={handleGoBackButton}>
            Go back
          </button>
          {/* {/* <but id="submitBtn" onClick={()=>generateCodeLaTeX()} disabled={!disabled}>Generate code </but */}
          <button
            id="addImplicant"
            disabled={classicImplicantDisabled}
            onClick={() => addingimplicant()}
            style={{
              backgroundColor: markingImplicant === true ? "red" : "white",
            }}
          >
            + Add impl
          </button>
          <button
            id="addImplicant"
            disabled={edgeImplicantDisabled}
            onClick={() => addingEdgeimplicant()}
            style={{
              backgroundColor: markingEdgeImplicant === true ? "red" : "white",
            }}
          >
            + Edge impl
          </button>
          <button
            id="cornerImplicant"
            disabled={cornerImplicantDisabled}
            onClick={() => addCornerImplicant()}
          >
            + Corner impl
          </button>
          <button
            id="finishImplicant"
            disabled={finishImplicantDisabled}
            onClick={() => finishImplicant()}
          >
            Finish Implicant
          </button>
        </div>
      </div>
      <div className="kmap-wrapper">
        <div style={{ position: "relative" }}>
          {generateTable()}
          {disabled && (
            <canvas
              id="kmapCanvas"
              width={mapWidth}
              height={mapHeight}
              disabled={!disabled}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
              }}
            ></canvas>
          )}
        </div>
      </div>
      {/* {generateTable()} */}

      {/* <ImplicantsList id="implicantlist" implicants={implicants}></ImplicantsList> */}
      <ImplicantsList
        implicants={implicants}
        // implicants={implicants}
        onImplicantClick={handleImplicantClick}
        onRemoveImplicant={handleRemoveImplicant}
      />
      <EdgeImplicantList
        id="implicantlist"
        edgeImplicants={edgeImplicants}
        onImplicantClick={handleImplicantClick}
        onRemoveEdgeImplicant={handleRemoveEdgeImplicant}
      ></EdgeImplicantList>

      <button
        id="generateBtn"
        onClick={() => generateCodeLaTeX()}
        disabled={!disabled}
      >
        Generate code{" "}
      </button>

      <GeneratedCode
        id="generatedCode"
        disabled={!disabled}
        code={generatedCode}
      ></GeneratedCode>
    </div>
  );
};

export default Kmap;
