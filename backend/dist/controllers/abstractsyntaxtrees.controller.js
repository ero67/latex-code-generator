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
exports.deleteAST = exports.updateAST = exports.getASTById = exports.getAllAST = exports.saveAST = void 0;
const AbstractSyntaxTree_1 = require("../models/AbstractSyntaxTree");
const saveAST = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, treeData, settings, userId, } = req.body;
        // Create new Abstract Syntax Tree
        const abstractSyntaxTree = new AbstractSyntaxTree_1.AbstractSyntaxTree({
            name,
            description,
            treeData,
            settings,
            userId,
        });
        yield abstractSyntaxTree.save();
        res.status(201).json({
            status: "success",
            data: abstractSyntaxTree,
        });
    }
    catch (error) {
        console.error("Error saving Abstract Syntax Tree:", error);
        res.status(500).json({
            status: "error",
            message: "Error saving Abstract Syntax Tree",
        });
    }
});
exports.saveAST = saveAST;
// Get all Abstract Syntax Trees
const getAllAST = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.query;
    console.log(req.query);
    console.log("userId from request", userId);
    try {
        const filter = userId ? { userId } : {};
        const abstractSyntaxTrees = yield AbstractSyntaxTree_1.AbstractSyntaxTree.find(filter).sort({ createdAt: -1 });
        console.log(abstractSyntaxTrees);
        res.status(200).json({
            status: "success",
            results: abstractSyntaxTrees.length,
            data: abstractSyntaxTrees,
        });
    }
    catch (error) {
        console.error("Error fetching Abstract Syntax Trees:", error);
        res.status(500).json({
            status: "error",
            message: "Error fetching Abstract Syntax Trees",
        });
    }
});
exports.getAllAST = getAllAST;
const getASTById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const abstractSyntaxTree = yield AbstractSyntaxTree_1.AbstractSyntaxTree.findById(id);
        if (!abstractSyntaxTree) {
            return res.status(404).json({
                status: "error",
                message: "Abstract Syntax Tree not found",
            });
        }
        res.status(200).json({
            status: "success",
            data: abstractSyntaxTree,
        });
    }
    catch (error) {
        console.error("Error fetching Abstract Syntax Tree:", error);
        res.status(500).json({
            status: "error",
            message: "Error fetching Abstract Syntax Tree",
        });
    }
});
exports.getASTById = getASTById;
// Update Abstract Syntax Tree
const updateAST = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description, treeData, settings, userId, } = req.body;
        const updatedAbstractSyntaxTree = yield AbstractSyntaxTree_1.AbstractSyntaxTree.findByIdAndUpdate(id, {
            name,
            description,
            treeData,
            settings,
            userId,
            updatedAt: new Date()
        }, { new: true, runValidators: true });
        if (!updatedAbstractSyntaxTree) {
            return res.status(404).json({
                status: "error",
                message: "Abstract Syntax Tree not found",
            });
        }
        res.status(200).json({
            status: "success",
            data: updatedAbstractSyntaxTree,
        });
    }
    catch (error) {
        console.error("Error updating Abstract Syntax Tree:", error);
        res.status(500).json({
            status: "error",
            message: "Error updating Abstract Syntax Tree",
        });
    }
});
exports.updateAST = updateAST;
// Delete Abstract Syntax Tree
const deleteAST = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deletedAbstractSyntaxTree = yield AbstractSyntaxTree_1.AbstractSyntaxTree.findByIdAndDelete(id);
        if (!deletedAbstractSyntaxTree) {
            return res.status(404).json({
                status: "error",
                message: "Abstract Syntax Tree not found",
            });
        }
        res.status(204).json({
            status: "success",
            data: null,
        });
    }
    catch (error) {
        console.error("Error deleting Abstract Syntax Tree:", error);
        res.status(500).json({
            status: "error",
            message: "Error deleting Abstract Syntax Tree",
        });
    }
});
exports.deleteAST = deleteAST;
