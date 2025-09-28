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
exports.deleteProofTree = exports.updateProofTree = exports.getProofTreeById = exports.getAllProofTrees = exports.saveProofTree = void 0;
const ProofTree_1 = require("../models/ProofTree");
const saveProofTree = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, treeData, settings, userId } = req.body;
        // Create new Proof Tree
        const proofTree = new ProofTree_1.ProofTree({
            name,
            description,
            treeData,
            settings,
            userId,
        });
        yield proofTree.save();
        res.status(201).json({
            status: "success",
            data: proofTree,
        });
    }
    catch (error) {
        console.error("Error saving Proof Tree:", error);
        res.status(500).json({
            status: "error",
            message: "Error saving Proof Tree",
        });
    }
});
exports.saveProofTree = saveProofTree;
// Get all Proof Trees
const getAllProofTrees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.query;
    console.log(req.query);
    console.log("userId from request", userId);
    try {
        const filter = userId ? { userId } : {};
        const proofTrees = yield ProofTree_1.ProofTree.find(filter).sort({ createdAt: -1 });
        console.log(proofTrees);
        res.status(200).json({
            status: "success",
            results: proofTrees.length,
            data: proofTrees,
        });
    }
    catch (error) {
        console.error("Error fetching Proof Trees:", error);
        res.status(500).json({
            status: "error",
            message: "Error fetching Proof Trees",
        });
    }
});
exports.getAllProofTrees = getAllProofTrees;
const getProofTreeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const proofTree = yield ProofTree_1.ProofTree.findById(id);
        if (!proofTree) {
            return res.status(404).json({
                status: "error",
                message: "Proof Tree not found",
            });
        }
        res.status(200).json({
            status: "success",
            data: proofTree,
        });
    }
    catch (error) {
        console.error("Error fetching Proof Tree:", error);
        res.status(500).json({
            status: "error",
            message: "Error fetching Proof Tree",
        });
    }
});
exports.getProofTreeById = getProofTreeById;
// Update Proof Tree
const updateProofTree = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description, treeData, settings, userId } = req.body;
        const updatedProofTree = yield ProofTree_1.ProofTree.findByIdAndUpdate(id, {
            name,
            description,
            treeData,
            settings,
            userId,
            updatedAt: new Date(),
        }, { new: true, runValidators: true });
        if (!updatedProofTree) {
            return res.status(404).json({
                status: "error",
                message: "Proof Tree not found",
            });
        }
        res.status(200).json({
            status: "success",
            data: updatedProofTree,
        });
    }
    catch (error) {
        console.error("Error updating Proof Tree:", error);
        res.status(500).json({
            status: "error",
            message: "Error updating Proof Tree",
        });
    }
});
exports.updateProofTree = updateProofTree;
// Delete Proof Tree
const deleteProofTree = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deletedProofTree = yield ProofTree_1.ProofTree.findByIdAndDelete(id);
        if (!deletedProofTree) {
            return res.status(404).json({
                status: "error",
                message: "Proof Tree not found",
            });
        }
        res.status(204).json({
            status: "success",
            data: null,
        });
    }
    catch (error) {
        console.error("Error deleting Proof Tree:", error);
        res.status(500).json({
            status: "error",
            message: "Error deleting Proof Tree",
        });
    }
});
exports.deleteProofTree = deleteProofTree;
