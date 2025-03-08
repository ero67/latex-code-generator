import React from "react";

const ImplicantsList = ({
  implicants,
  onImplicantClick,
  onRemoveImplicant,
}) => {
  return (
    <div className="mt-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Implicants:</h3>
      <ul className="space-y-2 w-full">
        {implicants.length === 0 ? (
          <li className="text-gray-500 italic">No implicants added yet</li>
        ) : (
          implicants.map((implicant, index) => (
            <li
              key={index}
              className="flex justify-between items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full"
              onMouseEnter={() => onImplicantClick(index, "default")}
              onMouseLeave={() => onImplicantClick(null, "default")}
            >
              <span className="font-medium">
                Implicant {index + 1}:{" "}
                <span className="font-normal">{implicant.join(", ")}</span>
              </span>
              <button
                onClick={() => onRemoveImplicant(index)}
                className="ml-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded text-sm transition-colors"
              >
                Remove
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ImplicantsList;
