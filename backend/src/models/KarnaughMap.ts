import mongoose, { Schema, Document } from "mongoose";

export interface IKarnaughMap extends Document {
  tableSize: string;
  cellValues: string[];
  implicants: number[][];
  implicantCellIndexes: { row: number; col: number }[][];
  edgeImplicantCellIndexes: { row: number; col: number }[][];
  edgeImplicants: number[][];
  customVariablesAllowed: boolean;
  customVariablesValues: string[];
  cornerImplicant: boolean;

  userId: string;
}

const karnaughMapSchema = new Schema<IKarnaughMap>(
  {
    tableSize: { type: String },
    cellValues: { type: [String] },
    implicants: { type: [[Number]] },
    implicantCellIndexes: [
      [
        {
          row: { type: Number, required: true },
          col: { type: Number, required: true },
        },
      ],
    ],
    edgeImplicants: { type: [[Number]] },
    edgeImplicantCellIndexes: [
      [
        {
          row: { type: Number, required: true },
          col: { type: Number, required: true },
        },
      ],
    ],
    customVariablesAllowed: { type: Boolean, required: true },
    customVariablesValues: { type: [String] },
    userId: { type: String, required: true },
    cornerImplicant: { type: Boolean, required: true },
  },
  {
    timestamps: true,
  }
);

export const KarnaughMap = mongoose.model<IKarnaughMap>(
  "KarnaughMap",
  karnaughMapSchema
);
