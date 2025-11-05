// umami.routes.ts - Proxy route for Umami Analytics API
import express, { Router, RequestHandler } from "express";
import axios from "axios";

const router: Router = express.Router();

// Get Umami URL from environment variable
const UMAMI_URL = process.env.UMAMI_URL || "http://localhost:9000";

// Proxy function to forward requests to Umami
const proxyToUmami: RequestHandler = async (req, res) => {
  try {
    // Remove /api/umami prefix, keep the rest (which already includes /api)
    const umamiPath = req.originalUrl.replace("/api/umami", "");
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const url = `${UMAMI_URL}${umamiPath}${queryString ? `?${queryString}` : ""}`;
    
    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Forward Authorization header if present
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }
    
    // Prepare request config
    const config: any = {
      method: req.method,
      url,
      headers,
    };
    
    // Add body for non-GET/HEAD requests
    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      config.data = req.body;
    }
    
    // Forward the request to Umami using axios
    const response = await axios(config);
    
    // Forward the status and data
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("Umami proxy error:", error);
    const status = error.response?.status || 500;
    const data = error.response?.data || {
      status: "error",
      message: error.message || "Failed to proxy request to Umami",
    };
    res.status(status).json(data);
  }
};

// Proxy all routes to Umami
router.get("*", proxyToUmami);
router.post("*", proxyToUmami);
router.put("*", proxyToUmami);
router.delete("*", proxyToUmami);
router.patch("*", proxyToUmami);

export const umamiRoutes = router;

