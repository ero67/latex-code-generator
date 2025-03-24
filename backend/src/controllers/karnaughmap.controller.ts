import { Request, Response } from "express";
import { KarnaughMap, IKarnaughMap } from "../models/KarnaughMap";

export const saveKM = async (req: Request, res: Response) => {
  try {
    const {
      tableSize,
      cellValues,
      implicants,
      implicantCellIndexes,
      edgeImplicants,
      edgeImplicantCellIndexes,
      userId,
    } = req.body;

    // Create new Karnaugh map
    const karnaughMap = new KarnaughMap({
      tableSize,
      cellValues,
      implicants,
      implicantCellIndexes,
      edgeImplicants,
      edgeImplicantCellIndexes,
      userId,
    });

    await karnaughMap.save();

    res.status(201).json({
      status: "success",
      data: karnaughMap,
    });
  } catch (error) {
    console.error("Error saving Karnaugh map:", error);
    res.status(500).json({
      status: "error",
      message: "Error saving Karnaugh map",
    });
  }
};

// Get all Karnaugh maps
export const getAllKM = async (req: Request, res: Response) => {
  const { userId } = req.query;
  console.log(req.query);
  console.log("useridfrom request", userId);
  try {
    const filter = userId ? { userId } : {};
    const karnaughMaps = await KarnaughMap.find(filter).sort({ createdAt: -1 });
    console.log(karnaughMaps);
    res.status(200).json({
      status: "success",
      results: karnaughMaps.length,
      data: karnaughMaps,
    });
  } catch (error) {
    console.error("Error fetching Karnaugh maps:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching Karnaugh maps",
    });
  }
};

export const getKMById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const karnaughMap = await KarnaughMap.findById(id);

    if (!karnaughMap) {
      return res.status(404).json({
        status: "error",
        message: "Karnaugh map not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: karnaughMap,
    });
  } catch (error) {
    console.error("Error fetching Karnaugh map:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching Karnaugh map",
    });
  }
};

// Update Karnaugh map
export const updateKM = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      tableSize,
      cellValues,
      implicants,
      implicantCellIndexes,
      edgeImplicants,
      edgeImplicantCellIndexes,
      userId,
    } = req.body;

    const updatedKarnaughMap = await KarnaughMap.findByIdAndUpdate(
      id,
      {
        tableSize,
        cellValues,
        implicants,
        implicantCellIndexes,
        edgeImplicants,
        edgeImplicantCellIndexes,
        userId,
      },
      { new: true, runValidators: true }
    );

    if (!updatedKarnaughMap) {
      return res.status(404).json({
        status: "error",
        message: "Karnaugh map not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: updatedKarnaughMap,
    });
  } catch (error) {
    console.error("Error updating Karnaugh map:", error);
    res.status(500).json({
      status: "error",
      message: "Error updating Karnaugh map",
    });
  }
};

// Delete Karnaugh map
export const deleteKM = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedKarnaughMap = await KarnaughMap.findByIdAndDelete(id);

    if (!deletedKarnaughMap) {
      return res.status(404).json({
        status: "error",
        message: "Karnaugh map not found",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting Karnaugh map:", error);
    res.status(500).json({
      status: "error",
      message: "Error deleting Karnaugh map",
    });
  }
};
