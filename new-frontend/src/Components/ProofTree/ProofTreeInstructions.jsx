import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const ProofTreeInstructions = () => {
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
              How to use Proof Trees?
            </h3>
            <ol className="space-y-2 pl-2">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-2">
                  1
                </span>
                <span>
                  Choose if you want to use mathematical font or not by clicking
                  on the checkbox
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-2">
                  2
                </span>
                <span>Put the content of the node in the input field</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-2">
                  3
                </span>
                <span>
                  To add a child node click on the "+" button, to remove node
                  click the "-" button
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-2">
                  4
                </span>
                <span>
                  If you want to put a Right Label between parent and child node
                  fill the bottom input field
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-2">
                  5
                </span>
                <span>
                  You can also select which nodes should have math mode by
                  clicking the checkbox in the node
                </span>
              </li>
            </ol>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Math Mode Options
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span>
                  <strong>Global Math Mode:</strong> Enable mathematical font
                  for all nodes at once using the main checkbox
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span>
                  <strong>Individual Math Mode:</strong> Enable mathematical
                  font for specific nodes using the checkbox next to each node
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span>
                  <strong>LaTeX Commands:</strong> Use backslash (\) to access
                  LaTeX symbols and commands in your content
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProofTreeInstructions;
