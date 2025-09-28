"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proofTreeRoutes = void 0;
const express_1 = __importDefault(require("express"));
const prooftree_controller_1 = require("../controllers/prooftree.controller");
const router = express_1.default.Router();
// Create new Proof Tree
router.post("/", prooftree_controller_1.saveProofTree);
// Get all Proof Trees
router.get("/", prooftree_controller_1.getAllProofTrees);
// Get Proof Tree by ID
router.get("/:id", prooftree_controller_1.getProofTreeById);
// Update Proof Tree
router.put("/:id", prooftree_controller_1.updateProofTree);
// Delete Proof Tree
router.delete("/:id", prooftree_controller_1.deleteProofTree);
exports.proofTreeRoutes = router;
