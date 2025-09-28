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
exports.saveKM = exports.login = exports.register = void 0;
const User_1 = require("../models/User");
const KarnaughMap_1 = require("../models/KarnaughMap");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name } = req.body;
        // Check if user already exists
        const existingUser = yield User_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: "error",
                message: "Email already registered",
            });
        }
        // Create new user
        const user = new User_1.User({
            email,
            password,
            name,
        });
        yield user.save();
        // Generate token
        const token = user.generateAuthToken();
        res.status(201).json({
            status: "success",
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                },
                token,
            },
        });
    }
    catch (error) {
        console.error("Detailed registration error:", error);
        res.status(500).json({
            status: "error",
            message: "Error creating user",
        });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Find user
        const user = yield User_1.User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                status: "error",
                message: "Invalid credentials",
            });
        }
        // Check password
        const isMatch = yield user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                status: "error",
                message: "Invalid credentials",
            });
        }
        // Generate token
        const token = user.generateAuthToken();
        res.json({
            status: "success",
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                },
                token,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error logging in",
        });
    }
});
exports.login = login;
const saveKM = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tableSize, cellValues, implicants, edgeImplicants } = req.body;
        // Create new Karnaugh map
        const karnaughMap = new KarnaughMap_1.KarnaughMap({
            tableSize,
            cellValues,
            implicants,
            edgeImplicants,
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
