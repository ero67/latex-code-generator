import { Request, Response } from "express";
import { FiniteStateAutomata } from "../models/FiniteStateAutomata";

export const saveFSA = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { name, description, nodes, edges, settings, userId } = req.body;

    const automata = new FiniteStateAutomata({
      name,
      description,
      nodes,
      edges,
      settings,
      userId,
    });

    await automata.save();

    res.status(201).json({
      status: "success",
      data: automata,
    });
  } catch (error) {
    console.error("Error saving Finite State Automata:", error);
    res.status(500).json({
      status: "error",
      message: "Error saving Finite State Automata",
    });
  }
};

export const getAllFSA = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  const { userId } = req.query;
  try {
    const filter = userId ? { userId } : {};
    const automata = await FiniteStateAutomata.find(filter).sort({
      createdAt: -1,
    });
    res.status(200).json({
      status: "success",
      results: automata.length,
      data: automata,
    });
  } catch (error) {
    console.error("Error fetching Finite State Automata:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching Finite State Automata",
    });
  }
};

export const getFSAById = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { id } = req.params;
    const automata = await FiniteStateAutomata.findById(id);
    if (!automata) {
      return res.status(404).json({
        status: "error",
        message: "Finite State Automata not found",
      });
    }
    res.status(200).json({
      status: "success",
      data: automata,
    });
  } catch (error) {
    console.error("Error fetching Finite State Automata:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching Finite State Automata",
    });
  }
};

export const updateFSA = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { id } = req.params;
    const { name, description, nodes, edges, settings, userId } = req.body;

    const updated = await FiniteStateAutomata.findByIdAndUpdate(
      id,
      {
        name,
        description,
        nodes,
        edges,
        settings,
        userId,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        status: "error",
        message: "Finite State Automata not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating Finite State Automata:", error);
    res.status(500).json({
      status: "error",
      message: "Error updating Finite State Automata",
    });
  }
};

export const deleteFSA = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { id } = req.params;
    const deleted = await FiniteStateAutomata.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        status: "error",
        message: "Finite State Automata not found",
      });
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting Finite State Automata:", error);
    res.status(500).json({
      status: "error",
      message: "Error deleting Finite State Automata",
    });
  }
};


