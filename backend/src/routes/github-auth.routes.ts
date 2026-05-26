import express, { Router, RequestHandler } from "express";
import {
  handleGitHubCallback,
  initiateGitHubLogin,
} from "../controllers/github-auth.controller";

const router: Router = express.Router();

router.get("/github/login", initiateGitHubLogin as RequestHandler);
router.get("/github/callback", handleGitHubCallback as RequestHandler);

export const githubAuthRoutes = router;
