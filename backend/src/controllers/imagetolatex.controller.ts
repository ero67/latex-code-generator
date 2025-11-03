import { Request, Response } from "express";
import { OpenAIService } from "../services/openai.service";
import axios from "axios";
import FormData from "form-data";

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
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "No file uploaded." });
    }

    const { structureType } = req.body;
    if (!structureType) {
      return res
        .status(400)
        .json({ status: "error", message: "Structure type is required." });
    }

    // Check OpenAI API key
    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "your-openai-api-key-here"
    ) {
      return res
        .status(500)
        .json({
          status: "error",
          message:
            "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.",
        });
    }

    // Validate structure type
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

    // Forward processed buffer to OpenAI service
    const result = await OpenAIService.analyzeImage(
      processedBuffer,
      "image/png",
      structureType
    );

    return res
      .status(200)
      .json({
        status: "success",
        latex: result.latex,
        structureType: result.structureType,
        confidence: result.confidence,
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
