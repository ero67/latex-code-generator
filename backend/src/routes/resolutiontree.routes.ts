import express, { RequestHandler, Router } from "express";
import {
  saveResolutionTree,
  getAllResolutionTrees,
  getResolutionTreeById,
  updateResolutionTree,
  deleteResolutionTree,
} from "../controllers/resolutiontree.controller";

const router: Router = express.Router();

router.post("/", saveResolutionTree as RequestHandler);
router.get("/", getAllResolutionTrees as RequestHandler);
router.get("/:id", getResolutionTreeById as RequestHandler);
router.put("/:id", updateResolutionTree as RequestHandler);
router.delete("/:id", deleteResolutionTree as RequestHandler);

export const resolutionTreeRoutes = router;

