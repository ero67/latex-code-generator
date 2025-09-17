import express, { RequestHandler, Router } from "express";
import {
  saveProofTree,
  getAllProofTrees,
  getProofTreeById,
  updateProofTree,
  deleteProofTree,
} from "../controllers/prooftree.controller";

const router: Router = express.Router();

// Create new Proof Tree
router.post("/", saveProofTree as RequestHandler);

// Get all Proof Trees
router.get("/", getAllProofTrees as RequestHandler);

// Get Proof Tree by ID
router.get("/:id", getProofTreeById as RequestHandler);

// Update Proof Tree
router.put("/:id", updateProofTree as RequestHandler);

// Delete Proof Tree
router.delete("/:id", deleteProofTree as RequestHandler);

export const proofTreeRoutes = router;
