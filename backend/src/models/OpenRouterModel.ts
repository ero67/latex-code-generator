import mongoose, { Schema, Document } from "mongoose";

export interface IOpenRouterModel extends Document {
  modelId: string;
  displayName?: string;
  provider: string;
  enabled: boolean;
}

const openRouterModelSchema = new Schema<IOpenRouterModel>(
  {
    modelId: { type: String, required: true, trim: true, unique: true },
    displayName: { type: String, trim: true },
    provider: { type: String, required: true, default: "openrouter", trim: true },
    enabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const OpenRouterModel = mongoose.model<IOpenRouterModel>(
  "OpenRouterModel",
  openRouterModelSchema
);
