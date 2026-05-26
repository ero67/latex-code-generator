import mongoose, { Schema, Document } from "mongoose";

export interface IKarnaughMap extends Document {
  tableSize: string;
  submapCount?: number;
  cellValues: string[];
  implicants: number[][];
  implicantSubmaps?: number[][];
  implicantCellIndexes: { row: number; col: number }[][];
  edgeImplicantCellIndexes: { row: number; col: number }[][];
  edgeImplicants: number[][];
  edgeImplicantSubmaps?: number[][];
  customVariablesAllowed: boolean;
  customVariablesValues: string[];
  cornerImplicant: boolean;
  cornerImplicantSubmaps?: number[];

  userId: string;
}

const karnaughMapSchema = new Schema<IKarnaughMap>(
  {
    tableSize: { type: String },
    submapCount: { type: Number, default: 1 },
    cellValues: { type: [String] },
    implicants: { type: [[Number]] },
    implicantSubmaps: { type: [[Number]], default: [] },
    implicantCellIndexes: [
      [
        {
          row: { type: Number, required: true },
          col: { type: Number, required: true },
        },
      ],
    ],
    edgeImplicants: { type: [[Number]] },
    edgeImplicantSubmaps: { type: [[Number]], default: [] },
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
    cornerImplicantSubmaps: { type: [Number], default: [0] },
  },
  {
    timestamps: true,
  }
);

export const KarnaughMap = mongoose.model<IKarnaughMap>(
  "KarnaughMap",
  karnaughMapSchema
);
