import mongoose from "mongoose";

export interface IAppSettings extends mongoose.Document {
  byokEnabled: boolean;
  byokProvider: string;
}

const appSettingsSchema = new mongoose.Schema(
  {
    byokEnabled: {
      type: Boolean,
      default: false,
    },
    byokProvider: {
      type: String,
      default: "openrouter",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AppSettings = mongoose.model<IAppSettings>(
  "AppSettings",
  appSettingsSchema
);
