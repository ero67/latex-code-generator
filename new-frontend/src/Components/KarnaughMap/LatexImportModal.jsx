import React, { useState } from "react";
import { validateKmapLatex, parseKmapLatex } from "../../utils/kmapParser";
import { toast } from "react-toastify";
import { kmapTestExamples } from "../../utils/kmapTestExamples";

const LatexImportModal = ({ isOpen, onClose, onImport }) => {
  const [latexCode, setLatexCode] = useState("");
  const [validation, setValidation] = useState({ isValid: true, errors: [], warnings: [] });
  const [isImporting, setIsImporting] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const handleCodeChange = (e) => {
    const code = e.target.value;
    setLatexCode(code);
    setValidation(code.trim() ? validateKmapLatex(code) : { isValid: true, errors: [], warnings: [] });
  };

  const handleImport = async () => {
    if (!latexCode.trim()) {
      toast.error("Please enter LaTeX code to import");
      return;
    }
    if (!validation.isValid) {
      toast.error("Please fix the errors before importing");
      return;
    }
    setIsImporting(true);
    try {
      const parsed = parseKmapLatex(latexCode);
      onImport(parsed);
      onClose();
      setLatexCode("");
      setValidation({ isValid: true, errors: [], warnings: [] });
      toast.success("Karnaugh map imported from LaTeX!");
    } catch (err) {
      toast.error(err.message || "Failed to import LaTeX");
    } finally {
      setIsImporting(false);
    }
  };

  const loadExample = (ex) => {
    setLatexCode(ex.latex);
    setValidation(validateKmapLatex(ex.latex));
  };

  const handleClose = () => {
    setLatexCode("");
    setValidation({ isValid: true, errors: [], warnings: [] });
    setShowExamples(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Import Karnaugh Map from LaTeX</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LaTeX Code</label>
              <textarea
                value={latexCode}
                onChange={handleCodeChange}
                placeholder="Paste your karnaugh-map LaTeX here..."
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            {latexCode.trim() && (
              <div className="space-y-2">
                {validation.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validation.errors.map((e, i) => (
                        <li key={i} className="flex items-start"><span className="text-red-500 mr-2">•</span>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {validation.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {validation.warnings.map((w, i) => (
                        <li key={i} className="flex items-start"><span className="text-yellow-500 mr-2">•</span>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {validation.isValid && validation.errors.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-700">✓ LaTeX code appears to be valid</p>
                  </div>
                )}
              </div>
            )}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-800">Example LaTeX:</h4>
                <button onClick={() => setShowExamples(!showExamples)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  {showExamples ? "Hide Examples" : "Show Examples"}
                </button>
              </div>
              {showExamples ? (
                <div className="space-y-3">
                  {kmapTestExamples.map((ex, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-md p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="text-sm font-medium text-gray-800">{ex.name}</h5>
                          <p className="text-xs text-gray-600">{ex.description}</p>
                        </div>
                        <button onClick={() => loadExample(ex)} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 border border-blue-200 rounded hover:bg-blue-50">Load</button>
                      </div>
                      <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap bg-gray-50 p-2 rounded">{ex.latex}</pre>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">{`\\begin{karnaugh-map}[4][4][1][B][A]
       \\manualterms{0,1,0,1, 1,0,1,0, 0,1,0,1, 1,0,1,0}
       \\implicant{0}{5}
\\end{karnaugh-map}`}</pre>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button onClick={handleClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleImport} disabled={!latexCode.trim() || !validation.isValid || isImporting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center">
            {isImporting ? (<><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>Importing...</>) : (<>Import K-Map</>)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LatexImportModal;


