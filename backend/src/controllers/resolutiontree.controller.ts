import { Request, Response } from "express";
import { ResolutionTree } from "../models/ResolutionTree";

export const saveResolutionTree = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { name, description, treeData, extraLinks, settings, userId } = req.body;

    const doc = new ResolutionTree({
      name,
      description,
      treeData,
      extraLinks,
      settings,
      userId,
    });

    await doc.save();

    res.status(201).json({
      status: "success",
      data: doc,
    });
  } catch (error) {
    console.error("Error saving Resolution Tree:", error);
    res.status(500).json({
      status: "error",
      message: "Error saving Resolution Tree",
    });
  }
};

export const getAllResolutionTrees = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  const { userId } = req.query;
  try {
    const filter = userId ? { userId } : {};
    const docs = await ResolutionTree.find(filter as any).sort({ createdAt: -1 });
    res.status(200).json({
      status: "success",
      results: docs.length,
      data: docs,
    });
  } catch (error) {
    console.error("Error fetching Resolution Trees:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching Resolution Trees",
    });
  }
};

export const getResolutionTreeById = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { id } = req.params;
    const doc = await ResolutionTree.findById(id);
    if (!doc) {
      return res.status(404).json({
        status: "error",
        message: "Resolution Tree not found",
      });
    }
    res.status(200).json({
      status: "success",
      data: doc,
    });
  } catch (error) {
    console.error("Error fetching Resolution Tree:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching Resolution Tree",
    });
  }
};

export const updateResolutionTree = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { id } = req.params;
    const { name, description, treeData, extraLinks, settings, userId } = req.body;

    const updated = await ResolutionTree.findByIdAndUpdate(
      id,
      {
        name,
        description,
        treeData,
        extraLinks,
        settings,
        userId,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        status: "error",
        message: "Resolution Tree not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating Resolution Tree:", error);
    res.status(500).json({
      status: "error",
      message: "Error updating Resolution Tree",
    });
  }
};

export const deleteResolutionTree = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { id } = req.params;
    const deleted = await ResolutionTree.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        status: "error",
        message: "Resolution Tree not found",
      });
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting Resolution Tree:", error);
    res.status(500).json({
      status: "error",
      message: "Error deleting Resolution Tree",
    });
  }
};

