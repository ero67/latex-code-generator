"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteKM = exports.updateKM = exports.getKMById = exports.getAllKM = exports.saveKM = void 0;
const KarnaughMap_1 = require("../models/KarnaughMap");
const saveKM = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tableSize, cellValues, implicants, implicantCellIndexes, edgeImplicants, edgeImplicantCellIndexes, customVariablesAllowed, customVariablesValues, cornerImplicant, userId, } = req.body;
        // Create new Karnaugh map
        const karnaughMap = new KarnaughMap_1.KarnaughMap({
            tableSize,
            cellValues,
            implicants,
            implicantCellIndexes,
            edgeImplicants,
            edgeImplicantCellIndexes,
            customVariablesAllowed,
            customVariablesValues,
            cornerImplicant,
            userId,
        });
        yield karnaughMap.save();
        res.status(201).json({
            status: "success",
            data: karnaughMap,
        });
    }
    catch (error) {
        console.error("Error saving Karnaugh map:", error);
        res.status(500).json({
            status: "error",
            message: "Error saving Karnaugh map",
        });
    }
});
exports.saveKM = saveKM;
// Get all Karnaugh maps
const getAllKM = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.query;
    console.log(req.query);
    console.log("useridfrom request", userId);
    try {
        const filter = userId ? { userId } : {};
        const karnaughMaps = yield KarnaughMap_1.KarnaughMap.find(filter).sort({ createdAt: -1 });
        console.log(karnaughMaps);
        res.status(200).json({
            status: "success",
            results: karnaughMaps.length,
            data: karnaughMaps,
        });
    }
    catch (error) {
        console.error("Error fetching Karnaugh maps:", error);
        res.status(500).json({
            status: "error",
            message: "Error fetching Karnaugh maps",
        });
    }
});
exports.getAllKM = getAllKM;
const getKMById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const karnaughMap = yield KarnaughMap_1.KarnaughMap.findById(id);
        if (!karnaughMap) {
            return res.status(404).json({
                status: "error",
                message: "Karnaugh map not found",
            });
        }
        res.status(200).json({
            status: "success",
            data: karnaughMap,
        });
    }
    catch (error) {
        console.error("Error fetching Karnaugh map:", error);
        res.status(500).json({
            status: "error",
            message: "Error fetching Karnaugh map",
        });
    }
});
exports.getKMById = getKMById;
// Update Karnaugh map
const updateKM = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { tableSize, cellValues, implicants, implicantCellIndexes, edgeImplicants, edgeImplicantCellIndexes, userId, } = req.body;
        const updatedKarnaughMap = yield KarnaughMap_1.KarnaughMap.findByIdAndUpdate(id, {
            tableSize,
            cellValues,
            implicants,
            implicantCellIndexes,
            edgeImplicants,
            edgeImplicantCellIndexes,
            userId,
        }, { new: true, runValidators: true });
        if (!updatedKarnaughMap) {
            return res.status(404).json({
                status: "error",
                message: "Karnaugh map not found",
            });
        }
        res.status(200).json({
            status: "success",
            data: updatedKarnaughMap,
        });
    }
    catch (error) {
        console.error("Error updating Karnaugh map:", error);
        res.status(500).json({
            status: "error",
            message: "Error updating Karnaugh map",
        });
    }
});
exports.updateKM = updateKM;
// Delete Karnaugh map
const deleteKM = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deletedKarnaughMap = yield KarnaughMap_1.KarnaughMap.findByIdAndDelete(id);
        if (!deletedKarnaughMap) {
            return res.status(404).json({
                status: "error",
                message: "Karnaugh map not found",
            });
        }
        res.status(204).json({
            status: "success",
            data: null,
        });
    }
    catch (error) {
        console.error("Error deleting Karnaugh map:", error);
        res.status(500).json({
            status: "error",
            message: "Error deleting Karnaugh map",
        });
    }
});
exports.deleteKM = deleteKM;
