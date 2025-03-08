import mongoose, { Schema, Document } from "mongoose";

export interface IKarnaughMap extends Document {
  tableSize: string;
  cellValues: string[];
  implicants: number[][];
  edgeImplicants: number[][];
  // userId: string;
}

// TODO save user id with map
const karnaughMapSchema = new Schema<IKarnaughMap>(
  {
    tableSize: { type: String },
    cellValues: { type: [String] },
    implicants: { type: [[Number]] },
    edgeImplicants: { type: [[Number]] },
    // userId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const KarnaughMap = mongoose.model<IKarnaughMap>(
  "KarnaughMap",
  karnaughMapSchema
);
