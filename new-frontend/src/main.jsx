// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";

// Initialize i18n before any component renders
import "./i18n";

// Import your main App component and CSS files
import App from "./App.jsx";
import "./index.css";

// Your code from the old index.js file
const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
