export const SUPPORTED_SSO_PROVIDERS = ["kpi", "google"] as const;

export type SSOProvider = (typeof SUPPORTED_SSO_PROVIDERS)[number];

export interface SSOConfig {
  provider: SSOProvider;
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

const ensureOpenIdScope = (scopes: string[]): string[] => {
  const normalizedScopes = scopes.filter(Boolean);
  return normalizedScopes.includes("openid")
    ? normalizedScopes
    : ["openid", ...normalizedScopes];
};

const getGoogleRedirectUri = () => {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3001/api/sso/google/callback"
  );
};

export const isSSOProvider = (value: string): value is SSOProvider => {
  return SUPPORTED_SSO_PROVIDERS.includes(value as SSOProvider);
};

export const getSSOConfig = (provider: SSOProvider): SSOConfig => {
  if (provider === "google") {
    const issuer = process.env.GOOGLE_ISSUER || "https://accounts.google.com";
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getGoogleRedirectUri();
    const scopes = ensureOpenIdScope(
      (process.env.GOOGLE_SCOPES?.split(" ") || ["openid", "email", "profile"])
        .map((scope) => scope.trim())
    );

    if (!clientId || !clientSecret) {
      throw new Error(
        "Missing required Google SSO configuration. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables."
      );
    }

    return {
      provider,
      issuer,
      clientId,
      clientSecret,
      redirectUri,
      scopes,
    };
  }

  const issuer = process.env.SSO_ISSUER;
  const clientId = process.env.SSO_CLIENT_ID;
  const clientSecret = process.env.SSO_CLIENT_SECRET;
  const redirectUri =
    process.env.SSO_REDIRECT_URI || "http://localhost:3001/api/sso/kpi/callback";
  const scopes = ensureOpenIdScope(
    (process.env.SSO_SCOPES?.split(" ") || [
      "openid",
      "email",
      "profile",
      "employee_info",
    ]).map((scope) => scope.trim())
  );

  if (!issuer || !clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing required KPI SSO configuration. Please set SSO_ISSUER, SSO_CLIENT_ID, SSO_CLIENT_SECRET, and SSO_REDIRECT_URI environment variables."
    );
  }

  return {
    provider,
    issuer,
    clientId,
    clientSecret,
    redirectUri,
    scopes,
  };
};
