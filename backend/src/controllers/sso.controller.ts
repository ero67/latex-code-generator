import { Request, Response } from "express";
import {
  generateAuthorizationUrl,
  processCallback,
  mapSSOUserInfo,
} from "../services/sso.service";
import { User } from "../models/User";
import {
  getSSOConfig,
  isSSOProvider,
  SSOProvider,
} from "../config/sso.config";

// In-memory store for SSO state (in production, use Redis or database)
// Key: state token, Value: { codeVerifier, expiresAt }
const ssoStateStore = new Map<
  string,
  { provider: SSOProvider; codeVerifier: string; expiresAt: number }
>();

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of ssoStateStore.entries()) {
    if (data.expiresAt < now) {
      ssoStateStore.delete(state);
    }
  }
}, 10 * 60 * 1000);

/**
 * Initiate SSO login
 * Generates authorization URL and redirects user to SSO provider
 */
export const initiateSSO = async (req: Request, res: Response) => {
  try {
    const providerValue = req.params.provider;
    const providerParam = Array.isArray(providerValue)
      ? providerValue[0] || "kpi"
      : providerValue || "kpi";
    if (!isSSOProvider(providerParam)) {
      return res.status(400).json({
        status: "error",
        message: `Unsupported SSO provider: ${providerParam}`,
      });
    }

    const { url, state, codeVerifier } = await generateAuthorizationUrl(providerParam);

    // Store state and code verifier for callback verification
    // State expires in 10 minutes
    ssoStateStore.set(state, {
      provider: providerParam,
      codeVerifier,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Redirect user to SSO provider
    res.redirect(url);
  } catch (error: any) {
    console.error("SSO initiation error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to initiate SSO login",
      error: error.message,
    });
  }
};

/**
 * Handle SSO callback
 * Processes the authorization code and creates/updates user
 */
export const handleCallback = async (req: Request, res: Response) => {
  try {
    const providerValue = req.params.provider;
    const providerParam = Array.isArray(providerValue)
      ? providerValue[0] || "kpi"
      : providerValue || "kpi";
    if (!isSSOProvider(providerParam)) {
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login?error=${encodeURIComponent(`Unsupported SSO provider: ${providerParam}`)}`
      );
    }

    const { code, state, error, error_description } = req.query;

    // Check for errors from SSO provider
    if (error) {
      console.error("SSO provider error:", error, error_description);
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login?error=${encodeURIComponent(
          (error_description as string) || (error as string)
        )}`
      );
    }

    if (!code) {
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login?error=${encodeURIComponent("Missing authorization code")}`
      );
    }

    const stateParam = (state as string) || "";

    // Retrieve stored state
    const storedState = stateParam ? ssoStateStore.get(stateParam) : null;

    // State is required for security
    if (!stateParam || !storedState) {
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login?error=${encodeURIComponent(
          "Invalid or expired state. Please try again."
        )}`
      );
    }

    if (storedState.provider !== providerParam) {
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login?error=${encodeURIComponent(
          "Invalid provider for this authentication session. Please try again."
        )}`
      );
    }

    // Remove state from store (one-time use)
    ssoStateStore.delete(stateParam);

    // IMPORTANT:
    // Do NOT build callback URL from req.protocol/host. Behind reverse proxies,
    // Express can see the internal scheme/host (often http), which causes a
    // redirect_uri mismatch during the token exchange.
    // Always use the configured redirect URI (must match the provider registration),
    // and attach the query params from the incoming request.
    const { redirectUri } = getSSOConfig(providerParam);
    const callbackUrl = new URL(redirectUri);
    for (const [k, v] of Object.entries(req.query)) {
      if (Array.isArray(v)) {
        // Preserve multi-values (rare)
        v.forEach((vv) => callbackUrl.searchParams.append(k, String(vv)));
      } else if (v !== undefined) {
        callbackUrl.searchParams.set(k, String(v));
      }
    }

    // Get code verifier from stored state
    const codeVerifier = storedState.codeVerifier;

    // Process callback and get user info
    const { tokens, userInfo } = await processCallback(
      providerParam,
      callbackUrl,
      stateParam,
      codeVerifier
    );

    // Map SSO user info to our format
    const ssoUserData = mapSSOUserInfo(providerParam, userInfo);

    // Get SSO provider name from config
    const config = getSSOConfig(providerParam);
    const ssoProvider =
      providerParam === "google"
        ? "google"
        : config.issuer.includes("testing")
          ? "kpi-testing"
          : "kpi-production";

    // Find or create user
    const user = await User.findOrCreateFromSSO({
      email: ssoUserData.email,
      name: ssoUserData.name,
      ssoId: ssoUserData.ssoId,
      ssoProvider,
      employeeType: ssoUserData.employeeType,
    });

    // Generate JWT token
    const token = user.generateAuthToken();

    // Redirect to frontend with token
    // Option 1: Token in query parameter (simple, but less secure)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    // Create user object for frontend
    const userData = {
      // Mongoose typings can expose `_id` as `unknown` depending on version/generics.
      // `String(...)` safely normalizes it to a string without unsafe casting.
      id: String(user._id),
      email: user.email,
      name: user.name,
      ssoId: user.ssoId,
      ssoProvider: user.ssoProvider,
      employeeType: user.employeeType,
    };

    // Encode both token and user data properly
    const tokenParam = encodeURIComponent(token);
    const userParam = encodeURIComponent(JSON.stringify(userData));

    const redirectUrl = `${frontendUrl}/auth/callback?token=${tokenParam}&user=${userParam}`;

    // Redirecting to frontend with token and user data
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error("SSO callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent(
        `SSO authentication failed: ${error.message}`
      )}`
    );
  }
};
