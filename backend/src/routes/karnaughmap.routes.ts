import express, { RequestHandler, Router } from "express";
import {
  saveKM,
  getAllKM,
  getKMById,
  updateKM,
  deleteKM,
} from "../controllers/karnaughmap.controller";

const router: Router = express.Router();

// Create new Karnaugh map
router.post("/", saveKM as RequestHandler);

// Get all Karnaugh maps
router.get("/", getAllKM as RequestHandler);

// Get Karnaugh map by ID
router.get("/:id", getKMById as RequestHandler);

// Update Karnaugh map
router.put("/:id", updateKM as RequestHandler);

// Delete Karnaugh map
router.delete("/:id", deleteKM as RequestHandler);

export const karnaughMapRoutes = router;
