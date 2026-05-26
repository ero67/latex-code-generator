import { Request, Response } from "express";
import {
  exchangeGitHubCodeForUser,
  generateGitHubAuthorizationUrl,
  generateGitHubState,
} from "../services/github-auth.service";
import { User } from "../models/User";

const githubStateStore = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  for (const [state, expiresAt] of githubStateStore.entries()) {
    if (expiresAt < now) {
      githubStateStore.delete(state);
    }
  }
}, 10 * 60 * 1000);

export const initiateGitHubLogin = async (req: Request, res: Response) => {
  try {
    const state = generateGitHubState();
    githubStateStore.set(state, Date.now() + 10 * 60 * 1000);

    const authorizationUrl = generateGitHubAuthorizationUrl(state);
    res.redirect(authorizationUrl);
  } catch (error: any) {
    console.error("GitHub login initiation error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to initiate GitHub login",
      error: error.message,
    });
  }
};

export const handleGitHubCallback = async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(String(error))}`
      );
    }

    if (!code || !state) {
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent("Missing GitHub authorization data")}`
      );
    }

    const stateValue = String(state);
    const storedStateExpiry = githubStateStore.get(stateValue);

    if (!storedStateExpiry || storedStateExpiry < Date.now()) {
      githubStateStore.delete(stateValue);
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent("Invalid or expired GitHub login state. Please try again.")}`
      );
    }

    githubStateStore.delete(stateValue);

    const githubUser = await exchangeGitHubCodeForUser(String(code));
    const user = await User.findOrCreateFromSSO({
      email: githubUser.email,
      name: githubUser.name,
      ssoId: githubUser.ssoId,
      ssoProvider: "github",
    });

    const token = user.generateAuthToken();
    const userData = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      ssoId: user.ssoId,
      ssoProvider: user.ssoProvider,
      employeeType: user.employeeType,
    };

    const redirectUrl = `${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(userData))}`;
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error("GitHub callback error:", error);
    res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent(`GitHub authentication failed: ${error.message}`)}`
    );
  }
};
