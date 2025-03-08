import React, { useState } from "react";

const Cell = ({ option, onClick, row, col, disabled,cellColor}) => {
  // Declare a state variable to store the value of the cell
  const [cellValue, setCellValue] = useState (null);


  

  const handleClick = () => {
   
      // if (cellValue === null) {
      if(!disabled){  
        setCellValue(option); 
        // console.log(cellValue)
        // console.log("cellValue===null if statement");
      }
      
      else{
        // console.log("cellValue===null else statement");
      }
        onClick(row, col);
       
        // console.log("this is row and col of a cell when clicked");
        // console.log(row, col);
        // console.log("handleClick in Cell compnent");
  };

  const cellStyle = cellColor ? { backgroundColor: cellColor } : {};

  return (
    <div className="cell" onClick= {handleClick} style={cellStyle} >
      {/* Render the cell value if it is not null */}
      {/* {cellValue && <ValueOfCell />} */}
      {cellValue}
      {/* {<ValueOfCell/>} */}
    </div>
  );
};

export default Cell;
