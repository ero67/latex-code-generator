import { Request, Response } from "express";
import { ProofTree, IProofTree } from "../models/ProofTree";

export const saveProofTree = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { name, description, treeData, settings, userId } = req.body;

    // Create new Proof Tree
    const proofTree = new ProofTree({
      name,
      description,
      treeData,
      settings,
      userId,
    });

    await proofTree.save();

    res.status(201).json({
      status: "success",
      data: proofTree,
    });
  } catch (error) {
    console.error("Error saving Proof Tree:", error);
    res.status(500).json({
      status: "error",
      message: "Error saving Proof Tree",
    });
  }
};

// Get all Proof Trees
export const getAllProofTrees = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  const { userId } = req.query;
  console.log(req.query);
  console.log("userId from request", userId);
  try {
    const filter = userId ? { userId } : {};
    const proofTrees = await ProofTree.find(filter).sort({ createdAt: -1 });
    console.log(proofTrees);
    res.status(200).json({
      status: "success",
      results: proofTrees.length,
      data: proofTrees,
    });
  } catch (error) {
    console.error("Error fetching Proof Trees:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching Proof Trees",
    });
  }
};

export const getProofTreeById = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { id } = req.params;
    const proofTree = await ProofTree.findById(id);
    if (!proofTree) {
      return res.status(404).json({
        status: "error",
        message: "Proof Tree not found",
      });
    }
    res.status(200).json({
      status: "success",
      data: proofTree,
    });
  } catch (error) {
    console.error("Error fetching Proof Tree:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching Proof Tree",
    });
  }
};

// Update Proof Tree
export const updateProofTree = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { id } = req.params;
    const { name, description, treeData, settings, userId } = req.body;

    const updatedProofTree = await ProofTree.findByIdAndUpdate(
      id,
      {
        name,
        description,
        treeData,
        settings,
        userId,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedProofTree) {
      return res.status(404).json({
        status: "error",
        message: "Proof Tree not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: updatedProofTree,
    });
  } catch (error) {
    console.error("Error updating Proof Tree:", error);
    res.status(500).json({
      status: "error",
      message: "Error updating Proof Tree",
    });
  }
};

// Delete Proof Tree
export const deleteProofTree = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { id } = req.params;

    const deletedProofTree = await ProofTree.findByIdAndDelete(id);

    if (!deletedProofTree) {
      return res.status(404).json({
        status: "error",
        message: "Proof Tree not found",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting Proof Tree:", error);
    res.status(500).json({
      status: "error",
      message: "Error deleting Proof Tree",
    });
  }
};
