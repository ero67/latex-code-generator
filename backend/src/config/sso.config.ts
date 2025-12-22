/**
 * SSO Configuration
 * Configuration for KPI Single Sign-On (OIDC)
 */

export interface SSOConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

/**
 * Get SSO configuration from environment variables
 */
export const getSSOConfig = (): SSOConfig => {
  const issuer = process.env.SSO_ISSUER;
  const clientId = process.env.SSO_CLIENT_ID;
  const clientSecret = process.env.SSO_CLIENT_SECRET;
  const redirectUri = process.env.SSO_REDIRECT_URI;
  // Ensure 'openid' scope is included (required for ID token in OpenID Connect)
  const defaultScopes = ["openid", "email", "profile", "employee_info"];
  const envScopes = process.env.SSO_SCOPES?.split(" ") || defaultScopes;
  const scopes = envScopes.includes("openid") ? envScopes : ["openid", ...envScopes];

  if (!issuer || !clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing required SSO configuration. Please set SSO_ISSUER, SSO_CLIENT_ID, SSO_CLIENT_SECRET, and SSO_REDIRECT_URI environment variables."
    );
  }

  return {
    issuer,
    clientId,
    clientSecret,
    redirectUri,
    scopes,
  };
};

/**
 * Default SSO configuration for testing environment
 * These values can be overridden by environment variables
 */
export const defaultSSOConfig: SSOConfig = {
  issuer: "https://sso2.kpi.fei.tuke.sk/realms/testing",
  clientId: "testing",
  clientSecret: "s49Y8cHbGA9aYj9c15lxMJIOcuU9wzfr",
  redirectUri: "http://localhost:3001/api/sso/callback",
  scopes: ["openid", "email", "profile", "employee_info"],
};

