import { useState, useEffect } from "react";

/**
 * PDF Viewer Component
 * Displays PDF from base64 string using browser's native PDF viewer (iframe)
 * 
 * @param {string} pdfBase64 - Base64 encoded PDF string
 */
const PDFViewer = ({ pdfBase64 }) => {
  const [pdfUrl, setPdfUrl] = useState(null);

  // Convert base64 to blob URL when PDF data changes
  useEffect(() => {
    let currentUrl = null;
    
    if (pdfBase64) {
      console.log("PDF data received, length:", pdfBase64?.length);
      
      try {
        // Remove data URL prefix if present
        const base64Data = pdfBase64.includes(",") 
          ? pdfBase64.split(",")[1] 
          : pdfBase64;
        
        // Convert base64 to binary
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        currentUrl = url;
        setPdfUrl(url);
        console.log("PDF blob URL created:", url);
      } catch (err) {
        console.error("Error creating blob URL:", err);
      }
    } else {
      setPdfUrl(null);
    }

    // Cleanup blob URL on unmount or when PDF changes
    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [pdfBase64]);

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No PDF data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF Display - Browser Native Viewer */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <iframe
          src={pdfUrl}
          className="w-full h-full border-0"
          title="PDF Viewer"
          style={{ minHeight: "600px" }}
        />
      </div>
    </div>
  );
};

export default PDFViewer;
