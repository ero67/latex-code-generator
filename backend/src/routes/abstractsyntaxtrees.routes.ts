// routes/abstractSyntaxTree.routes.ts
import express, { RequestHandler, Router } from "express";
import {
  saveAST,
  getAllAST,
  getASTById,
  updateAST,
  deleteAST,
} from "../controllers/abstractsyntaxtrees.controller";

const router: Router = express.Router();

// Create new Abstract Syntax Tree
router.post("/", saveAST as RequestHandler);

// Get all Abstract Syntax Trees
router.get("/", getAllAST as RequestHandler);

// Get Abstract Syntax Tree by ID
router.get("/:id", getASTById as RequestHandler);

// Update Abstract Syntax Tree
router.put("/:id", updateAST as RequestHandler);

// Delete Abstract Syntax Tree
router.delete("/:id", deleteAST as RequestHandler);

export const abstractSyntaxTreeRoutes = router;
