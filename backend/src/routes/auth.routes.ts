// auth.routes.ts
import express, { Router, RequestHandler } from "express";
import { register, login, saveKM } from "../controllers/auth.controller";

const router: Router = express.Router();

// Use Express's RequestHandler type
router.post("/register", register as RequestHandler);
router.post("/login", login as RequestHandler);


export const authRoutes = router;
