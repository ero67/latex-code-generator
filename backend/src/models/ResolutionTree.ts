import mongoose, { Schema, Document } from "mongoose";

export interface IResolutionTreeNode {
  id: number;
  value: string;
  children: IResolutionTreeNode[];
}

export interface IResolutionTreeExtraLink {
  sourceId: number; // second parent
  targetId: number; // derived clause
}

export interface IResolutionTree extends Document {
  name: string;
  description?: string;
  treeData: IResolutionTreeNode; // stored with a virtual root in the frontend
  extraLinks: IResolutionTreeExtraLink[];
  settings: {
    mathMode: boolean;
    includePreamble: boolean;
  };
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const resolutionTreeNodeSchema = new Schema(
  {
    id: { type: Number, required: true },
    value: { type: String, default: "" },
    // Recursive structure; keep flexible for now
    children: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const resolutionTreeExtraLinkSchema = new Schema(
  {
    sourceId: { type: Number, required: true },
    targetId: { type: Number, required: true },
  },
  { _id: false }
);

const resolutionTreeSchema = new Schema<IResolutionTree>(
  {
    name: { type: String, required: true, default: "Untitled Resolution Tree" },
    description: { type: String, default: "" },
    treeData: { type: resolutionTreeNodeSchema, required: true },
    extraLinks: { type: [resolutionTreeExtraLinkSchema], required: true, default: [] },
    settings: {
      mathMode: { type: Boolean, required: true, default: true },
      includePreamble: { type: Boolean, required: true, default: true },
    },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

export const ResolutionTree = mongoose.model<IResolutionTree>(
  "ResolutionTree",
  resolutionTreeSchema
);

