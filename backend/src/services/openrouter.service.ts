import { Buffer } from "buffer";
import axios from "axios";

// Import prompts from openai service to reuse them
import { PROMPTS } from "./openai.service";

// Default model - can be changed via environment variable
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4.1";

type ModelPricing = {
  prompt?: number;
  completion?: number;
  request?: number;
  image?: number;
};

const PRICING_CACHE_TTL_MS = 10 * 60 * 1000;
let pricingCache:
  | {
      fetchedAt: number;
      data: Map<string, ModelPricing>;
    }
  | null = null;

const parsePrice = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const getCachedPricing = (modelId: string): ModelPricing | undefined => {
  if (!pricingCache) return undefined;
  if (Date.now() - pricingCache.fetchedAt > PRICING_CACHE_TTL_MS) return undefined;
  return pricingCache.data.get(modelId);
};

const fetchModelPricing = async (modelId: string): Promise<ModelPricing | undefined> => {
  const cached = getCachedPricing(modelId);
  if (cached) return cached;

  const response = await axios.get("https://openrouter.ai/api/v1/models", {
    timeout: 10000,
  });
  const models = response.data?.data;
  if (!Array.isArray(models)) return undefined;

  const map = new Map<string, ModelPricing>();
  for (const model of models) {
    if (!model?.id || !model?.pricing) continue;
    map.set(model.id, {
      prompt: parsePrice(model.pricing.prompt),
      completion: parsePrice(model.pricing.completion),
      request: parsePrice(model.pricing.request),
      image: parsePrice(model.pricing.image),
    });
  }

  pricingCache = { fetchedAt: Date.now(), data: map };
  return map.get(modelId);
};

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
async function getOpenRouterClient(apiKey: string) {
  const { OpenRouter } = await import("@openrouter/sdk");
  return new OpenRouter({
    apiKey,
  });
}

export class OpenRouterService {
  static async analyzeImage(
    imageBuffer: Buffer,
    imageMimeType: string,
    structureType: string,
    requestedModel?: string,
    apiKey?: string
  ): Promise<ImageAnalysisResult> {
    try {
      const base64Image = imageBuffer.toString("base64");
      const prompt =
        PROMPTS[structureType as keyof typeof PROMPTS] || PROMPTS["Proof Tree"];

      const model = OpenRouterService.getConfiguredModel(requestedModel);
      const resolvedKey = apiKey || process.env.OPENROUTER_API_KEY || "";
      if (!resolvedKey) {
        throw new Error("OpenRouter API key not configured");
      }
      const openRouter = await getOpenRouterClient(resolvedKey);

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
      const response = result as any;

      const content = response?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No response from OpenRouter");
      }

      const latexCode = content
        .replace(/```latex\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/```tex\n?/g, "")
        .trim();

      const usageRaw =
        response?.usage ?? response?.data?.usage ?? response?.response?.usage;
      const toNumber = (value: unknown) => {
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }
        if (typeof value === "string") {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : undefined;
        }
        return undefined;
      };
      const promptTokens =
        usageRaw?.prompt_tokens ?? usageRaw?.promptTokens ?? undefined;
      const completionTokens =
        usageRaw?.completion_tokens ?? usageRaw?.completionTokens ?? undefined;
      const totalTokens =
        usageRaw?.total_tokens ??
        usageRaw?.totalTokens ??
        (promptTokens != null && completionTokens != null
          ? promptTokens + completionTokens
          : undefined);
      const costDetails = usageRaw?.cost_details ?? usageRaw?.costDetails;
      const costDirect =
        toNumber(usageRaw?.cost) ??
        toNumber(response?.cost) ??
        toNumber(response?.data?.cost);
      const costFromDetails = toNumber(
        costDetails?.upstream_inference_cost ??
          costDetails?.upstreamInferenceCost ??
          costDetails?.total_cost ??
          costDetails?.totalCost
      );
      const promptCost = toNumber(
        costDetails?.upstream_inference_prompt_cost ??
          costDetails?.upstreamInferencePromptCost
      );
      const completionCost = toNumber(
        costDetails?.upstream_inference_completions_cost ??
          costDetails?.upstreamInferenceCompletionsCost
      );
      const summedCost =
        promptCost != null || completionCost != null
          ? (promptCost || 0) + (completionCost || 0)
          : undefined;
      let cost = costDirect ?? costFromDetails ?? summedCost;
      const usage =
        promptTokens != null || completionTokens != null || totalTokens != null
          ? {
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              total_tokens: totalTokens,
            }
          : undefined;

      if (cost == null && usage) {
        try {
          const pricing = await fetchModelPricing(model);
          if (pricing) {
            const promptPrice = pricing.prompt || 0;
            const completionPrice = pricing.completion || 0;
            const requestPrice = pricing.request || 0;
            const imagePrice = pricing.image || 0;
            const promptCount = usage.prompt_tokens || 0;
            const completionCount = usage.completion_tokens || 0;
            cost =
              promptCount * promptPrice +
              completionCount * completionPrice +
              requestPrice +
              imagePrice;
          }
        } catch (pricingError) {
          console.warn("Failed to fetch OpenRouter pricing:", pricingError);
        }
      }

      return {
        latex: latexCode,
        confidence: 0.9,
        structureType,
        cost,
        usage,
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
