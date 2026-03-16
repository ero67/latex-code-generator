import React, { useState } from 'react';
import { validateResolutionTreeTikz, parseResolutionTreeTikz } from '../../utils/resolutionTreeTikzParser';
import { toast } from 'react-toastify';

const EXAMPLE = {
  name: 'Simple resolution',
  description: 'Two premises resolved to empty clause',
  latex: `\\begin{tikzpicture}[grow'=up]
\\Tree [.{$\\Box$}
  [.{$\\{\\neg P(z)\\}$}
    [.{$\\{\\neg P(b), \\neg P(z)\\}$}
      [.{$\\{\\neg Q(b,a), \\neg P(b), \\neg P(z)\\}$}
        [.{$\\{\\neg Q(x,y), \\neg P(x), R(y,x)\\}$} ]
        [.{$\\{\\neg R(a,b), \\neg P(z)\\}$} ]
      ]
      [.{$\\{Q(b,a)\\}$} ]
    ]
    [.{$\\{P(b)\\}$} ]
  ]
  [.{$\\{P(a)\\}$} ]
]
\\end{tikzpicture}`,
};

const LatexImportModal = ({ isOpen, onClose, onImport }) => {
  const [latexCode, setLatexCode] = useState('');
  const [validation, setValidation] = useState({ isValid: true, errors: [], warnings: [] });
  const [isImporting, setIsImporting] = useState(false);

  const handleCodeChange = (e) => {
    const code = e.target.value;
    setLatexCode(code);

    if (code.trim()) {
      const result = validateResolutionTreeTikz(code);
      setValidation(result);
    } else {
      setValidation({ isValid: true, errors: [], warnings: [] });
    }
  };

  const handleImport = async () => {
    if (!latexCode.trim()) {
      toast.error('Please enter LaTeX code to import');
      return;
    }
    if (!validation.isValid) {
      toast.error('Please fix the errors before importing');
      return;
    }

    setIsImporting(true);
    try {
      const result = parseResolutionTreeTikz(latexCode);
      onImport(result);
      toast.success('Resolution tree imported successfully!');
      handleClose();
    } catch (error) {
      toast.error(`Import error: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setLatexCode('');
    setValidation({ isValid: true, errors: [], warnings: [] });
    onClose();
  };

  const loadExample = () => {
    setLatexCode(EXAMPLE.latex);
    const result = validateResolutionTreeTikz(EXAMPLE.latex);
    setValidation(result);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Import LaTeX Resolution Tree</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LaTeX Code
              </label>
              <textarea
                value={latexCode}
                onChange={handleCodeChange}
                placeholder="Paste your tikz-qtree resolution tree LaTeX code here..."
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>

            {/* Validation */}
            {latexCode.trim() && (
              <div className="space-y-2">
                {validation.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validation.errors.map((error, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-500 mr-2">&bull;</span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {validation.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {validation.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-yellow-500 mr-2">&bull;</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {validation.isValid && validation.errors.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-700">
                      LaTeX code appears to be valid
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Example */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-800">Example:</h4>
                <button
                  onClick={loadExample}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                >
                  Load Example
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-2">{EXAMPLE.name} &mdash; {EXAMPLE.description}</p>
              <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap bg-white p-2 rounded border border-gray-100">
                {EXAMPLE.latex}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!latexCode.trim() || !validation.isValid || isImporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Importing...
              </>
            ) : (
              'Import Resolution Tree'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LatexImportModal;
