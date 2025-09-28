import "../../Pages/index.css";

const Cell = ({ onClick, row, col, cellColor, value }) => {
  // Log the actual value and its type when the component renders

  const handleClick = () => {
    onClick(row, col);
  };

  const cellStyle = cellColor ? { backgroundColor: cellColor } : {};

  // This approach should show us what's happening
  return (
    <div className="cell" onClick={handleClick} style={cellStyle}>
      <span>{value}</span>
    </div>
  );
};

export default Cell;
