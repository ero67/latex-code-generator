import express, { Router, RequestHandler } from "express";
import { initiateSSO, handleCallback } from "../controllers/sso.controller";

const router: Router = express.Router();

// Initiate SSO login - redirects to SSO provider
router.get("/login", initiateSSO as RequestHandler);

// Handle SSO callback - processes authorization code and creates/updates user
router.get("/callback", handleCallback as RequestHandler);

export const ssoRoutes = router;
