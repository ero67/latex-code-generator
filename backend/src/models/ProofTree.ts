import mongoose, { Schema, Document } from "mongoose";

// Interface for tree node structure
export interface IProofTreeNode {
  id: number;
  content: string;
  rightLabel: string;
  mathMode: boolean;
  children: IProofTreeNode[];
}

export interface IProofTree extends Document {
  name: string;
  description?: string;
  treeData: IProofTreeNode;
  settings: {
    math_notation: boolean; // Global mathematical font setting
    includePreamble: boolean; // LaTeX preamble setting
    includeDocumentTags: boolean; // LaTeX package import setting
  };
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Recursive schema for proof tree nodes
const proofTreeNodeSchema = new Schema(
  {
    id: { type: Number, default: 0 },
    content: { type: String, required: true },
    rightLabel: { type: String, default: "" },
    mathMode: { type: Boolean, default: false },
    children: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const proofTreeSchema = new Schema<IProofTree>(
  {
    name: { type: String, required: true, default: "Untitled Proof Tree" },
    description: { type: String, default: "" },
    treeData: { type: proofTreeNodeSchema, required: true },
    settings: {
      math_notation: { type: Boolean, required: true, default: false },
      includePreamble: { type: Boolean, required: true, default: false },
      includeDocumentTags: { type: Boolean, required: true, default: false },
    },
    userId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const ProofTree = mongoose.model<IProofTree>(
  "ProofTree",
  proofTreeSchema
);
