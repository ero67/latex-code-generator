import React, { useState } from "react";
import ImageService from "../../services/image.service";

const ImageToLatex = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [structureType, setStructureType] = useState("Karnaugh Map");
  const [latexCode, setLatexCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleStructureChange = (event) => {
    setStructureType(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    setLoading(true);
    setError("");
    setLatexCode("");

    try {
      const response = await ImageService.uploadImage(
        selectedFile,
        structureType
      );
      setLatexCode(response.data.latex);
    } catch (err) {
      setError("Failed to generate LaTeX. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(latexCode);
    alert("Copied to clipboard!");
  };

  return (
    <div className="flex flex-col items-center p-8 bg-gray-100 rounded-lg shadow-md max-w-lg mx-auto my-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Image to LaTeX Converter
      </h2>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="mb-4">
          <label
            htmlFor="file-upload"
            className="block mb-2 text-gray-700 font-bold"
          >
            Upload an image:
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="structure-type"
            className="block mb-2 text-gray-700 font-bold"
          >
            Select structure type:
          </label>
          <select
            id="structure-type"
            value={structureType}
            onChange={handleStructureChange}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="Karnaugh Map">Karnaugh Map</option>
            <option value="Abstract Syntax Tree">Abstract Syntax Tree</option>
            <option value="Proof Tree">Proof Tree</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate LaTeX"}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {latexCode && (
        <div className="w-full mt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Generated LaTeX Code
          </h3>
          <div className="relative">
            <textarea
              readOnly
              value={latexCode}
              className="w-full p-2 border border-gray-300 rounded bg-gray-200 h-40"
            />
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageToLatex;
