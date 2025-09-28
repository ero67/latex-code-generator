"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Updated app.ts (add this route)
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const auth_routes_1 = require("./routes/auth.routes");
const karnaughmap_routes_1 = require("./routes/karnaughmap.routes");
const abstractsyntaxtrees_routes_1 = require("./routes/abstractsyntaxtrees.routes");
const prooftree_routes_1 = require("./routes/prooftree.routes");
// Initialize express
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)()); // Allow cross-origin requests
app.use(express_1.default.json()); // Parse JSON bodies
app.use((0, morgan_1.default)("dev")); // HTTP request logger
// Routes
app.use("/api/auth", auth_routes_1.authRoutes);
app.use("/api/karnaughmap", karnaughmap_routes_1.karnaughMapRoutes);
app.use("/api/ast", abstractsyntaxtrees_routes_1.abstractSyntaxTreeRoutes);
app.use("/api/prooftree", prooftree_routes_1.proofTreeRoutes);
// Basic error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: "error",
        message: "Something broke!",
    });
});
exports.default = app;
