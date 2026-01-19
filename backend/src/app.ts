// Updated app.ts (add this route)
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { authRoutes } from "./routes/auth.routes";
import { karnaughMapRoutes } from "./routes/karnaughmap.routes";
import { abstractSyntaxTreeRoutes } from "./routes/abstractsyntaxtrees.routes";
import { proofTreeRoutes } from "./routes/prooftree.routes";
import { finiteStateAutomataRoutes } from "./routes/finitestateautomata.routes";
import { resolutionTreeRoutes } from "./routes/resolutiontree.routes";
import { imageToLatexRoutes } from "./routes/imagetolatex.routes";
import { umamiRoutes } from "./routes/umami.routes";
import { latexRoutes } from "./routes/latex.routes";
import { ssoRoutes } from "./routes/sso.routes";

// Initialize express
const app = express();
const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    "http://svra-ubuntu-server-0161.virtual.cloud.tuke.sk",
    "https://svra-ubuntu-server-0161.virtual.cloud.tuke.sk",
    "http://localhost:3000",
    "http://localhost:5173", // Vite default port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
  ].filter(Boolean)
);

// Middleware
// CORS note:
// - In production, the app is served behind `reverse-proxy` on the same origin as `/api/*`.
// - When the teacher points a new domain at your IP, the browser Origin becomes `https://<DOMAIN>`.
//   If we hard-block unknown origins here, even same-origin API calls can start failing.
//
// So we:
// - always allow requests with no Origin (curl/postman)
// - allow explicitly configured origins (FRONTEND_URL, localhost, etc.)
// - allow "same-origin" requests based on Host + (X-Forwarded-Proto | req.protocol)
const corsOptionsDelegate: cors.CorsOptionsDelegate = (req, callback) => {
  const getHeader = (name: string): string | undefined => {
    const value = req.headers?.[name.toLowerCase()];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const origin = getHeader("origin");
  if (!origin) return callback(null, { origin: true });

  const host = getHeader("host");
  const forwardedProtoRaw = getHeader("x-forwarded-proto");
  // NOTE: `cors` types `req` as `CorsRequest`, which doesn't include Express' `req.protocol`.
  // We only need protocol for "same-origin" checks, so rely on X-Forwarded-Proto (set by our reverse-proxy),
  // and fall back to "http" when it's missing.
  const proto = (forwardedProtoRaw ? forwardedProtoRaw.split(",")[0] : "http").trim();
  const sameOrigin = Boolean(host) && origin === `${proto}://${host}`;

  const isAllowed = sameOrigin || allowedOrigins.has(origin);
  return callback(null, { origin: isAllowed });
};

app.use(cors(corsOptionsDelegate));
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // HTTP request logger

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/karnaughmap", karnaughMapRoutes);
app.use("/api/ast", abstractSyntaxTreeRoutes);
app.use("/api/prooftree", proofTreeRoutes);
app.use("/api/fsa", finiteStateAutomataRoutes);
app.use("/api/resolutiontree", resolutionTreeRoutes);
app.use("/api/imagetolatex", imageToLatexRoutes);
app.use("/api/umami", umamiRoutes); // Proxy for Umami API
app.use("/api/latex", latexRoutes); // LaTeX compilation service
app.use("/api/sso", ssoRoutes); // SSO authentication

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
