import { Buffer } from "buffer";

// Import prompts from openai service to reuse them
import { PROMPTS } from "./openai.service";

// Default model - can be changed via environment variable
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4.1";

export interface ImageAnalysisResult {
  latex: string;
  confidence?: number;
  structureType: string;
  cost?: number;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// Dynamic import for ESM-only @openrouter/sdk
async function getOpenRouterClient() {
  const { OpenRouter } = await import("@openrouter/sdk");
  return new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });
}

export class OpenRouterService {
  static async analyzeImage(
    imageBuffer: Buffer,
    imageMimeType: string,
    structureType: string,
    requestedModel?: string
  ): Promise<ImageAnalysisResult> {
    try {
      const base64Image = imageBuffer.toString("base64");
      const prompt =
        PROMPTS[structureType as keyof typeof PROMPTS] || PROMPTS["Proof Tree"];

      const model = OpenRouterService.getConfiguredModel(requestedModel);
      const openRouter = await getOpenRouterClient();

      const result = await openRouter.chat.send({
        chatGenerationParams: {
          model,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  imageUrl: {
                    url: `data:${imageMimeType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          stream: false,
          maxTokens: 2000,
          temperature: 0.1,
        },
      });

      // Handle the response - the SDK returns different types based on stream option
      const response = result as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          cost?: number;
        };
      };
      const content = response.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("No response from OpenRouter");
      }

      const latexCode = content
        .replace(/```latex\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/```tex\n?/g, "")
        .trim();

      return {
        latex: latexCode,
        confidence: 0.9,
        structureType,
        cost: response.usage?.cost,
        usage: response.usage
          ? {
              prompt_tokens: response.usage.prompt_tokens,
              completion_tokens: response.usage.completion_tokens,
              total_tokens: response.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      console.error("OpenRouter API Error:", error);
      throw new Error(
        `Failed to analyze image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  static getSupportedStructureTypes(): string[] {
    return Object.keys(PROMPTS);
  }

  static getConfiguredModel(requestedModel?: string): string {
    if (requestedModel && requestedModel.trim().length > 0) {
      return requestedModel.trim();
    }
    return process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  }
}
