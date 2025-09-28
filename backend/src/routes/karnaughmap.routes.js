"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.karnaughMapRoutes = void 0;
const express_1 = __importDefault(require("express"));
const karnaughmap_controller_1 = require("../controllers/karnaughmap.controller");
const router = express_1.default.Router();
// Create new Karnaugh map
router.post("/", karnaughmap_controller_1.saveKM);
// Get all Karnaugh maps
router.get("/", karnaughmap_controller_1.getAllKM);
// Get Karnaugh map by ID
router.get("/:id", karnaughmap_controller_1.getKMById);
// Update Karnaugh map
router.put("/:id", karnaughmap_controller_1.updateKM);
// Delete Karnaugh map
router.delete("/:id", karnaughmap_controller_1.deleteKM);
exports.karnaughMapRoutes = router;
