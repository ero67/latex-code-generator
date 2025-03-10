// karnaughmap.routes.ts
import express, { Router } from "express";
import {
  saveKM,
  getAllKM,
  getKMById,
  updateKM,
  deleteKM,
} from "../controllers/karnaughmap.controller";

const router: Router = express.Router();

// Create new Karnaugh map
router.post("/", saveKM);

// Get all Karnaugh maps
router.get("/", getAllKM);

// Get Karnaugh map by ID
router.get("/:id", getKMById);

export const karnaughMapRoutes = router;
