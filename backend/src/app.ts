import express from "express";
import cors from "cors";
import morgan from "morgan";
import { authRoutes } from "./routes/auth.routes";
import { karnaughMapRoutes } from "./routes/karnaughmap.routes";

// Initialize express
const app = express();

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // HTTP request logger

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/saveKM", karnaughMapRoutes);

// Basic error handling
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      status: "error",
      message: "Something broke!",
    });
  }
);

export default app;
