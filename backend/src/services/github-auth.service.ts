import crypto from "crypto";
import { getGitHubOAuthConfig } from "../config/github.config";

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
}

interface GitHubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

export interface GitHubAuthUserData {
  email: string;
  name: string;
  ssoId: string;
}

export const generateGitHubState = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateGitHubAuthorizationUrl = (state: string): string => {
  const config = getGitHubOAuthConfig();
  const url = new URL(config.authorizeUrl);

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);

  return url.toString();
};

const getGitHubHeaders = (accessToken?: string): HeadersInit => {
  const headers: HeadersInit = {
    Accept: "application/json",
    "User-Agent": "latex-code-generator",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
};

const getPrimaryEmail = (emails: GitHubEmailResponse[]): string | null => {
  const verifiedPrimaryEmail = emails.find(
    (emailEntry) => emailEntry.primary && emailEntry.verified
  );

  if (verifiedPrimaryEmail) {
    return verifiedPrimaryEmail.email;
  }

  const verifiedEmail = emails.find((emailEntry) => emailEntry.verified);
  return verifiedEmail?.email || null;
};

export const exchangeGitHubCodeForUser = async (
  code: string
): Promise<GitHubAuthUserData> => {
  const config = getGitHubOAuthConfig();

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: getGitHubHeaders(),
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange GitHub authorization code");
  }

  const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;

  if (!tokenData.access_token) {
    throw new Error("GitHub did not return an access token");
  }

  const userResponse = await fetch(config.userUrl, {
    headers: getGitHubHeaders(tokenData.access_token),
  });

  if (!userResponse.ok) {
    throw new Error("Failed to fetch GitHub user profile");
  }

  const userData = (await userResponse.json()) as GitHubUserResponse;
  let email = userData.email;

  if (!email) {
    const emailsResponse = await fetch(config.emailsUrl, {
      headers: getGitHubHeaders(tokenData.access_token),
    });

    if (!emailsResponse.ok) {
      throw new Error("Failed to fetch GitHub email addresses");
    }

    const emailData = (await emailsResponse.json()) as GitHubEmailResponse[];
    email = getPrimaryEmail(emailData);
  }

  if (!email) {
    throw new Error(
      "GitHub account does not have an accessible verified email address"
    );
  }

  return {
    email,
    name: userData.name || userData.login || email.split("@")[0],
    ssoId: String(userData.id),
  };
};
