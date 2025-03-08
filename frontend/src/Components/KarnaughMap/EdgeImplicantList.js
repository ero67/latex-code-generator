import React from "react";

const EdgeImplicantList = ({
  edgeImplicants,
  onImplicantClick,
  onRemoveEdgeImplicant,
  isEightEdgeImplicant = false,
  changeDirectionofEdgeImplicant = () => {},
}) => {
  return (
    <div className="mt-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        Edge Implicants:
      </h3>
      <ul className="space-y-2 w-full">
        {edgeImplicants.length === 0 ? (
          <li className="text-gray-500 italic">No edge implicants added yet</li>
        ) : (
          edgeImplicants.map((implicant, index) => (
            <li
              key={index}
              className="flex flex-wrap justify-between items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors gap-2 w-full"
              onMouseEnter={() => onImplicantClick(index, "edge")}
              onMouseLeave={() => onImplicantClick(null, "edge")}
            >
              <span className="font-medium">
                Edge Implicant {index + 1}:{" "}
                <span className="font-normal">{implicant.join(", ")}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onRemoveEdgeImplicant(index)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded text-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default EdgeImplicantList;
