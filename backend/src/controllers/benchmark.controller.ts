import { Request, Response } from "express";
import { OpenRouterService } from "../services/openrouter.service";
import axios from "axios";
import FormData from "form-data";

const PREPROCESS_URL =
  process.env.PREPROCESS_URL || "http://python-preprocess:8000/preprocess";
const PREPROCESS_TIMEOUT_MS = Number(
  process.env.PREPROCESS_TIMEOUT_MS || 30000
);

// Per-model timeout (default 5 minutes)
const BENCHMARK_MODEL_TIMEOUT_MS = Number(
  process.env.BENCHMARK_MODEL_TIMEOUT_MS || 300000
);

async function callPreprocessService(
  fileBuffer: Buffer,
  filename: string,
  contentType: string,
  timeoutMs = PREPROCESS_TIMEOUT_MS
): Promise<Buffer> {
  const form = new FormData();
  form.append("file", fileBuffer, { filename, contentType });

  const headers = form.getHeaders();

  const response = await axios.post(PREPROCESS_URL, form, {
    headers,
    responseType: "arraybuffer",
    timeout: timeoutMs,
    maxContentLength: 50 * 1024 * 1024,
  });

  return Buffer.from(response.data);
}

interface BenchmarkResult {
  model: string;
  structure: string;
  file: string;
  latency: number;
  output?: string;
  error?: string;
  status: "success" | "failed";
  cost?: number;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export const runBenchmark = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "No file uploaded." });
    }

    const { structureType } = req.body;
    let { models } = req.body;

    if (!structureType) {
      return res
        .status(400)
        .json({ status: "error", message: "Structure type is required." });
    }

    // models comes as JSON string from FormData
    if (typeof models === "string") {
      try {
        models = JSON.parse(models);
      } catch {
        return res
          .status(400)
          .json({ status: "error", message: "Invalid models format." });
      }
    }

    if (!Array.isArray(models) || models.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "At least one model is required.",
      });
    }

    if (
      !process.env.OPENROUTER_API_KEY ||
      process.env.OPENROUTER_API_KEY === "your-openrouter-api-key-here"
    ) {
      return res.status(500).json({
        status: "error",
        message:
          "OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.",
      });
    }

    // Preprocess the image once
    const processedBuffer = await callPreprocessService(
      req.file.buffer,
      req.file.originalname || "upload.png",
      req.file.mimetype || "image/png"
    );

    const filename = req.file.originalname || "upload.png";

    // Run all models sequentially to avoid rate-limiting
    const results: BenchmarkResult[] = [];

    for (const model of models) {
      const startTime = Date.now();
      try {
        const analysisResult = await Promise.race([
          OpenRouterService.analyzeImage(
            processedBuffer,
            "image/png",
            structureType,
            model
          ),
          new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    `Timeout after ${BENCHMARK_MODEL_TIMEOUT_MS / 1000} seconds`
                  )
                ),
              BENCHMARK_MODEL_TIMEOUT_MS
            )
          ),
        ]);

        const latency = (Date.now() - startTime) / 1000; // seconds

        results.push({
          model,
          structure: structureType,
          file: filename,
          latency: Math.round(latency * 100) / 100,
          output: analysisResult.latex,
          status: "success",
          cost: analysisResult.cost,
          usage: analysisResult.usage,
        });
      } catch (error) {
        const latency = (Date.now() - startTime) / 1000;
        results.push({
          model,
          structure: structureType,
          file: filename,
          latency: Math.round(latency * 100) / 100,
          error:
            error instanceof Error ? error.message : "Unknown error",
          status: "failed",
        });
      }

      // Send intermediate progress via SSE-like headers isn't possible with REST,
      // so we just continue sequentially
    }

    return res.status(200).json({
      status: "success",
      results,
      message: `Benchmark completed for ${results.length} model(s)`,
    });
  } catch (error: any) {
    console.error("Benchmark error:", error?.message || error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 502;
      const detail = error.response?.data || error.message;
      return res.status(status).json({
        status: "error",
        message: "Preprocess service error",
        details: detail,
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Benchmark failed.",
      details: error?.message,
    });
  }
};
