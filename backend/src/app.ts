// Updated app.ts (add this route)
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { authRoutes } from "./routes/auth.routes";
import { karnaughMapRoutes } from "./routes/karnaughmap.routes";
import { abstractSyntaxTreeRoutes } from "./routes/abstractsyntaxtrees.routes";
import { proofTreeRoutes } from "./routes/prooftree.routes";
import { imageToLatexRoutes } from "./routes/imagetolatex.routes";
import { umamiRoutes } from "./routes/umami.routes";

// Initialize express
const app = express();
const corsOptions = {
  origin: [
    "http://svra-ubuntu-server-0161.virtual.cloud.tuke.sk",
    "http://localhost:3000",
    "http://localhost:5173", // Vite default port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
  ],
};
// Middleware
app.use(cors(corsOptions));
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // HTTP request logger

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/karnaughmap", karnaughMapRoutes);
app.use("/api/ast", abstractSyntaxTreeRoutes);
app.use("/api/prooftree", proofTreeRoutes);
app.use("/api/imagetolatex", imageToLatexRoutes);
app.use("/api/umami", umamiRoutes); // Proxy for Umami API

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
