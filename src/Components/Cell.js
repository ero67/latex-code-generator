import React, { useState } from "react";

const Cell = ({ option, onClick, row, col, disabled}) => {
  // Declare a state variable to store the value of the cell
  const [cellValue, setCellValue] = useState (null);


  

  const handleClick = () => {
  
      // if (cellValue === null) {
      if(!disabled){  
        setCellValue(option); 
        console.log("cellValue===null if statement");
      }
      else{
        console.log("cellValue===null else statement");
      }
      // }
        // Call the onClick callback with row and col information
        onClick(row, col);
        console.log("handleClick in Cell compnent");
  };
  
  // Define a function to render the cell value
  const ValueOfCell = () => {
    return <div>{cellValue}</div> ;
  };

  return (
    <div className="cell" onClick= {handleClick}>
      {/* Render the cell value if it is not null */}
      {/* {cellValue && <ValueOfCell />} */}
      {cellValue}
      {/* {<ValueOfCell/>} */}
    </div>
  );
};

export default Cell;
