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

// Delay between model requests to avoid rate limiting (default 2 seconds)
const BENCHMARK_DELAY_MS = Number(
  process.env.BENCHMARK_DELAY_MS || 2000
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
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendProgress = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    if (!req.file) {
      sendProgress({ status: "error", message: "No file uploaded." });
      return res.status(400).end();
    }

    const { structureType } = req.body;
    let { models } = req.body;

    if (!structureType) {
      sendProgress({ status: "error", message: "Structure type is required." });
      return res.status(400).end();
    }

    // models comes as JSON string from FormData
    if (typeof models === "string") {
      try {
        models = JSON.parse(models);
      } catch {
        sendProgress({ status: "error", message: "Invalid models format." });
        return res.status(400).end();
      }
    }

    if (!Array.isArray(models) || models.length === 0) {
      sendProgress({
        status: "error",
        message: "At least one model is required.",
      });
      return res.status(400).end();
    }

    if (
      !process.env.OPENROUTER_API_KEY ||
      process.env.OPENROUTER_API_KEY === "your-openrouter-api-key-here"
    ) {
      sendProgress({
        status: "error",
        message:
          "OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.",
      });
      return res.status(500).end();
    }

    // Preprocess the image once
    sendProgress({ status: "progress", message: "Preprocessing image..." });
    const processedBuffer = await callPreprocessService(
      req.file.buffer,
      req.file.originalname || "upload.png",
      req.file.mimetype || "image/png"
    );

    const filename = req.file.originalname || "upload.png";

    // Run all models sequentially to avoid rate-limiting
    const results: BenchmarkResult[] = [];

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      const modelIndex = i + 1;
      const totalModels = models.length;

      sendProgress({
        status: "progress",
        message: `Testing model ${modelIndex}/${totalModels}`,
        currentModel: model,
        modelIndex,
        totalModels,
      });

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

        const result: BenchmarkResult = {
          model,
          structure: structureType,
          file: filename,
          latency: Math.round(latency * 100) / 100,
          output: analysisResult.latex,
          status: "success",
          cost: analysisResult.cost,
          usage: analysisResult.usage,
        };
        results.push(result);
        sendProgress({ status: "result", result });
      } catch (error) {
        const latency = (Date.now() - startTime) / 1000;
        const result: BenchmarkResult = {
          model,
          structure: structureType,
          file: filename,
          latency: Math.round(latency * 100) / 100,
          error: error instanceof Error ? error.message : "Unknown error",
          status: "failed",
        };
        results.push(result);
        sendProgress({ status: "result", result });
      }

      // Add delay between requests to avoid rate limiting
      if (i < models.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, BENCHMARK_DELAY_MS));
      }
    }

    sendProgress({
      status: "complete",
      message: `Benchmark completed for ${results.length} model(s)`,
      results,
    });
    res.end();
  } catch (error: any) {
    console.error("Benchmark error:", error?.message || error);
    sendProgress({
      status: "error",
      message: "Benchmark failed.",
      details: error?.message,
    });
    res.end();
  }
};
