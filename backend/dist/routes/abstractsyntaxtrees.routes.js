"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.abstractSyntaxTreeRoutes = void 0;
// routes/abstractSyntaxTree.routes.ts
const express_1 = __importDefault(require("express"));
const abstractsyntaxtrees_controller_1 = require("../controllers/abstractsyntaxtrees.controller");
const router = express_1.default.Router();
// Create new Abstract Syntax Tree
router.post("/", abstractsyntaxtrees_controller_1.saveAST);
// Get all Abstract Syntax Trees
router.get("/", abstractsyntaxtrees_controller_1.getAllAST);
// Get Abstract Syntax Tree by ID
router.get("/:id", abstractsyntaxtrees_controller_1.getASTById);
// Update Abstract Syntax Tree
router.put("/:id", abstractsyntaxtrees_controller_1.updateAST);
// Delete Abstract Syntax Tree
router.delete("/:id", abstractsyntaxtrees_controller_1.deleteAST);
exports.abstractSyntaxTreeRoutes = router;
