// karnaughmap.routes.ts
import express from "express";
import {
  saveKM,
  getAllKM,
  getKMById,
  updateKM,
  deleteKM,
} from "../controllers/karnaughmap.controller";

const router = express.Router();

// Create new Karnaugh map
router.post("/", saveKM);

// Get all Karnaugh maps
router.get("/", getAllKM);

export const karnaughMapRoutes = router;
