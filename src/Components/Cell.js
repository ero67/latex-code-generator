import React, { useState, memo } from "react";

const Cell = memo (({ option, onClick, row, col }) => {
  // Declare a state variable to store the value of the cell
  const [cellValue, setCellValue] = useState (null);

  // Define a function to handle the click event
  // const handleClick = () => {
  //   // Set the cell value to the option value
  //     if(cellValue === null){
  //       setCellValue (option);
  //    }
  // };

  const handleClick = () => {
    if (cellValue === null) {
      setCellValue(option);
      // Call the onClick callback with row and col information
      onClick(row, col);
    }
  };
  
  // Define a function to render the cell value
  const ValueOfCell = () => {
    return <div>{cellValue}</div>;
  };

  return (
    <div className="cell" onClick= {handleClick}>
      {/* Render the cell value if it is not null */}
      {cellValue && <ValueOfCell />}
      {/* {<ValueOfCell/>} */}
    </div>
  );
});

export default Cell;
