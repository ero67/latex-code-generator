import { Request, Response } from "express";
import { AppSettings } from "../models/AppSettings";

const getOrCreateSettings = async () => {
  let settings = await AppSettings.findOne();
  if (!settings) {
    settings = await AppSettings.create({});
  }
  return settings;
};

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({
      status: "success",
      data: settings,
    });
  } catch (error) {
    console.error("Error loading settings:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to load settings",
    });
  }
};

export const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({
      status: "success",
      data: {
        byokEnabled: settings.byokEnabled,
        byokProvider: settings.byokProvider,
      },
    });
  } catch (error) {
    console.error("Error loading public settings:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to load settings",
    });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { byokEnabled, byokProvider } = req.body || {};

    const update: Record<string, unknown> = {};
    if (byokEnabled !== undefined) {
      update.byokEnabled = Boolean(byokEnabled);
    }
    if (byokProvider !== undefined) {
      if (typeof byokProvider !== "string" || !byokProvider.trim()) {
        return res.status(400).json({
          status: "error",
          message: "byokProvider must be a non-empty string",
        });
      }
      update.byokProvider = byokProvider.trim();
    }

    const settings = await AppSettings.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    return res.json({
      status: "success",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update settings",
    });
  }
};
