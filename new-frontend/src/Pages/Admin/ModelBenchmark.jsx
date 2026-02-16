import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import ModelService from "../../services/model.service";
import GeneratedCode from "../../Components/GeneratedCode";
import {
  FaUpload,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaPlay,
  FaDownload,
  FaClock,
  FaDollarSign,
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;

const STRUCTURE_TYPES = [
  "Karnaugh Map",
  "Abstract Syntax Tree",
  "Proof Tree",
  "Finite State Automata",
  "Resolution Tree",
];

const ModelBenchmark = () => {
  const [models, setModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [structureType, setStructureType] = useState("Karnaugh Map");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [error, setError] = useState("");
  const [currentModel, setCurrentModel] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const abortRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await ModelService.getAllModels(token);
        const data = response.data?.data || [];
        const modelIds = data.map((item) => item.modelId).filter(Boolean);
        setModels(modelIds);
      } catch (err) {
        console.error("Failed to load models:", err);
        toast.error("Failed to load models");
      }
    };
    loadModels();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        toast.error("Please select a valid image file.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB.");
        toast.error("File size must be less than 10MB.");
        return;
      }
      setError("");
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults([]);
    setError("");
    const fileInput = document.getElementById("benchmark-file-upload");
    if (fileInput) fileInput.value = "";
  };

  const toggleModel = (modelId) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((m) => m !== modelId)
        : [...prev, modelId]
    );
  };

  const selectAll = () => setSelectedModels([...models]);
  const deselectAll = () => setSelectedModels([]);

  const handleRunBenchmark = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first!");
      return;
    }
    if (selectedModels.length === 0) {
      toast.error("Please select at least one model!");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setExpandedRow(null);
    setCurrentModel("");
    setProgress({ current: 0, total: selectedModels.length });

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("structureType", structureType);
    formData.append("models", JSON.stringify(selectedModels));

    try {
      const response = await fetch(
        `${API_URL}/imagetolatex/benchmark`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Benchmark failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Failed to read response stream");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.status === "progress") {
                setCurrentModel(data.currentModel || "");
                setProgress({ current: data.modelIndex, total: data.totalModels });
              } else if (data.status === "result") {
                setResults((prev) => [...prev, data.result]);
              } else if (data.status === "complete") {
                setResults(data.results);
                setCurrentModel("");
                toast.success(data.message);
              } else if (data.status === "error") {
                setError(data.message || "Benchmark failed.");
                toast.error(data.message || "Benchmark failed.");
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Benchmark error:", err);
      const msg = err.message || "Benchmark failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setCurrentModel("");
    }
  };

  const handleDownloadJSON = () => {
    if (results.length === 0) return;
    const blob = new Blob([JSON.stringify(results, null, 4)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `benchmark_${structureType.replace(/ /g, "_")}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
  const successCount = results.filter((r) => r.status === "success").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  return (
    <div className="max-w-6xl mx-auto bg-white border border-gray-200 rounded-xl shadow-lg p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FaPlay className="text-purple-600" />
          Model Benchmark
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Upload one image and run it against multiple models to compare
          outputs, latency, and cost.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column: Image Upload + Structure Type */}
        <div className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Image
            </label>
            {!previewUrl ? (
              <div className="relative">
                <input
                  id="benchmark-file-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <label
                  htmlFor="benchmark-file-upload"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-purple-400 transition-colors"
                >
                  <FaUpload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-purple-600">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                </label>
              </div>
            ) : (
              <div className="relative border-2 border-gray-200 rounded-lg p-3 bg-gray-50">
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                >
                  <FaTimesCircle className="w-3.5 h-3.5" />
                </button>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-36 rounded-lg border border-gray-300 shadow-sm object-contain mx-auto"
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}{" "}
                  KB)
                </p>
              </div>
            )}
          </div>

          {/* Structure Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Structure Type
            </label>
            <select
              value={structureType}
              onChange={(e) => setStructureType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {STRUCTURE_TYPES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column: Model Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Select Models ({selectedModels.length}/{models.length})
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={deselectAll}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto divide-y divide-gray-100">
            {models.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No models configured. Add models in the Model Manager.
              </div>
            ) : (
              models.map((modelId) => (
                <label
                  key={modelId}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                    selectedModels.includes(modelId)
                      ? "bg-purple-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(modelId)}
                    onChange={() => toggleModel(modelId)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="font-mono text-sm text-gray-800">
                    {modelId}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Run Benchmark Button */}
      <button
        onClick={handleRunBenchmark}
        disabled={loading || !selectedFile || selectedModels.length === 0}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <FaSpinner className="animate-spin" />
            <span>Running Benchmark... (this may take a while)</span>
          </>
        ) : (
          <>
            <FaPlay />
            <span>
              Run Benchmark ({selectedModels.length} model
              {selectedModels.length !== 1 ? "s" : ""})
            </span>
          </>
        )}
      </button>

      {/* Loading indicator */}
      {loading && (
        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 text-sm text-purple-900">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse [animation-delay:300ms]" />
              </div>
              <span>
                Testing model {progress.current}/{progress.total}...
              </span>
            </div>
            <span className="text-xs text-purple-700">
              ~{progress.total * 15}s estimated
            </span>
          </div>
          
          {/* Current model being tested */}
          {currentModel && (
            <div className="bg-purple-100 rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-600 mb-1">Currently testing:</p>
              <p className="font-mono text-sm text-purple-900 font-medium truncate">
                {currentModel}
              </p>
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-3 h-2 bg-purple-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <FaTimesCircle className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-8 space-y-4">
          {/* Summary Bar */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">
              Benchmark Results
            </h3>
            <button
              onClick={handleDownloadJSON}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <FaDownload />
              Download JSON
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-800">
                {results.length}
              </p>
              <p className="text-xs text-gray-500">Total Models</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-700">
                {successCount}
              </p>
              <p className="text-xs text-green-600">Succeeded</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-700">{failedCount}</p>
              <p className="text-xs text-red-600">Failed</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-700">
                {totalCost > 0 ? `$${totalCost.toFixed(6)}` : "N/A"}
              </p>
              <p className="text-xs text-purple-600">Total Cost</p>
            </div>
          </div>

          {/* Results Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Model</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      <FaClock className="text-gray-400" /> Latency
                    </span>
                  </th>
                  <th className="text-right px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      <FaDollarSign className="text-gray-400" /> Cost
                    </span>
                  </th>
                  <th className="text-right px-4 py-3">Tokens</th>
                  <th className="text-center px-4 py-3">Output</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((result, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-800">
                        {result.model}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            result.status === "success"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {result.status === "success" ? (
                            <FaCheckCircle className="w-3 h-3" />
                          ) : (
                            <FaTimesCircle className="w-3 h-3" />
                          )}
                          {result.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {result.latency}s
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {result.cost != null ? (
                          <span className="text-green-700">
                            ${result.cost.toFixed(6)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">
                        {result.usage ? (
                          <span title="Prompt + Completion = Total">
                            {result.usage.total_tokens ?? "—"}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {result.status === "success" ? (
                          <button
                            onClick={() =>
                              setExpandedRow(expandedRow === idx ? null : idx)
                            }
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium underline"
                          >
                            {expandedRow === idx ? "Hide" : "View"}
                          </button>
                        ) : (
                          <span
                            className="text-xs text-red-500 cursor-help"
                            title={result.error}
                          >
                            Error
                          </span>
                        )}
                      </td>
                    </tr>
                    {expandedRow === idx && result.output && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-3 bg-gray-50 border-t border-gray-100"
                        >
                          <div className="max-h-64 overflow-auto border border-gray-200 rounded-lg">
                            <GeneratedCode code={result.output} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelBenchmark;
