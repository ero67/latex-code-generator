import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageService from "../../services/image.service";
import GeneratedCode from "../../Components/GeneratedCode";
import { toast } from "react-toastify";
import { FaUpload, FaImage, FaSpinner, FaCheckCircle, FaTimesCircle, FaEdit } from "react-icons/fa";

const ImageToLatex = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [structureType, setStructureType] = useState("Karnaugh Map");
  const [latexCode, setLatexCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file.");
        setSelectedFile(null);
        setPreviewUrl(null);
        toast.error("Please select a valid image file.");
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError("File size must be less than 10MB.");
        setSelectedFile(null);
        setPreviewUrl(null);
        toast.error("File size must be less than 10MB.");
        return;
      }
      
      setError(""); // Clear any previous errors
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setLatexCode("");
    setError("");
    // Reset file input
    const fileInput = document.getElementById("file-upload");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleStructureChange = (event) => {
    setStructureType(event.target.value);
  };

  const handleEditInApp = () => {
    if (!latexCode) {
      toast.error("No LaTeX code to import!");
      return;
    }

    // Map structure types to routes
    const routeMap = {
      "Karnaugh Map": "/karnaugh-maps/create",
      "Abstract Syntax Tree": "/ast/create",
      "Proof Tree": "/proof-trees/create",
      "Finite State Automata": "/finite-state-automata/create",
      "Resolution Tree": "/resolution-trees/create",
    };

    const targetRoute = routeMap[structureType];
    if (!targetRoute) {
      toast.error(`Unknown structure type: ${structureType}`);
      return;
    }

    // Store LaTeX code in sessionStorage with structure type key
    const storageKey = `pendingLatexImport_${structureType}`;
    sessionStorage.setItem(storageKey, latexCode);

    // Navigate to the appropriate page
    navigate(targetRoute);
    toast.success(`Redirecting to ${structureType} editor...`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error("Please select an image file first!");
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
      
      if (response.data.status === "success") {
        setLatexCode(response.data.latex);
        toast.success("LaTeX code generated successfully!");
        if (response.data.message) {
          console.log("Server message:", response.data.message);
        }
      } else {
        const errorMsg = response.data.message || "Failed to generate LaTeX. Please try again.";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error("Upload error:", err);
      let errorMsg = "Failed to generate LaTeX. Please try again.";
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMsg = "Invalid file or missing structure type. Please check your input.";
      } else if (err.response?.status === 500) {
        errorMsg = "Server error. Please try again later.";
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMsg = "Network error. Please check your connection and try again.";
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 md:p-8 bg-white rounded-xl shadow-lg max-w-4xl mx-auto my-8 border border-gray-200">
      {/* Header */}
      <div className="w-full mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <FaImage className="text-blue-600" />
          Image to LaTeX Converter
        </h2>
        <p className="text-gray-600 text-sm">
          Upload an image and convert it to LaTeX code automatically
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <label
            htmlFor="file-upload"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Upload Image
          </label>
          
          {!previewUrl ? (
            <div className="relative">
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-colors duration-200"
              >
                <FaUpload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="mb-2 text-sm text-gray-600 font-medium">
                  <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </label>
            </div>
          ) : (
            <div className="relative border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200"
                aria-label="Remove image"
              >
                <FaTimesCircle className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4 mb-3">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 max-w-full rounded-lg border border-gray-300 shadow-sm object-contain"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Structure Type Selection */}
        <div className="space-y-2">
          <label
            htmlFor="structure-type"
            className="block text-sm font-semibold text-gray-700"
          >
            Structure Type
          </label>
          <select
            id="structure-type"
            value={structureType}
            onChange={handleStructureChange}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200"
          >
            <option value="Karnaugh Map">Karnaugh Map</option>
            <option value="Abstract Syntax Tree">Abstract Syntax Tree</option>
            <option value="Proof Tree">Proof Tree</option>
            <option value="Finite State Automata">Finite State Automata</option>
            <option value="Resolution Tree">Resolution Tree</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={loading || !selectedFile}
          data-umami-event="Generate LaTeX from Image button"
          data-umami-event-structure-type={structureType}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Generating LaTeX...</span>
            </>
          ) : (
            <>
              <FaCheckCircle />
              <span>Generate LaTeX</span>
            </>
          )}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="w-full mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <FaTimesCircle className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Generated LaTeX Code */}
      {latexCode && (
        <div className="w-full mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              Generated LaTeX Code
            </h3>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <GeneratedCode code={latexCode} />
          </div>
          {/* Edit in App Button */}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleEditInApp}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              data-umami-event="Edit in App from Image to LaTeX button"
              data-umami-event-structure-type={structureType}
            >
              <FaEdit />
              <span>Edit in App</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageToLatex;
