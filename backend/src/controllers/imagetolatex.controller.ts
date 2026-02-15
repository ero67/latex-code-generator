import { Request, Response } from "express";
import { OpenAIService } from "../services/openai.service";
import { OpenRouterService } from "../services/openrouter.service";
import { OpenRouterModel } from "../models/OpenRouterModel";
import axios from "axios";
import FormData from "form-data";

// AI Provider configuration - set via environment variable
// Options: "openai" | "openrouter"
const AI_PROVIDER = process.env.AI_PROVIDER || "openrouter";

const PREPROCESS_URL =
  process.env.PREPROCESS_URL || "http://python-preprocess:8000/preprocess";
const PREPROCESS_TIMEOUT_MS = Number(
  process.env.PREPROCESS_TIMEOUT_MS || 30000
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

export const convertImageToLatex = async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "No file uploaded." });
    }

    const { structureType, model } = req.body;
    if (!structureType) {
      return res
        .status(400)
        .json({ status: "error", message: "Structure type is required." });
    }

    // Check API key based on provider
    if (AI_PROVIDER === "openai") {
      if (
        !process.env.OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY === "your-openai-api-key-here"
      ) {
        return res.status(500).json({
          status: "error",
          message:
            "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.",
        });
      }
    } else if (AI_PROVIDER === "openrouter") {
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
    }

    // Validate structure type (both services support the same types)
    const supportedTypes = OpenAIService.getSupportedStructureTypes();
    if (!supportedTypes.includes(structureType)) {
      return res
        .status(400)
        .json({
          status: "error",
          message: `Unsupported structure type. Supported types: ${supportedTypes.join(
            ", "
          )}`,
        });
    }

    console.log("Received file:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      structureType,
    });

    // Call external Python preprocess service (returns PNG bytes)
    const processedBuffer = await callPreprocessService(
      req.file.buffer,
      req.file.originalname || "upload.png",
      req.file.mimetype || "image/png"
    );

    // Forward processed buffer to AI service based on configured provider
    let resolvedModel: string | undefined = model;
    if (AI_PROVIDER === "openrouter" && model) {
      const configuredCount = await OpenRouterModel.countDocuments({
        provider: "openrouter",
      });

      if (configuredCount > 0) {
        const found = await OpenRouterModel.findOne({
          modelId: model,
          enabled: true,
          provider: "openrouter",
        });

        if (!found) {
          return res.status(400).json({
            status: "error",
            message: "Selected model is not available",
          });
        }
      }
    }

    const result =
      AI_PROVIDER === "openai"
        ? await OpenAIService.analyzeImage(
            processedBuffer,
            "image/png",
            structureType
          )
        : await OpenRouterService.analyzeImage(
            processedBuffer,
            "image/png",
            structureType,
            resolvedModel
          );

    const responseTimeMs = Date.now() - startTime;
    const usedModel =
      AI_PROVIDER === "openai"
        ? OpenAIService.getConfiguredModel()
        : OpenRouterService.getConfiguredModel(resolvedModel);

    return res
      .status(200)
      .json({
        status: "success",
        latex: result.latex,
        structureType: result.structureType,
        confidence: result.confidence,
        provider: AI_PROVIDER,
        model: usedModel,
        responseTimeMs,
        cost: result.cost,
        usage: result.usage,
        message: "Image processed successfully",
      });
  } catch (error: any) {
    console.error("Error processing image to LaTeX:", error?.message || error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 502;
      const detail = error.response?.data || error.message;
      return res
        .status(status)
        .json({
          status: "error",
          message: "Preprocess service error",
          details: detail,
        });
    }

    return res
      .status(500)
      .json({
        status: "error",
        message: "Error processing image.",
        details: error?.message,
      });
  }
};
