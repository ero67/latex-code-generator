export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizeUrl: string;
  tokenUrl: string;
  userUrl: string;
  emailsUrl: string;
  scope: string;
}

export const getGitHubOAuthConfig = (): GitHubOAuthConfig => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri =
    process.env.GITHUB_REDIRECT_URI ||
    "http://localhost:3001/api/auth/github/callback";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing required GitHub OAuth configuration. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables."
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userUrl: "https://api.github.com/user",
    emailsUrl: "https://api.github.com/user/emails",
    scope: process.env.GITHUB_SCOPES || "read:user user:email",
  };
};
