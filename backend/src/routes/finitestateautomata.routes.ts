import express, { RequestHandler, Router } from "express";
import {
  saveFSA,
  getAllFSA,
  getFSAById,
  updateFSA,
  deleteFSA,
} from "../controllers/finitestateautomata.controller";

const router: Router = express.Router();

// Create new Finite State Automata
router.post("/", saveFSA as RequestHandler);

// Get all Finite State Automata
router.get("/", getAllFSA as RequestHandler);

// Get Finite State Automata by ID
router.get("/:id", getFSAById as RequestHandler);

// Update Finite State Automata
router.put("/:id", updateFSA as RequestHandler);

// Delete Finite State Automata
router.delete("/:id", deleteFSA as RequestHandler);

export const finiteStateAutomataRoutes = router;


