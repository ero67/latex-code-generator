import express, { Router, RequestHandler } from "express";
import { initiateSSO, handleCallback } from "../controllers/sso.controller";

const router: Router = express.Router();

// Backward-compatible KPI routes
router.get("/login", initiateSSO as RequestHandler);
router.get("/callback", handleCallback as RequestHandler);

// Provider-specific SSO routes
router.get("/:provider/login", initiateSSO as RequestHandler);
router.get("/:provider/callback", handleCallback as RequestHandler);

export const ssoRoutes = router;
