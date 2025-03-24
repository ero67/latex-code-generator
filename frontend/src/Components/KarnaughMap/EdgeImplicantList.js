import React from "react";

const EdgeImplicantList = ({
  edgeImplicants,
  onImplicantClick,
  onRemoveEdgeImplicant,
  isEightEdgeImplicant = false,
  changeDirectionofEdgeImplicant = () => {},
}) => {
  return (
    <div className="w-full my-8 bg-white p-5 rounded-lg shadow">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        Edge Implicants
      </h3>
      {edgeImplicants.length === 0 ? (
        <div className="text-gray-500 italic py-4 text-center border border-dashed border-gray-300 rounded-md bg-gray-50">
          No edge implicants added yet
        </div>
      ) : (
        <ul className="space-y-3 w-full">
          {edgeImplicants.map((implicant, index) => (
            <li
              key={index}
              className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 transition-colors w-full group"
              onMouseEnter={() => onImplicantClick(index, "edge")}
              onMouseLeave={() => onImplicantClick(null, "edge")}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                  {index + 1}
                </div>
                <span className="font-medium">
                  Edge Implicant:{" "}
                  <span className="font-normal text-gray-700">
                    {implicant.join(", ")}
                  </span>
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onRemoveEdgeImplicant(index)}
                  className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-medium rounded-md text-sm transition-all duration-200 group-hover:shadow-sm"
                  aria-label="Remove edge implicant"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EdgeImplicantList;
