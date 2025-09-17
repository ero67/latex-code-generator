// models/AbstractSyntaxTree.ts
import mongoose, { Schema, Document } from "mongoose";

// Interface for tree node structure
export interface ITreeNode {
  id: number;
  value: string;
  label: string;
  children: ITreeNode[];
}

export interface IAbstractSyntaxTree extends Document {
  name: string;
  description?: string;
  treeData: ITreeNode;
  settings: {
    isChecked: boolean;           // Mathematical font setting
    indexOfOrientation: number;   // Tree orientation (0-3)
    includePreamble: boolean;     // LaTeX preamble setting
    includeDocumentTags: boolean; // LaTeX package import setting
  };
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Recursive schema for tree nodes
const treeNodeSchema = new Schema({
  id: { type: Number,default: 0 },
  value: { type: String, required: true },
  label: { type: String, default: "" },
  children: { type: [Schema.Types.Mixed], default: [] }
}, { _id: false });

const abstractSyntaxTreeSchema = new Schema<IAbstractSyntaxTree>(
  {
    name: { type: String, required: true, default: "Untitled Tree" },
    description: { type: String, default: "" },
    treeData: { type: treeNodeSchema, required: true },
    settings: {
      isChecked: { type: Boolean, required: true, default: false },
      indexOfOrientation: { type: Number, required: true, default: 0 },
      includePreamble: { type: Boolean, required: true, default: false },
      includeDocumentTags: { type: Boolean, required: true, default: false }
    },
    userId: { type: String, required: true }
  },
  {
    timestamps: true,
  }
);

export const AbstractSyntaxTree = mongoose.model<IAbstractSyntaxTree>(
  "AbstractSyntaxTree",
  abstractSyntaxTreeSchema
);