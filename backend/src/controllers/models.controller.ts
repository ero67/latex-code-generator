import { Request, Response } from "express";
import { OpenRouterModel } from "../models/OpenRouterModel";

export const getAvailableModels = async (req: Request, res: Response) => {
  try {
    const models = await OpenRouterModel.find({
      enabled: true,
      provider: "openrouter",
    })
      .sort({ modelId: 1 })
      .lean();

    return res.json({
      status: "success",
      data: models,
    });
  } catch (error) {
    console.error("Error fetching available models:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to load models",
    });
  }
};

export const getAllModels = async (req: Request, res: Response) => {
  try {
    const models = await OpenRouterModel.find({ provider: "openrouter" })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      status: "success",
      data: models,
    });
  } catch (error) {
    console.error("Error fetching models:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to load models",
    });
  }
};

export const createModel = async (req: Request, res: Response) => {
  try {
    const { modelId, displayName, enabled } = req.body;

    if (!modelId || typeof modelId !== "string") {
      return res.status(400).json({
        status: "error",
        message: "modelId is required",
      });
    }

    const existing = await OpenRouterModel.findOne({ modelId });
    if (existing) {
      return res.status(409).json({
        status: "error",
        message: "Model already exists",
      });
    }

    const model = await OpenRouterModel.create({
      modelId,
      displayName,
      enabled: enabled !== undefined ? Boolean(enabled) : true,
      provider: "openrouter",
    });

    return res.status(201).json({
      status: "success",
      data: model,
    });
  } catch (error) {
    console.error("Error creating model:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create model",
    });
  }
};

export const updateModel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { displayName, enabled } = req.body;

    const update: Record<string, unknown> = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (enabled !== undefined) update.enabled = Boolean(enabled);

    const model = await OpenRouterModel.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!model) {
      return res.status(404).json({
        status: "error",
        message: "Model not found",
      });
    }

    return res.json({
      status: "success",
      data: model,
    });
  } catch (error) {
    console.error("Error updating model:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update model",
    });
  }
};
