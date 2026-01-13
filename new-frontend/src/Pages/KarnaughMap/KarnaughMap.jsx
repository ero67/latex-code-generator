import React, { useState, useEffect } from "react";
import Cell from "../../Components/KarnaughMap/Cell.jsx";
import GeneratedCode from "../../Components/GeneratedCode";
import { LaTeXEditor } from "../../Components/LaTeXEditor";
import ImplicantsList from "../../Components/KarnaughMap/ImplicantsList";
import EdgeImplicantList from "../../Components/KarnaughMap/EdgeImplicantList";
import Instructions from "../../Components/KarnaughMap/Instructions";
import { karnaughMapService } from "../../services/karnaughmap.service";
import { ToastContainer, toast } from "react-toastify";
import Dropdown from "../../Components/Dropdown/DropDown";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LatexImportModal from "../../Components/KarnaughMap/LatexImportModal";
import { validateKmapLatex, parseKmapLatex } from "../../utils/kmapParser";

const BinaryColumnLabels = ({ size }) => {
  // Generate binary labels based on size with proper Gray code ordering
  let labels = [];
  const [rows, cols] = size.split("x").map(Number);
  if (cols === 1) {
    labels = ["0"]; // Only one column
  } else if (cols === 2) {
    labels = ["0", "1"]; // Two columns
  } else if (cols === 4) {
    labels = ["00", "01", "11", "10"]; // Four columns with Gray code ordering
  }

  // Calculate width based on map size
  const labelWidth = size === "4x4" ? 50 : 50; // Adjust as needed

  return (
    <div className="flex justify-center mb-2">
      <div style={{ width: "30px" }}></div>{" "}
      {/* Space for corner - increased for better alignment */}
      {labels.map((label, index) => (
        <div
          key={index}
          className="cell-label font-medium ml-2 "
          style={{
            color: "#006400",
            width: `${labelWidth}px`,
            textAlign: "center",
            paddingLeft: "2px", // Slight adjustment to center the binary labels over cells
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
};

// Improved binary row labels with better alignment
const BinaryRowLabels = ({ size }) => {
  // Generate binary labels based on size with proper Gray code ordering
  let labels = [];
  const [rows, cols] = size.split("x").map(Number);
  if (rows === 1) {
    labels = ["0"]; // Only one row
  } else if (rows === 2) {
    labels = ["0", "1"]; // Two rows
  } else if (rows === 4) {
    labels = ["00", "01", "11", "10"]; // Four rows with Gray code ordering
  }

  // Calculate height based on map size
  const labelHeight = size === "4x4" ? 50 : 50; // Adjust as needed

  return (
    <div className="flex flex-col mr-2 mb-4">
      {" "}
      {/* Increased margin for better alignment */}
      {labels.map((label, index) => (
        <div
          key={index}
          className="cell-label font-medium mt-2"
          style={{
            color: "#006400",
            height: `${labelHeight}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: "6px",
            paddingTop: "3px", // Slight adjustment to vertically center the labels
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
};

const Kmap = () => {
  //edit stuff
  const { user } = useAuth();

  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditMode, setIsEdit] = useState(id);
  const [cellValues, setCellValues] = useState([]);

  const [includePreamble, setIncludePreamble] = useState(false);
  const [includeDocumentTags, setIncludeDocumentTags] = useState(false);

  const [variables, setVariables] = useState([]);

  const [customVariablesAllowed, setCustomVariablesAllowed] = useState(false);

  const [tableSize, setTableSize] = useState("0x0");
  const [option, setOption] = useState("0");
  const [opposite, setOpposite] = useState("1");
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

  //useStates for coloring implicants
  const [singeImplicantIndexes, addPartOfSingleImplicantIndex] = useState([]);
  const [implicantCellIndexes, addImplicantCellIndexes] = useState([]);

  const [singeEdgeImplicantIndexes, addPartOfSingleEdgeImplicantIndex] =
    useState([]);
  const [edgeimplicantCellIndexes, addEdgeImplicantCellIndexes] = useState([]);

  // corner implicant
  const [implicantCorner, addImplicantCorner] = useState(false);

  const [latexInput, setLatexInput] = useState("");

  const [showLaTeXEditor, setShowLaTeXEditor] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(
    "Your code will appear here \n after you click on Generate Code button"
  );
  // drAwing implicants
  const [mapHeight, setMapHeight] = useState(null);
  const [mapWidth, setMapWidth] = useState(null);

  const [activeImplicantIndex, setActiveImplicantIndex] = useState(null);
  const [activeImplicantType, setActiveImplicantType] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const [rows, cols] = tableSize.split("x").map(Number);
  const rowVarsCount = Math.floor(Math.log2(rows));
  const colVarsCount = Math.floor(Math.log2(cols));
  const totalVars = rowVarsCount + colVarsCount;

  const rowVariables = variables.slice(0, rowVarsCount);
  const colVariables = variables.slice(rowVarsCount, totalVars);

  const VariableLabels = ({ labels, isColumn }) => (
    <div
      className={`variable-labels ${isColumn ? "column-labels" : "row-labels"}`}
    >
      {labels.map((label, index) => (
        <div
          key={index}
          className={isColumn ? "column-variable" : "row-variable"}
        >
          {label}
        </div>
      ))}
    </div>
  );

  const renderVarInputs = () => (
    <div className="variable-inputs">
      {variables.map((varName, index) => (
        <input
          key={`var-${index}`}
          value={varName}
          onChange={(e) => {
            const newVars = [...variables];
            newVars[index] = e.target.value;
            setVariables(newVars);
          }}
          placeholder={`X${index}`}
        />
      ))}
    </div>
  );

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
    let activeImplicanCellIndexes = edgeimplicantCellIndexes;

    if (activeImplicantType === "default") {
      activeImplicanCellIndexes = implicantCellIndexes;
    } else if (activeImplicantType === "edge") {
      activeImplicanCellIndexes = edgeimplicantCellIndexes;
    }
    if (activeImplicantIndex !== null) {
      const activeImplicant = activeImplicanCellIndexes[activeImplicantIndex];

      if (activeImplicant === undefined) {
        return;
      }
      if (
        activeImplicant.some((cell) => cell.row === row && cell.col === col)
      ) {
        return activeColor; // Color for active implicant cells
      }
    }

    return null; // No color if the cell is not part of any implicant
  }

  // zmena velkosti tabulky
  const handleTableSizeChange = (event) => {
    const newSize = event.target.value;
    setTableSize(newSize);
    const [rows, cols] = newSize.split("x").map(Number);
    const totalVars = Math.ceil(Math.log2(rows * cols));
    setVariables(Array(totalVars).fill(""));
  };

  // zmena hodnoty ktoru budeme davat do cells na ktore budeme klikat
  const handleOptionChange = (value) => {
    setOption(value);

    if (value === "1") {
      setOpposite("0");
    } else {
      setOpposite("0");
    }
  };

  // handling initail state of buttons shown
  const handleDisable = () => {
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
    setMapHeight(rect.height);
    setMapWidth(rect.width);
  };
  // TODO len passnut array z backendu do tejto funckie
  const fillCellsOnEdit = (cellsFromBackend) => {
    // Loop through all the cells in the table
    const cells = document.getElementsByClassName("cell");
    let i = 0;
    for (let cell of cells) {
      // If the cell is empty, set its value to the opposite number
      // if (!cell.textContent) {
      cell.textContent = cellsFromBackend[i];
      i++;
      // }
    }
  };

  // Define a function to fill the cells with the opposite number
  // const fillCells = () => {
  //   // Loop through all the cells in the tabl
  //   const cells = document.getElementsByClassName("cell");
  //   for (let cell of cells) {
  //     // If the cell is empty, set its value to the opposite number
  //     if (!cell.textContent) {
  //       cell.textContent = option;
  //     }
  //   }
  // };

  const fillCells = () => {
    const [rows, cols] = tableSize.split("x").map(Number);
    const totalCells = rows * cols;
    const newCellValues = [...cellValues];

    // Fill any empty cells with the selected option
    for (let i = 0; i < totalCells; i++) {
      if (!newCellValues[i]) {
        newCellValues[i] = option;
      }
    }

    setCellValues(newCellValues);
  };

  const getContentOfCells = () => {
    const cells = document.getElementsByClassName("cell");
    let content = [];
    for (let cell of cells) {
      content.push(cell.textContent);
    }

    return content;
  };

  const addCornerImplicant = () => {
    // Correctly adding all corner indices in a single update
    const newEdgeImplicant = [...edgeImplicant, 0, 2, 8, 10];

    const newSingleEdgeImplicantIndexes = [
      { row: 0, col: 0 },
      { row: 0, col: 3 },
      { row: 3, col: 0 },
      { row: 3, col: 3 },
    ];

    addPartOfSingleEdgeImplicantIndex(newSingleEdgeImplicantIndexes);

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

    // Calculate the number of variables based on powers of 2
    const rowVarsCount = Math.floor(Math.log2(rows));
    const colVarsCount = Math.floor(Math.log2(cols));
    const totalVars = rowVarsCount + colVarsCount;

    // Allocate variables based on the calculated counts
    const rowLabels = variables
      .slice(0, rowVarsCount)
      .reverse()
      .map((v) => `${v}`)
      .join("][");
    const colLabels = variables
      .slice(rowVarsCount, totalVars)
      .reverse()
      .map((v) => `${v}`)
      .join("][");

    const content = getContentOfCells();
    let code = "";
    if (includePreamble) {
      code += `\\documentclass{article}\n\\usepackage{karnaugh-map}\n\\begin{document}\n`;
    }
    if (includeDocumentTags && !includePreamble) {
      code += `\\usepackage{karnaugh-map}\n`;
    }

    if (customVariablesAllowed) {
      code += `\\begin{karnaugh-map}[${cols}][${rows}][1][${colLabels}][${rowLabels}]\n`;
    } else {
      code += `\\begin{karnaugh-map}[${cols}][${rows}][1]\n`;
    }

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
      toast.error("Implicant na rohy sa dá zaznačiť len na poliach rozmeru 4x4");
    }

    // logic for generating code for edge implicant
    // required number of {} for \implicantedge command is 4
    // if i want to mark only 2 cells i need to put both indexes twice
    for (let row = 0; row < edgeImplicants.length; row++) {
      if (edgeImplicants[row].length === 2) {
        code += `       \\implicantedge{${edgeImplicants[row][0]}}{${edgeImplicants[row][0]}}{${edgeImplicants[row][1]}}{${edgeImplicants[row][1]}}\n`;
      } else if (edgeImplicants[row].length === 4) {
        const [firstindex, secondindex, thirdindex, fourthindex] =
          edgeImplicants[row];
        if (
          firstindex === 0 &&
          secondindex === 2 &&
          thirdindex === 8 &&
          fourthindex === 10 &&
          implicantCorner
        ) {
          continue;
        } else {
          code += `       \\implicantedge{${edgeImplicants[row][0]}}{${edgeImplicants[row][1]}}{${edgeImplicants[row][2]}}{${edgeImplicants[row][3]}}\n`;
        }
      } else if (edgeImplicants[row].length === 6) {
        code += `       \\implicantedge{${edgeImplicants[row][0]}}{${edgeImplicants[row][2]}}{${edgeImplicants[row][3]}}{${edgeImplicants[row][5]}}\n`;
      } else if (edgeImplicants[row].length === 8) {
        code += `       \\implicantedge{${edgeImplicants[row][0]}}{${edgeImplicants[row][1]}}{${edgeImplicants[row][2]}}{${edgeImplicants[row][3]}}\n`;
      }
    }
    code += "\\end{karnaugh-map}";
    if (includePreamble) {
      code += "\n\\end{document}";
    }
    setGeneratedCode(code);
  };

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

    // Calculate indices for rectangular or linear implicants based on corrected corners
    for (let r = topLeft.row; r <= bottomRight.row; r++) {
      for (let c = topLeft.col; c <= bottomRight.col; c++) {
        implicantIndices.push({ row: r, col: c });
      }
    }
    if (rows === 2 && cols === 2) {
      implicant[0] = indexes_2_x_2[topLeft.row][topLeft.col];
      implicant[1] = indexes_2_x_2[bottomRight.row][bottomRight.col];
    } else {
      implicant[0] = indexes[topLeft.row][topLeft.col];
      implicant[1] = indexes[bottomRight.row][bottomRight.col];
    }

    // Add the newly calculated implicant to the list of implicants
    addImplicant([...implicants, implicant]);

    // Return the indices of the cells forming the implicant
    return implicantIndices;
  }

  const [isEightEdteHorizontal, setIsEightEdgeHorizontal] = useState(true);

  // sorting edge implicant so user can click in any order and it will be generated correctly
  const sortVerticalEdgeImplicants = (combinedArray, isHorizontal) => {
    const [rows, cols] = tableSize.split("x").map(Number);

    // Check for horizontal or vertical alignment based on user clicks
    let allHorizontalEdges = combinedArray.every(
      (item) => item.row === 0 || item.row === rows - 1
    );
    let allVerticalEdges = combinedArray.every(
      (item) => item.col === 0 || item.col === cols - 1
    );

    // Decide on the primary sorting criterion based on the edge alignment
    let prioritizeRow = allHorizontalEdges && !allVerticalEdges;
    if (combinedArray[0].row === combinedArray[1].row) {
      // allVerticalEdges = true;
      prioritizeRow = true;
    }
    if (combinedArray.length === 8) {
      prioritizeRow = isEightEdteHorizontal;
      prioritizeRow = isHorizontal;
    }
    return combinedArray.sort((a, b) => {
      if (prioritizeRow) {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      } else {
        if (a.col !== b.col) return a.col - b.col;
        return a.row - b.row;
      }
    });
  };

  // combines arrays of the cell real indexse and indexes of the cells in the kmap package
  const combineArrays = (implicants, indexes) => {
    return implicants.map((implicant, i) => ({
      ...implicant,
      index: indexes[i],
    }));
  };

  //function which processes the edge implicant selection, meaning it calculates the cells which are part of the implicant based on 2 cells that were selected by clicks
  //(added for functionality of selecting implicants with 2 clicks)
  const processEdgeImplicantClicks = (edgeImplicantArray, rows, cols) => {
    // Direct return if clicks are in the same row or column (linear edge implicants)
    if (
      edgeImplicantArray[0].row === edgeImplicantArray[1].row ||
      edgeImplicantArray[0].col === edgeImplicantArray[1].col
    ) {
      return edgeImplicantArray;
    } else {
      let fullImplicant = [];

      // Determine the rows and cols involved in the implicant
      const startRow = Math.min(
        edgeImplicantArray[0].row,
        edgeImplicantArray[1].row
      );
      const endRow = Math.max(
        edgeImplicantArray[0].row,
        edgeImplicantArray[1].row
      );
      const startCol = Math.min(
        edgeImplicantArray[0].col,
        edgeImplicantArray[1].col
      );
      const endCol = Math.max(
        edgeImplicantArray[0].col,
        edgeImplicantArray[1].col
      );

      // Handle edge implicants that wrap around the map horizontally or vertically
      if (startCol === 0 && endCol === cols - 1) {
        // Horizontal edge wrapping
        for (let row = startRow; row <= endRow; row++) {
          fullImplicant.push({ row, col: 0 });
          fullImplicant.push({ row, col: cols - 1 });
        }
      } else if (startRow === 0 && endRow === rows - 1) {
        // Vertical edge wrapping
        for (let col = startCol; col <= endCol; col++) {
          fullImplicant.push({ row: 0, col });
          fullImplicant.push({ row: rows - 1, col });
        }
      }

      fullImplicant.sort((a, b) => {
        if (a.col !== b.col) {
          return a.col - b.col; // Prioritize column 0 over column 3
        }
        return a.row - b.row; // Within the same column, sort from top to bottom
      });

      return fullImplicant;
    }
  };

  //handle logic of finish implicant button and all things that this button press triggers
  const finishImplicant = () => {
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
    // logic for processing default implicant after user is done selecting cells of the implicant
    if (markingImplicant) {
      //adds implicant to the all implicants list
      if (implicant.length > 0) {
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
      }
      //reseting variables connected with adding implicant
      addPartOfSingleImplicantIndex([]);
      addPartOfImplicant([]);
      setNumberOfImplicants(0);
      setMarkingImplicant(false);
    }
    // LOGIC FOR PROCESSING EDGE IMPLICANT AFTER USER IS DONE SELECTING CELLS OF THE IMPLICANT
    else if (markingEdgeImplicant) {
      if (
        edgeImplicant.length > 1 &&
        (edgeImplicant.length === 2 ||
          edgeImplicant.length === 4 ||
          edgeImplicant.length === 6 ||
          edgeImplicant.length === 8)
      ) {
        const combinedArray = combineArrays(
          singeEdgeImplicantIndexes,
          edgeImplicant
        );
        let isHorizontal = false;
        if (
          (combinedArray[0].row === 0 &&
            combinedArray[0].col === 0 &&
            combinedArray[1].row === 3 &&
            combinedArray[1].col === 3) ||
          (combinedArray[0].row === 3 &&
            combinedArray[0].col === 3 &&
            combinedArray[1].row === 0 &&
            combinedArray[1].col === 0) ||
          (combinedArray[0].row === 3 &&
            combinedArray[0].col === 0 &&
            combinedArray[1].row === 0 &&
            combinedArray[1].col === 3) ||
          (combinedArray[0].row === 0 &&
            combinedArray[0].col === 3 &&
            combinedArray[1].row === 3 &&
            combinedArray[1].col === 0)
        ) {
          isHorizontal = window.confirm(
            "Choose 'OK' for Horizontal or 'Cancel' for Vertical"
          );
          setIsEightEdgeHorizontal(isHorizontal);
        }

        const sortedImplicants = sortVerticalEdgeImplicants(
          combinedArray,
          isHorizontal
        );

        const fullimplicant = processEdgeImplicantClicks(
          sortedImplicants,
          rows,
          cols
        );
        const sortedFullImplicant = sortVerticalEdgeImplicants(
          fullimplicant,
          isHorizontal
        );

        // adding the kmap package indexes of the cells which are part of the implicant
        let fullEdgeImplicant = [];
        for (let i = 0; i < sortedFullImplicant.length; i++) {
          if (rows === 2 && cols === 2) {
            fullEdgeImplicant[i] =
              indexes_2_x_2[fullimplicant[i].row][fullimplicant[i].col];
          } else {
            fullEdgeImplicant[i] =
              indexes[fullimplicant[i].row][fullimplicant[i].col];
          }
        }

        let tempFullEdgeImplicant_kmindexes = [];
        let tempFullEdgeImplicant_realindexes = [];
        if (sortedFullImplicant.length === 8) {
          if (isHorizontal) {
            tempFullEdgeImplicant_kmindexes = [
              fullEdgeImplicant[0],
              fullEdgeImplicant[1],
              fullEdgeImplicant[6],
              fullEdgeImplicant[7],
              fullEdgeImplicant[2],
              fullEdgeImplicant[3],
              fullEdgeImplicant[4],
              fullEdgeImplicant[5],
            ];
            tempFullEdgeImplicant_realindexes = [
              fullimplicant[0],
              fullimplicant[1],
              fullimplicant[6],
              fullimplicant[7],
              fullimplicant[2],
              fullimplicant[3],
              fullimplicant[4],
              fullimplicant[5],
            ];
          } else {
            tempFullEdgeImplicant_kmindexes = [
              fullEdgeImplicant[0],
              fullEdgeImplicant[3],
              fullEdgeImplicant[4],
              fullEdgeImplicant[7],
              fullEdgeImplicant[1],
              fullEdgeImplicant[2],
              fullEdgeImplicant[5],
              fullEdgeImplicant[6],
            ];
            tempFullEdgeImplicant_realindexes = [
              fullimplicant[0],
              fullimplicant[3],
              fullimplicant[4],
              fullimplicant[7],
              fullimplicant[1],
              fullimplicant[2],
              fullimplicant[5],
              fullimplicant[6],
            ];
          }
          addEdgeImplicant([
            ...edgeImplicants,
            tempFullEdgeImplicant_kmindexes,
          ]);
          addEdgeImplicantCellIndexes([
            ...edgeimplicantCellIndexes,
            tempFullEdgeImplicant_realindexes,
          ]);
        } else {
          addEdgeImplicant([...edgeImplicants, fullEdgeImplicant]);

          addEdgeImplicantCellIndexes([
            ...edgeimplicantCellIndexes,
            fullimplicant,
          ]);
        }
      }
      ////// CLEARING DATA FOR EDGE IMPLICANT AFTER ADDING IT TO HE FINAL ARRAY
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
    drawImplicants(implicantCellIndexes);
  };

  //set up buttons settings and interface when adding deafult implicant
  const addingimplicant = () => {
    setMarkingImplicant(!markingImplicant);
    setfinishImplicantDisabled(!finishImplicantDisabled);
    setClassicImplicantDisabled(false);
    setEdgeImplicantDisabled(!edgeImplicantDisabled);
    if (tableSize === "4x4") {
      setCornerImplicantDisabled(!cornerImplicantDisabled);
    }
  };

  //set up buttons settings and interface when adding edge implicant
  const addingEdgeimplicant = () => {
    setMarkingEdgeImplicant(!markingEdgeImplicant);

    setfinishImplicantDisabled(false);
    setClassicImplicantDisabled(!classicImplicantDisabled);
    setEdgeImplicantDisabled(false);
    if (tableSize === "4x4") {
      setCornerImplicantDisabled(!cornerImplicantDisabled);
    }
  };

  // const handleCellClick = (row, col) => {
  //   let indexes = [];
  //   let rows = 0;
  //   let cols = 0;
  //   if (tableSize === "2x2") {
  //     indexes = [
  //       [0, 1],
  //       [2, 3],
  //     ];
  //     rows = 2;
  //     cols = 2;
  //   } else if (tableSize === "2x1") {
  //     indexes = [[0], [1]];
  //     rows = 2;
  //     cols = 1;
  //   } else {
  //     indexes = [
  //       [0, 1, 3, 2],
  //       [4, 5, 7, 6],
  //       [12, 13, 15, 14],
  //       [8, 9, 11, 10],
  //     ];
  //     rows = 4;
  //     cols = 4;
  //   }

  //   // disabled means that we are in the implicant part of this page
  //   // if am am marking basic implicant
  //   if (disabled && markingImplicant && implicant.length <= 1) {
  //     addPartOfImplicant([...implicant, indexes[row][col]]);
  //     addPartOfSingleImplicantIndex([...singeImplicantIndexes, { row, col }]);
  //     setNumberOfImplicants(numberOfImplicants + 1);
  //   }

  //   // if i am choosing esge implicant and also disbled is true
  //   // disabled means that we are in the implicant part of this page
  //   else if (disabled && markingEdgeImplicant) {
  //     if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
  //       addPartOfEdgeImplicant([...edgeImplicant, indexes[row][col]]);
  //       addPartOfSingleEdgeImplicantIndex([
  //         ...singeEdgeImplicantIndexes,
  //         { row, col },
  //       ]);

  //       setNumberOfEdgeImplicants(numberOfEdgeImplicants + 1);
  //     } else {
  //       alert("you can only select Cells on edges");
  //       setMarkingEdgeImplicant(false);
  //       setfinishImplicantDisabled(true);
  //       setClassicImplicantDisabled(false);
  //       setCornerImplicantDisabled(false);
  //     }
  //   }
  // };

  useEffect(() => {
    const [rows, cols] = tableSize.split("x").map(Number);
    setCellValues(Array(rows * cols).fill(""));
  }, [tableSize]);

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
    // If we're in the initial configuration phase (not in the implicant part)
    if (!disabled) {
      const newCellValues = [...cellValues];
      const index = row * cols + col;

      // Store the current option value directly (0 or 1)
      newCellValues[index] = option;

      setCellValues(newCellValues);
      return;
    }
    // The rest of your existing code for implicant handling
    if (markingImplicant && implicant.length <= 1) {
      addPartOfImplicant([...implicant, indexes[row][col]]);
      addPartOfSingleImplicantIndex([...singeImplicantIndexes, { row, col }]);
      setNumberOfImplicants(numberOfImplicants + 1);
    } else if (markingEdgeImplicant) {
      if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
        addPartOfEdgeImplicant([...edgeImplicant, indexes[row][col]]);
        addPartOfSingleEdgeImplicantIndex([
          ...singeEdgeImplicantIndexes,
          { row, col },
        ]);
        setNumberOfEdgeImplicants(numberOfEdgeImplicants + 1);
      } else {
        toast.error("you can only select Cells on edges");
        setMarkingEdgeImplicant(false);
        setfinishImplicantDisabled(true);
        setClassicImplicantDisabled(false);
        setCornerImplicantDisabled(false);
      }
    }
  };

  useEffect(() => {
    if (implicant.length === 2 || edgeImplicant.length === 2) {
      finishImplicant();
    }
    // Additional actions here based on the updated 'implicant' state
  }, [implicant, edgeImplicant]); // This effect runs whenever 'implicant' changes

  const generateTable = () => {
    // get the number of rows and columns from the tableSize string
    const [rows, cols] = tableSize.split("x").map(Number);
    const table = [];

    //iterate through the rows and columns to create the cells
    for (let row = 0; row < rows; row++) {
      const currentRow = [];
      for (let col = 0; col < cols; col++) {
        // part of the code for generating jsx and html code for cells
        currentRow.push(
          <Cell
            key={`${row}${col}`}
            option={option}
            onClick={handleCellClick}
            row={row}
            col={col}
            disabled={disabled}
            value={cellValues[row * cols + col] || ""}
            cellColor={getCellColor(
              row,
              col,
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

  // Import handler that mirrors DB-load logic using structured parse
  const handleImportFromLatex = (parsed) => {
    try {
      // Size and variables - set these first
      const mapSize = parsed.tableSize;
      setCornerImplicantDisabled(mapSize !== "4x4");
      setTableSize(mapSize);
      setCustomVariablesAllowed(parsed.customVariablesAllowed);
      setVariables(parsed.customVariablesValues);

      // Cells - set state first, then fill DOM cells after render
      setCellValues(parsed.cellValues);

      // Implicants (karnaugh-map package indices)
      addImplicant(parsed.implicants || []);
      addEdgeImplicant(parsed.edgeImplicants || []);

      // Derive drawing indices from imported implicants
      const [rows, cols] = parsed.tableSize.split("x").map(Number);
      const getIndexMap = (r, c) => {
        if (r === 4 && c === 4) return [[0,1,3,2],[4,5,7,6],[12,13,15,14],[8,9,11,10]];
        if (r === 2 && c === 4) return [[0,1,3,2],[4,5,7,6]];
        if (r === 2 && c === 2) return [[0,1],[2,3]];
        if (r === 2 && c === 1) return [[0],[1]];
        return null;
      };
      const indexMap = getIndexMap(rows, cols);

      const mapIndexToRowCol = (idx) => {
        for (let r = 0; r < indexMap.length; r++) {
          for (let c = 0; c < indexMap[r].length; c++) {
            if (indexMap[r][c] === idx) return { row: r, col: c };
          }
        }
        return null;
      };

      const buildRectCells = (aIdx, bIdx) => {
        const a = mapIndexToRowCol(aIdx);
        const b = mapIndexToRowCol(bIdx);
        if (!a || !b) return [];
        const topLeft = { row: Math.min(a.row, b.row), col: Math.min(a.col, b.col) };
        const bottomRight = { row: Math.max(a.row, b.row), col: Math.max(a.col, b.col) };
        const cells = [];
        for (let r = topLeft.row; r <= bottomRight.row; r++) {
          for (let c = topLeft.col; c <= bottomRight.col; c++) {
            cells.push({ row: r, col: c });
          }
        }
        return cells;
      };

      const importedImplicantCells = (parsed.implicants || []).map(([a,b]) => buildRectCells(a,b));

      const importedEdgeCells = (parsed.edgeImplicants || []).map((arr) => {
        // Map each package index to row/col; keep order
        return arr.map((idx) => mapIndexToRowCol(idx)).filter(Boolean);
      });

      addImplicantCellIndexes(importedImplicantCells);
      addEdgeImplicantCellIndexes(importedEdgeCells);

      // Corner implicant flag
      addImplicantCorner(parsed.cornerImplicant === true);

      // Switch to edit view and fill cells similar to DB load
      setTimeout(() => {
        // Fill cells using the same method as DB load
        fillCellsOnEdit(parsed.cellValues);
        handleDisable();
        if (parsed.cornerImplicant && parsed.tableSize === "4x4") {
          // Add the visual corner implicant rectangles if applicable
          addCornerImplicant();
        }
      }, 100);
    } catch (e) {
      toast.error("Failed to apply imported LaTeX");
    }
  };

  //----------FUNCTIONS FOR DRAWING IMPLICANTS ON KMAP CANVAS----------------

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

    drawEdgeImplicants(edgeimplicantCellIndexes);
  };

  //useEffect function which draws implicants when something changes
  // useEffect(() => {
  //   drawImplicants(implicantCellIndexes);
  // }, [disabled, implicantCellIndexes, tableSize]);

  //function for diving edge implicants into parts since the edge implicant is constructed from multiple rectangles for one implicant
  const divideEdgeImplicantsIntoTwo = (edgeImplicant) => {
    let firstPartofEdgeImplicant = [];
    let secondPartofEdgeImplicant = [];
    let thirdPartofEdgeImplicant = [];
    let fourthPartofEdgeImplicant = [];
    let isEdge = false;

    if (edgeImplicant.length === 2) {
      firstPartofEdgeImplicant.push(edgeImplicant[0]);
      secondPartofEdgeImplicant.push(edgeImplicant[1]);
    } else if (edgeImplicant.length === 4) {
      // check if edgeimplicant is corner implicant
      if (
        edgeImplicant[0].row === 0 &&
        edgeImplicant[0].col === 0 &&
        edgeImplicant[1].row === 0 &&
        edgeImplicant[1].col === 3 &&
        edgeImplicant[2].row === 3 &&
        edgeImplicant[2].col === 0 &&
        edgeImplicant[3].row === 3 &&
        edgeImplicant[3].col === 3
      ) {
        firstPartofEdgeImplicant.push(edgeImplicant[0]);
        secondPartofEdgeImplicant.push(edgeImplicant[1]);
        thirdPartofEdgeImplicant.push(edgeImplicant[2]);
        fourthPartofEdgeImplicant.push(edgeImplicant[3]);
        isEdge = true;
      } else {
        if (edgeImplicant[0].row === edgeImplicant[1].row) {
          firstPartofEdgeImplicant.push(edgeImplicant[0]);
          firstPartofEdgeImplicant.push(edgeImplicant[1]);
          secondPartofEdgeImplicant.push(edgeImplicant[2]);
          secondPartofEdgeImplicant.push(edgeImplicant[3]);
        }

        firstPartofEdgeImplicant.push(edgeImplicant[0]);
        firstPartofEdgeImplicant.push(edgeImplicant[1]);
        secondPartofEdgeImplicant.push(edgeImplicant[2]);
        secondPartofEdgeImplicant.push(edgeImplicant[3]);
      }
    } else if (edgeImplicant.length === 6) {
      //hardcoded edge indexes of edge implicants since the edge implicant is already sorted so its always the same
      firstPartofEdgeImplicant.push(edgeImplicant[0]);
      firstPartofEdgeImplicant.push(edgeImplicant[2]);
      secondPartofEdgeImplicant.push(edgeImplicant[3]);
      secondPartofEdgeImplicant.push(edgeImplicant[5]);
    } else if (edgeImplicant.length === 8) {
      firstPartofEdgeImplicant.push(edgeImplicant[0]);
      firstPartofEdgeImplicant.push(edgeImplicant[1]);
      secondPartofEdgeImplicant.push(edgeImplicant[2]);
      secondPartofEdgeImplicant.push(edgeImplicant[3]);
    }

    return [
      firstPartofEdgeImplicant,
      secondPartofEdgeImplicant,
      thirdPartofEdgeImplicant,
      fourthPartofEdgeImplicant,
      isEdge,
    ];
  };

  // function which draws all needed parts of edge implicant
  const drawEdgeImplicants = (edgeImplicants) => {
    console.log(edgeImplicants, "drawiiing");
    const [rows, cols] = tableSize.split("x").map(Number);
    const canvas = document.getElementById("kmapCanvas");
    if (!canvas) return;

    assignColorsToImplicants(edgeImplicants);

    const ctx = canvas.getContext("2d");

    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    edgeImplicants.forEach((implicant) => {
      const id = generateImplicantId(implicant);
      const color = implicantColorMap[id]; // Retrieve the assigned color

      const [firstPart, secondPart, thirdPart, fourthPart, isEdge] =
        divideEdgeImplicantsIntoTwo(implicant);
      if (isEdge) {
        drawImplicantPart(firstPart, color, ctx, cellWidth, cellHeight);
        drawImplicantPart(secondPart, color, ctx, cellWidth, cellHeight);
        drawImplicantPart(thirdPart, color, ctx, cellWidth, cellHeight);
        drawImplicantPart(fourthPart, color, ctx, cellWidth, cellHeight);
      } else {
        // Draw first part
        drawImplicantPart(firstPart, color, ctx, cellWidth, cellHeight);

        // Draw second part
        drawImplicantPart(secondPart, color, ctx, cellWidth, cellHeight);
      }
    });
  };

  //function for drawing one implicant part
  const drawImplicantPart = (
    implicantPart,
    color,
    ctx,
    cellWidth,
    cellHeight
  ) => {
    const { minRow, maxRow, minCol, maxCol } =
      calculateImplicantBoundaries(implicantPart);

    let x;
    let y;
    if (implicantPart[0] === undefined) {
      return;
    }

    if (implicantPart[0].col === 0) {
      x = minCol * cellWidth - 10;
    } else if (implicantPart[0].col === 3) {
      x = minCol * cellWidth + 10;
    } else {
      x = minCol * cellWidth;
    }
    if (implicantPart[0].row === 0) {
      y = minRow * cellHeight - 5;
    } else if (implicantPart[0].row === 3) {
      y = minRow * cellHeight + 5;
    } else {
      y = minRow * cellHeight;
    }

    const width = (maxCol - minCol + 1) * cellWidth - 0; // Adjusted for padding
    const height = (maxRow - minRow + 1) * cellHeight - 5; // Adjusted for padding

    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fill();
  };
  //---------------------------------------------------------------------------------------------------------------------------

  const handleRemoveImplicant = (index) => {
    const newImplicants = implicants.filter((_, i) => i !== index);
    const newImplicantsIndexes = implicantCellIndexes.filter(
      (_, i) => i !== index
    );
    addImplicant(newImplicants);
    addImplicantCellIndexes(newImplicantsIndexes);
  };

  const handleRemoveEdgeImplicant = (index) => {
    const [firstindex, secondindex, thirdindex, fourthindex] =
      edgeImplicants[index];
    if (
      firstindex === 0 &&
      secondindex === 2 &&
      thirdindex === 8 &&
      fourthindex === 10
    ) {
      addImplicantCorner(false);
    }
    const newEdgeImplicants = edgeImplicants.filter((_, i) => i !== index);
    const newEdgeImplicantsIndexes = edgeimplicantCellIndexes.filter(
      (_, i) => i !== index
    );
    addEdgeImplicant(newEdgeImplicants);
    addEdgeImplicantCellIndexes(newEdgeImplicantsIndexes);
  };

  const karnaughMapStructure = {
    tableSize: tableSize,
    implicants: implicants,
    implicantCellIndexes: implicantCellIndexes,
    edgeImplicantCellIndexes: edgeimplicantCellIndexes,
    edgeImplicants: edgeImplicants,
    cellValues: getContentOfCells(),
    customVariablesAllowed: customVariablesAllowed,
    customVariablesValues: variables,
    cornerImplicant: implicantCorner,
    userId: user?.id,
  };

  // const handleSave = async () => {
  //   if (user == null) {
  //     return;
  //   }
  //   try {
  //     const response = await karnaughMapService.saveKM(karnaughMapStructure);
  //     console.log("Save Response", response);
  //   } catch (error) {
  //     console.error("Error while saving KM: ", error);
  //   }
  // };

  const handleSave = async () => {
    if (user == null) {
      return;
    }
    try {
      let response;
      if (isEditMode) {
        // Update existing KM
        response = await karnaughMapService.updateKM(id, karnaughMapStructure);
        console.log("Update Response", response);
        toast.success("Karnaugh Map updated successfully!");
      } else {
        // Create new KM
        response = await karnaughMapService.saveKM(karnaughMapStructure);
        console.log("Save Response", response);
        toast.success("Karnaugh Map saved successfully!");
        // Navigate to edit mode after saving
        navigate(`/karnaugh-maps/edit/${response.data._id}`);
      }
    } catch (error) {
      console.error("Error while saving/updating KM: ", error);
      toast.error("Error saving Karnaugh Map");
    }
  };
  const [fetchedKarnaughMap, setFetchedKarnaughMap] = useState(null);

  useEffect(() => {
    const fetchKarnaughMap = async () => {
      if (isEditMode) {
        try {
          const response = await karnaughMapService.getKM(id);
          const karnaughMap = response.data;

          // Store the fetched data in a temporary state
          setFetchedKarnaughMap(karnaughMap);
        } catch (error) {
          console.error("Error fetching Karnaugh map:", error);
        }
      }
    };

    fetchKarnaughMap();
  }, [id, isEditMode]);

  useEffect(() => {
    if (fetchedKarnaughMap) {
      const mapSize = fetchedKarnaughMap.tableSize;
      setCornerImplicantDisabled(mapSize !== "4x4");
      setTableSize(mapSize);
      setTimeout(() => {
        fillCellsOnEdit(fetchedKarnaughMap.cellValues);
        handleDisable();
        setCustomVariablesAllowed(fetchedKarnaughMap.customVariablesAllowed);
        setVariables(fetchedKarnaughMap.customVariablesValues);
        addImplicantCorner(fetchedKarnaughMap.cornerImplicant || false);
        if (
          fetchedKarnaughMap.implicants &&
          fetchedKarnaughMap.implicants.length > 0
        ) {
          const importedImplicants = fetchedKarnaughMap.implicants;
          addImplicant(importedImplicants);

          addImplicantCellIndexes(fetchedKarnaughMap.implicantCellIndexes);
        }
        if (
          fetchedKarnaughMap.edgeImplicants &&
          fetchedKarnaughMap.edgeImplicants.length > 0
        ) {
          const importedEdgeImplicants = fetchedKarnaughMap.edgeImplicants;
          addEdgeImplicant(importedEdgeImplicants);
          addEdgeImplicantCellIndexes(
            fetchedKarnaughMap.edgeImplicantCellIndexes
          );
        }
        if (fetchedKarnaughMap.cornerImplicant) {
          addCornerImplicant();
        }
      }, 100);
    }
  }, [fetchedKarnaughMap]);

  // Auto-import LaTeX code from Image-to-LaTeX page
  useEffect(() => {
    // Only auto-import on create pages (not edit pages)
    if (isEditMode) {
      return;
    }

    const storageKey = "pendingLatexImport_Karnaugh Map";
    const pendingLatexCode = sessionStorage.getItem(storageKey);

    if (pendingLatexCode) {
      try {
        const parsed = parseKmapLatex(pendingLatexCode);
        handleImportFromLatex(parsed);
        sessionStorage.removeItem(storageKey);
        toast.success("LaTeX code imported successfully from Image-to-LaTeX!");
      } catch (error) {
        console.error("Error auto-importing LaTeX code:", error);
        toast.error(`Error importing LaTeX code: ${error.message}`);
        sessionStorage.removeItem(storageKey);
      }
    }
  }, [isEditMode]);

  useEffect(() => {
    drawImplicants(implicantCellIndexes);
  }, [disabled, implicantCellIndexes, edgeimplicantCellIndexes]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Karnaugh maps</h1>
      <Instructions />
      {/* Settings Section - Initial Map Configuration */}
      {!disabled && (
        <div className="w-full mb-6 bg-white p-5 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            Map Configuration
          </h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">
                Map Size
              </label>
              <Dropdown
                trigger={
                  <button className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 flex items-center justify-between w-40">
                    {tableSize === "0x0"
                      ? "Select size"
                      : tableSize.replace("x", " × ")}
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                }
                menu={[
                  {
                    label: "2 × 1",
                    onClick: () =>
                      handleTableSizeChange({ target: { value: "2x1" } }),
                  },
                  {
                    label: "2 × 2",
                    onClick: () =>
                      handleTableSizeChange({ target: { value: "2x2" } }),
                  },
                  {
                    label: "4 × 2",
                    onClick: () =>
                      handleTableSizeChange({ target: { value: "2x4" } }),
                  },
                  {
                    label: "4 × 4",
                    onClick: () =>
                      handleTableSizeChange({ target: { value: "4x4" } }),
                  },
                ]}
                className="inline-block"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">
                Fill Value
              </label>
              <Dropdown
                trigger={
                  <button className="w-20 h-10 rounded border border-gray-300 font-medium transition-colors bg-white text-gray-800 hover:bg-gray-50 flex items-center justify-center">
                    {option}
                  </button>
                }
                menu={[
                  { label: "0", onClick: () => handleOptionChange("0") },
                  { label: "1", onClick: () => handleOptionChange("1") },
                ]}
                className="inline-block"
              />
            </div>

            <button
              id="autofill"
              onClick={fillCells}
              className="px-4 h-10 bg-gray-100 text-gray-800 font-medium rounded border border-gray-300 hover:bg-gray-200 transition-colors flex items-center"
            >
              <span>Fill Remaining</span>
            </button>

            <div className="ml-auto">
              <button
                id="submitBtn"
                onClick={handleDisable}
                className="px-6 h-10 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors flex items-center"
              >
                <span>Create Map</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Implicant Actions Section - After Map Creation */}
      {disabled && (
        <div className="w-full mb-6 bg-white p-5 rounded-lg shadow">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={handleGoBackButton}
                className="mr-4 px-4 py-2 bg-gray-100 text-gray-800 font-medium rounded border border-gray-300 hover:bg-gray-200 transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>Back to Map</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <h3 className="sr-only">Add Implicants</h3>
              <button
                disabled={classicImplicantDisabled}
                onClick={addingimplicant}
                className={`px-4 py-2 font-medium rounded border transition-colors flex items-center ${
                  markingImplicant
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="mr-1">
                  {markingImplicant ? "Cancel" : "+"}
                </span>
                <span>Implicant</span>
              </button>

              <button
                disabled={edgeImplicantDisabled}
                onClick={addingEdgeimplicant}
                className={`px-4 py-2 font-medium rounded border transition-colors flex items-center ${
                  markingEdgeImplicant
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="mr-1">
                  {markingEdgeImplicant ? "Cancel" : "+"}
                </span>
                <span>Edge Implicant</span>
              </button>

              <button
                disabled={cornerImplicantDisabled}
                onClick={addCornerImplicant}
                className={`px-4 py-2 font-medium rounded border transition-colors flex items-center
            bg-white text-gray-800 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
          `}
              >
                <span className="mr-1">+</span>
                <span>Corner Implicant</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Karnaugh Map Container */}
      <div className="flex flex-col items-center mb-8">
        {customVariablesAllowed && (
          <VariableLabels labels={colVariables} isColumn={true} />
        )}
        {disabled && <BinaryColumnLabels size={tableSize} />}

        <div className="flex items-center">
          {customVariablesAllowed && (
            <VariableLabels labels={rowVariables} isColumn={false} />
          )}
          {/* Binary Row Labels (00, 01, 11, 10) */}
          {disabled && <BinaryRowLabels size={tableSize} />}
          <div className="relative">
            {generateTable()}
            {disabled && (
              <canvas
                id="kmapCanvas"
                width={mapWidth}
                height={mapHeight}
                className="absolute top-0 left-0 pointer-events-none"
              />
            )}
          </div>
        </div>
      </div>
      {/* Variables Section */}
      <div className="w-full mb-8">
        <h3 className="text-xl font-semibold mb-4">Variables</h3>
        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={customVariablesAllowed}
              onChange={() =>
                setCustomVariablesAllowed(!customVariablesAllowed)
              }
              className="mr-2"
            />
            Allow Custom Variable Names
          </label>
        </div>
        {customVariablesAllowed && renderVarInputs()}
      </div>
      {/* Implicant Lists */}
      <ImplicantsList
        implicants={implicants}
        onImplicantClick={handleImplicantClick}
        onRemoveImplicant={handleRemoveImplicant}
      />
      <EdgeImplicantList
        edgeImplicants={edgeImplicants}
        onImplicantClick={handleImplicantClick}
        onRemoveEdgeImplicant={handleRemoveEdgeImplicant}
      />
      {/* LaTeX Settings */}
      <div className="w-full bg-gray-100 p-4 rounded-lg shadow-sm mb-8 flex flex-wrap gap-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={includePreamble}
            onChange={() => setIncludePreamble(!includePreamble)}
            className="mr-2"
          />
          Include whole LaTeX Preamble
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={includeDocumentTags}
            onChange={() => setIncludeDocumentTags(!includeDocumentTags)}
            className="mr-2"
          />
          Include import of the karnaugh map package
        </label>
      </div>
      {/* Import + Generate Buttons (match Proof Trees layout) */}
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <button
          onClick={() => setShowImportModal(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors flex items-center"
          data-umami-event="Import Karnaugh Map from LaTeX button"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          <span>Import LaTeX</span>
        </button>
        <button
          onClick={generateCodeLaTeX}
          disabled={!disabled}
          className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
          data-umami-event="Generate Karnaugh Map LaTeX button"
        >
          Generate code
        </button>
      </div>
      {/* Generated Code */}
      {generatedCode && (
        <div className="w-full mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Generated LaTeX Code</h3>
            <button
              onClick={() => setShowLaTeXEditor(!showLaTeXEditor)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {showLaTeXEditor ? "Show Code Only" : "Edit & Compile"}
            </button>
          </div>
          
          {showLaTeXEditor ? (
            <LaTeXEditor
              initialCode={generatedCode}
              onCodeChange={(newCode) => setGeneratedCode(newCode)}
              height="700px"
            />
          ) : (
            <GeneratedCode disabled={!disabled} code={generatedCode} />
          )}
        </div>
      )}
      {!isEditMode && (
        <div>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!user}
            data-umami-event="Save Karnaugh Map button"
          >
            Save Karnaugh Map
          </button>
        </div>
      )}
      {isEditMode && (
        <div>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!user}
            data-umami-event="Update Karnaugh Map button"
          >
            Update Karnaugh Map
          </button>
        </div>
      )}
      <LatexImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportFromLatex}
      />
    </div>
  );
};

export default Kmap;
