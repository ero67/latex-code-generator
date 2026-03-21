import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import PDFViewer from "./PDFViewer";
import { compileLaTeX, compileLaTeXToSVG } from "../../services/latex.service";
import { toast } from "react-toastify";
import { FaPlay, FaDownload, FaEye, FaEyeSlash, FaFileCode, FaImage } from "react-icons/fa";

/**
 * LaTeX Editor Component
 * Reusable component for editing and compiling LaTeX code
 * 
 * @param {string} initialCode - Initial LaTeX code
 * @param {function} onCodeChange - Callback when code changes
 * @param {object} props - Additional props
 */
const LaTeXEditor = ({ 
  initialCode = "", 
  onCodeChange,
  height = "600px",
  showToolbar = true,
  ...props 
}) => {
  const [code, setCode] = useState(initialCode || "");
  const [pdfBase64, setPdfBase64] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isCompilingSVG, setIsCompilingSVG] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    setCode(initialCode || "");
    setPdfBase64(null);
    setErrors([]);
  }, [initialCode]);

  const handleEditorChange = (value) => {
    const newCode = value || "";
    setCode(newCode);
    onCodeChange?.(newCode);
    // Clear previous compilation when code changes
    if (pdfBase64) {
      setPdfBase64(null);
      setErrors([]);
    }
  };

  const handleCompile = async () => {
    if (!code.trim()) {
      toast.error("LaTeX code is empty");
      return;
    }

    setIsCompiling(true);
    setErrors([]);
    setPdfBase64(null);

    try {
      const result = await compileLaTeX(code);

      if (result.success) {
        console.log("Compilation successful, PDF length:", result.pdf?.length);
        setPdfBase64(result.pdf);
        if (result.warnings?.length > 0) {
          toast.warning(`Compiled with ${result.warnings.length} warning(s)`);
        } else {
          toast.success("LaTeX compiled successfully!");
        }
      } else {
        setErrors(result.errors || ["Compilation failed"]);
        toast.error("LaTeX compilation failed");
      }
    } catch (error) {
      setErrors([`Failed to compile LaTeX: ${error.message}`]);
      toast.error("Compilation error");
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfBase64) return;

    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${pdfBase64}`;
    link.download = "document.pdf";
    link.click();
  };

  const handleDownloadTeX = () => {
    if (!code.trim()) return;

    const blob = new Blob([code], { type: "application/x-tex" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "document.tex";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleDownloadSVG = async () => {
    if (!code.trim()) return;

    setIsCompilingSVG(true);
    try {
      const result = await compileLaTeXToSVG(code);

      if (result.success && result.svg) {
        const svgBytes = atob(result.svg);
        const byteArray = new Uint8Array(svgBytes.length);
        for (let i = 0; i < svgBytes.length; i++) {
          byteArray[i] = svgBytes.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: "image/svg+xml" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "document.svg";
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success("SVG downloaded successfully!");
      } else {
        toast.error(result.errors?.[0] || "SVG compilation failed");
      }
    } catch (error) {
      toast.error(`Failed to generate SVG: ${error.message}`);
    } finally {
      setIsCompilingSVG(false);
    }
  };

  return (
    <div className="flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white" style={{ height }} {...props}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between p-2 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCompile}
              disabled={isCompiling || !code.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <FaPlay className="text-sm" />
              <span>{isCompiling ? "Compiling..." : "Compile"}</span>
            </button>
            {pdfBase64 && (
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 transition-colors"
              >
                <FaDownload className="text-sm" />
                <span>Download PDF</span>
              </button>
            )}
            {code.trim() && (
              <button
                onClick={handleDownloadTeX}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2 transition-colors"
              >
                <FaFileCode className="text-sm" />
                <span>Download .tex</span>
              </button>
            )}
            {code.trim() && (
              <button
                onClick={handleDownloadSVG}
                disabled={isCompilingSVG}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <FaImage className="text-sm" />
                <span>{isCompilingSVG ? "Generating SVG..." : "Download SVG"}</span>
              </button>
            )}
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-100 flex items-center gap-2 transition-colors"
          >
            {showPreview ? <FaEyeSlash /> : <FaEye />}
            <span>{showPreview ? "Hide Preview" : "Show Preview"}</span>
          </button>
        </div>
      )}

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <h4 className="font-semibold text-red-800 mb-2">Compilation Errors:</h4>
          <ul className="list-disc list-inside text-sm text-red-700">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Editor and Preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className={`${showPreview ? "w-1/2" : "w-full"} border-r`}>
          <Editor
            height="100%"
            defaultLanguage="latex"
            value={code}
            onChange={handleEditorChange}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              lineNumbers: "on",
              automaticLayout: true,
            }}
          />
        </div>

        {/* PDF Preview */}
        {showPreview && (
          <div className="w-1/2 overflow-auto bg-gray-100">
            {isCompiling ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Compiling LaTeX...</p>
                </div>
              </div>
            ) : pdfBase64 ? (
              <PDFViewer pdfBase64={pdfBase64} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <FaEye className="text-4xl mx-auto mb-2 opacity-50" />
                  <p>Click "Compile" to generate PDF preview</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LaTeXEditor;
