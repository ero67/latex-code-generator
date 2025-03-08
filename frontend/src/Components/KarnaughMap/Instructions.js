import React, { useState } from "react";
import "./ImplicantsList.css";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const Instructions = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleInstructions = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="containerText p-4 bg-gray-100 rounded-lg shadow-md">
      <button
        onClick={toggleInstructions}
        className="w-full text-left font-semibold text-md mb-2 focus:outline-none flex items-center justify-between"
      >
        <span>{isOpen ? "Hide Instructions" : "Show Instructions"}</span>
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      {isOpen && (
        <div className="instructions-content">
          <p id="question" className="font-bold mb-2">
            How to use?
          </p>
          <p>
            <b>1.</b> Choose dimensions of the map
          </p>
          <p>
            <b>2.</b> Fill the map with values
          </p>
          <p>
            <b>3.</b> After pressing submit, mark the needed implicants
          </p>

          <p id="question2" className="font-bold mt-4 mb-2">
            How to mark implicants?
          </p>
          <p>
            - If marking a rectangular implicant, click opposite corners of the
            rectangle in any order
          </p>
          <p>
            - If marking an implicant in a single row or column, click the
            beginning and the end of the implicant
          </p>
          <p>
            - If marking an edge implicant, click opposite corners of the
            rectangle of the desired implicant.
          </p>
        </div>
      )}
    </div>
  );
};

export default Instructions;
