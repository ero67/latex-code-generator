import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const Instructions = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleInstructions = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full mb-6 bg-white rounded-lg shadow overflow-hidden">
      <button
        onClick={toggleInstructions}
        className="w-full p-4 text-left font-semibold text-lg flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-inset"
      >
        <span>{isOpen ? "Hide Instructions" : "Show Instructions"}</span>
        <span className="text-blue-600">
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-gray-200 animate-fadeIn">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              How to use?
            </h3>
            <ol className="space-y-2 pl-2">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-2">
                  1
                </span>
                <span>Choose dimensions of the map</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-2">
                  2
                </span>
                <span>Fill the map with values</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-2">
                  3
                </span>
                <span>After pressing submit, mark the needed implicants</span>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              How to mark implicants?
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span>
                  If marking a <strong>rectangular implicant</strong>, click
                  opposite corners of the rectangle in any order
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span>
                  If marking an implicant in a{" "}
                  <strong>single row or column</strong>, click the beginning and
                  the end of the implicant
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span>
                  If marking an <strong>edge implicant</strong>, click opposite
                  corners of the rectangle of the desired implicant
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instructions;
