import mongoose, { Schema, Document } from "mongoose";

export interface IFsaNode {
  id: string;
  label: string;
  x: number;
  y: number;
  isStart: boolean;
  isAccepting: boolean;
}

export interface IFsaEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
}

export interface IFiniteStateAutomata extends Document {
  name: string;
  description?: string;
  nodes: IFsaNode[];
  edges: IFsaEdge[];
  settings: {
    includePreamble: boolean;
    includeTikzImports: boolean;
  };
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const fsaNodeSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, default: "" },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    isStart: { type: Boolean, default: false },
    isAccepting: { type: Boolean, default: false },
  },
  { _id: false }
);

const fsaEdgeSchema = new Schema(
  {
    id: { type: String, required: true },
    sourceId: { type: String, required: true },
    targetId: { type: String, required: true },
    label: { type: String, default: "" },
  },
  { _id: false }
);

const finiteStateAutomataSchema = new Schema<IFiniteStateAutomata>(
  {
    name: { type: String, required: true, default: "Untitled Automata" },
    description: { type: String, default: "" },
    nodes: { type: [fsaNodeSchema], required: true, default: [] },
    edges: { type: [fsaEdgeSchema], required: true, default: [] },
    settings: {
      includePreamble: { type: Boolean, required: true, default: true },
      includeTikzImports: { type: Boolean, required: true, default: true },
    },
    userId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const FiniteStateAutomata = mongoose.model<IFiniteStateAutomata>(
  "FiniteStateAutomata",
  finiteStateAutomataSchema
);


