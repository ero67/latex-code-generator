import * as client from "openid-client";
import { getSSOConfig, SSOProvider } from "../config/sso.config";
import jwt from "jsonwebtoken";

const ssoConfigCache = new Map<SSOProvider, client.Configuration>();

/**
 * Initialize SSO configuration (lazy initialization)
 * This will discover the OIDC provider configuration
 */
export async function initializeSSOConfig(
  provider: SSOProvider
): Promise<client.Configuration> {
  const cachedConfig = ssoConfigCache.get(provider);
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const config = getSSOConfig(provider);

    // Discover the OIDC provider and create configuration
    const discoveredConfig = await client.discovery(
      new URL(config.issuer),
      config.clientId,
      config.clientSecret
    );

    ssoConfigCache.set(provider, discoveredConfig);
    return discoveredConfig;
  } catch (error: any) {
    console.error("Failed to initialize SSO configuration:", error);
    throw new Error(`SSO initialization failed: ${error.message}`);
  }
}

/**
 * Generate authorization URL for SSO login
 * Returns the URL and a state token for CSRF protection
 */
export async function generateAuthorizationUrl(provider: SSOProvider): Promise<{
  url: string;
  state: string;
  codeVerifier: string;
}> {
  try {
    const config = await initializeSSOConfig(provider);
    const ssoConfig = getSSOConfig(provider);

    // Generate PKCE code verifier and challenge
    const codeVerifier: string = client.randomPKCECodeVerifier();
    const codeChallenge: string = await client.calculatePKCECodeChallenge(codeVerifier);

    // Generate state for CSRF protection
    // Always generate state for additional security, even if PKCE is supported
    const state: string = client.randomState();

    // Build authorization URL parameters
    // Ensure 'openid' scope is included (required for ID token)
    const scopes = ssoConfig.scopes.includes("openid") 
      ? ssoConfig.scopes 
      : ["openid", ...ssoConfig.scopes];
    
    const parameters: Record<string, string> = {
      redirect_uri: ssoConfig.redirectUri,
      scope: scopes.join(" "),
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
    };

    // Build authorization URL
    const redirectTo: URL = client.buildAuthorizationUrl(config, parameters);

    return {
      url: redirectTo.href,
      state,
      codeVerifier,
    };
  } catch (error: any) {
    console.error("Failed to generate authorization URL:", error);
    throw new Error(`Failed to generate SSO authorization URL: ${error.message}`);
  }
}

/**
 * Process SSO callback - exchange authorization code for tokens
 */
export async function processCallback(
  provider: SSOProvider,
  callbackUrl: URL,
  storedState: string,
  codeVerifier: string
): Promise<{
  tokens: client.TokenEndpointResponse;
  userInfo: any;
}> {
  try {
    const config = await initializeSSOConfig(provider);

    // Exchange authorization code for tokens
    const tokens: client.TokenEndpointResponse = await client.authorizationCodeGrant(
      config,
      callbackUrl,
      {
        pkceCodeVerifier: codeVerifier,
        expectedState: storedState || undefined,
      }
    );

    // Get user information from ID token (preferred) or userinfo endpoint
    let userInfo: any = null;

    // First, try to decode ID token (faster and doesn't require userinfo endpoint)
    if (tokens.id_token) {
      try {
        const idTokenString = typeof tokens.id_token === 'string' 
          ? tokens.id_token 
          : String(tokens.id_token);
        
        // Decode ID token without verification (we trust the SSO provider)
        // In production, you might want to verify the signature
        const decoded = jwt.decode(idTokenString, { complete: false });
        
        if (decoded && typeof decoded === 'object') {
          userInfo = decoded;
        }
      } catch (idTokenError) {
        console.error("Failed to decode ID token:", idTokenError);
      }
    }

    // Fallback to userinfo endpoint if ID token doesn't have required info
    if (!userInfo || !userInfo.email) {
      try {
        const userinfoEndpoint = config.serverMetadata().userinfo_endpoint;
        if (userinfoEndpoint && tokens.access_token) {
          const userInfoResponse = await fetch(userinfoEndpoint, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              Accept: "application/json",
            },
          });

          if (userInfoResponse.ok) {
            const fetchedUserInfo = await userInfoResponse.json();
            // Merge with ID token claims if available
            userInfo = { ...userInfo, ...fetchedUserInfo };
          } else {
            const errorText = await userInfoResponse.text();
            // If we have ID token claims, use them even if userinfo fails
            if (!userInfo) {
              throw new Error(`Failed to fetch user info: ${userInfoResponse.status} ${userInfoResponse.statusText}`);
            }
          }
        }
      } catch (userInfoError) {
        // If we have ID token claims, use them even if userinfo fails
        if (!userInfo) {
          throw new Error("Failed to get user information from both ID token and userinfo endpoint");
        }
      }
    }

    if (!userInfo) {
      throw new Error("No user information available from ID token or userinfo endpoint");
    }

    return {
      tokens,
      userInfo,
    };
  } catch (error: any) {
    console.error("Failed to process SSO callback:", error);
    throw new Error(`SSO callback processing failed: ${error.message}`);
  }
}

/**
 * Map SSO user info to our user model format
 */
export interface SSOUserData {
  email: string;
  name: string;
  ssoId: string; // preferred_username
  fullName?: string;
  givenName?: string;
  familyName?: string;
  employeeType?: string; // S, D, P, N
}

export function mapSSOUserInfo(
  provider: SSOProvider,
  userInfo: any
): SSOUserData {
  if (provider === "google") {
    return {
      email: userInfo.email as string,
      name: (userInfo.name as string) || "",
      ssoId: (userInfo.sub as string) || "",
      givenName: userInfo.given_name as string | undefined,
      familyName: userInfo.family_name as string | undefined,
    };
  }

  return {
    email: userInfo.email as string,
    name: (userInfo.name as string) || (userInfo.full_name as string) || "",
    ssoId: (userInfo.preferred_username as string) || "",
    fullName: userInfo.full_name as string | undefined,
    givenName: userInfo.given_name as string | undefined,
    familyName: userInfo.family_name as string | undefined,
    employeeType: userInfo.employee_type as string | undefined,
  };
}
