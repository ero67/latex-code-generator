const ImplicantsList = ({
  implicants,
  implicantSubmaps = [],
  onImplicantClick,
  onRemoveImplicant,
}) => {
  return (
    <div className="w-full mb-4 bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Implicants</h3>
      {implicants.length === 0 ? (
        <div className="text-gray-500 italic py-2 text-center border border-dashed border-gray-300 rounded-md bg-gray-50">
          No implicants added yet
        </div>
      ) : (
        <ul className="space-y-2 w-full">
          {implicants.map((implicant, index) => (
            <li
              key={index}
              className="flex justify-between items-center p-2 border border-gray-200 rounded-md hover:bg-blue-50 transition-colors w-full group"
              onMouseEnter={() => onImplicantClick(index, "default")}
              onMouseLeave={() => onImplicantClick(null, "default")}
            >
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  {index + 1}
                </div>
                <span className="text-sm font-medium">
                  Implicant:{" "}
                  <span className="font-normal text-gray-700">
                    {implicant.join(", ")}
                  </span>
                  {implicantSubmaps[index] && (
                    <span className="font-normal text-gray-500 ml-2">
                      {`(maps: ${implicantSubmaps[index].join(",")})`}
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={() => onRemoveImplicant(index)}
                className="ml-2 px-3 py-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-medium rounded text-xs transition-all duration-200 group-hover:shadow-sm"
                aria-label="Remove implicant"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ImplicantsList;
