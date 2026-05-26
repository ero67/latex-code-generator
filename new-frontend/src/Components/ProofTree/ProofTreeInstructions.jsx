import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const ProofTreeInstructions = () => {
  const { t } = useTranslation();
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
        <span>{isOpen ? t('common.hide_instructions') : t('common.show_instructions')}</span>
        <span className="text-blue-600">
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </button>
      {isOpen && (
        <div className="p-5 border-t border-gray-200 animate-fadeIn">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              {t('instructions.proof_tree_title')}
            </h3>
            <ol className="space-y-2 pl-2">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-2">
                  1
                </span>
                <span>
                  {t('instructions.proof_tree_1')}
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-2">
                  2
                </span>
                <span>{t('instructions.proof_tree_2')}</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-2">
                  3
                </span>
                <span>
                  {t('instructions.proof_tree_3')}
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-2">
                  4
                </span>
                <span>
                  {t('instructions.proof_tree_4')}
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-2">
                  5
                </span>
                <span>
                  {t('instructions.proof_tree_5')}
                </span>
              </li>
            </ol>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              {t('instructions.math_mode_options')}
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span>
                  <strong>{t('instructions.global_math_mode')}</strong> {t('instructions.global_math_mode_desc')}
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span>
                  <strong>{t('instructions.individual_math_mode')}</strong> {t('instructions.individual_math_mode_desc')}
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span>
                  <strong>{t('instructions.latex_commands')}</strong> {t('instructions.latex_commands_desc')}
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
