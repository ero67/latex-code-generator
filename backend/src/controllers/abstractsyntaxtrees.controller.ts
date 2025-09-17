// controllers/abstractSyntaxTree.controller.ts
import { Request, Response } from "express";
import { AbstractSyntaxTree, IAbstractSyntaxTree } from "../models/AbstractSyntaxTree";

export const saveAST = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const {
      name,
      description,
      treeData,
      settings,
      userId,
    } = req.body;

    // Create new Abstract Syntax Tree
    const abstractSyntaxTree = new AbstractSyntaxTree({
      name,
      description,
      treeData,
      settings,
      userId,
    });

    await abstractSyntaxTree.save();

    res.status(201).json({
      status: "success",
      data: abstractSyntaxTree,
    });
  } catch (error) {
    console.error("Error saving Abstract Syntax Tree:", error);
    res.status(500).json({
      status: "error",
      message: "Error saving Abstract Syntax Tree",
    });
  }
};

// Get all Abstract Syntax Trees
export const getAllAST = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  const { userId } = req.query;
  console.log(req.query);
  console.log("userId from request", userId);
  try {
    const filter = userId ? { userId } : {};
    const abstractSyntaxTrees = await AbstractSyntaxTree.find(filter).sort({ createdAt: -1 });
    console.log(abstractSyntaxTrees);
    res.status(200).json({
      status: "success",
      results: abstractSyntaxTrees.length,
      data: abstractSyntaxTrees,
    });
  } catch (error) {
    console.error("Error fetching Abstract Syntax Trees:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching Abstract Syntax Trees",
    });
  }
};

export const getASTById = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { id } = req.params;
    const abstractSyntaxTree = await AbstractSyntaxTree.findById(id);
    if (!abstractSyntaxTree) {
      return res.status(404).json({
        status: "error",
        message: "Abstract Syntax Tree not found",
      });
    }
    res.status(200).json({
      status: "success",
      data: abstractSyntaxTree,
    });
  } catch (error) {
    console.error("Error fetching Abstract Syntax Tree:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching Abstract Syntax Tree",
    });
  }
};

// Update Abstract Syntax Tree
export const updateAST = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      treeData,
      settings,
      userId,
    } = req.body;

    const updatedAbstractSyntaxTree = await AbstractSyntaxTree.findByIdAndUpdate(
      id,
      {
        name,
        description,
        treeData,
        settings,
        userId,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedAbstractSyntaxTree) {
      return res.status(404).json({
        status: "error",
        message: "Abstract Syntax Tree not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: updatedAbstractSyntaxTree,
    });
  } catch (error) {
    console.error("Error updating Abstract Syntax Tree:", error);
    res.status(500).json({
      status: "error",
      message: "Error updating Abstract Syntax Tree",
    });
  }
};

// Delete Abstract Syntax Tree
export const deleteAST = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { id } = req.params;

    const deletedAbstractSyntaxTree = await AbstractSyntaxTree.findByIdAndDelete(id);

    if (!deletedAbstractSyntaxTree) {
      return res.status(404).json({
        status: "error",
        message: "Abstract Syntax Tree not found",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting Abstract Syntax Tree:", error);
    res.status(500).json({
      status: "error",
      message: "Error deleting Abstract Syntax Tree",
    });
  }
};