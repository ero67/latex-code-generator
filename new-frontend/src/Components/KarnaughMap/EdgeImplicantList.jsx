import React from "react";
import { useTranslation } from "react-i18next";

const EdgeImplicantList = ({
  edgeImplicants,
  edgeImplicantSubmaps = [],
  onImplicantClick,
  onRemoveEdgeImplicant,
}) => {
  const { t } = useTranslation();

  return (
    /* Changed p-5 to p-4 to match the first component */
    <div className="w-full mb-4 bg-white p-4 rounded-lg shadow">
      {/* Changed text-xl to text-lg and mb-4 to mb-3 */}
      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        {t("karnaugh.edge_implicants")}
      </h3>
      {edgeImplicants.length === 0 ? (
        /* Changed py-4 to py-2 */
        <div className="text-gray-500 italic py-2 text-center border border-dashed border-gray-300 rounded-md bg-gray-50">
          {t("karnaugh.no_edge_implicants_added")}
        </div>
      ) : (
        /* Changed space-y-3 to space-y-2 */
        <ul className="space-y-2 w-full">
          {edgeImplicants.map((implicant, index) => (
            <li
              key={index}
              /* Changed p-4 to p-2 and rounded-lg to rounded-md */
              className="flex justify-between items-center p-2 border border-gray-200 rounded-md hover:bg-green-50 transition-colors w-full group"
              onMouseEnter={() => onImplicantClick(index, "edge")}
              onMouseLeave={() => onImplicantClick(null, "edge")}
            >
              {/* Changed space-x-3 to space-x-2 */}
              <div className="flex items-center space-x-2">
                {/* Changed w-8 h-8 to w-6 h-6 and added text-sm */}
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                  {index + 1}
                </div>
                {/* Added text-sm to match the first component's font scale */}
                <span className="text-sm font-medium">
                  {t("karnaugh.edge_implicant")}:{" "}
                  <span className="font-normal text-gray-700">
                    {implicant.join(", ")}
                  </span>
                  {edgeImplicantSubmaps[index] && (
                    <span className="font-normal text-gray-500 ml-2">
                      {`(${t("karnaugh.maps_label")}: ${edgeImplicantSubmaps[index].join(",")})`}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onRemoveEdgeImplicant(index)}
                  /* Changed px-4 py-2 to px-3 py-1 and text-sm to text-xs */
                  className="ml-2 px-3 py-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-medium rounded text-xs transition-all duration-200 group-hover:shadow-sm"
                  aria-label={t("karnaugh.remove_edge_implicant")}
                >
                  {t("common.delete")}
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
