# BYOK (OpenRouter) Implementation

This document describes the BYOK (Bring Your Own Key) feature for OpenRouter
from a technical perspective, including encryption, API flows, and security
considerations.

## Overview

When BYOK is enabled by an admin, Image to LaTeX and OpenRouter model access
require authenticated users to supply their own OpenRouter API key. The key is
encrypted server-side and never stored in plaintext.

Key behaviors:

- BYOK enabled: Image to LaTeX is auth-only, user must have a saved key.
- BYOK disabled: Image to LaTeX uses server env key (`OPENROUTER_API_KEY`).

## Architecture Diagram

```
User Browser
  |  (HTTPS)
  v
Frontend (React)
  |  /api/settings/public + /api/byok
  v
Backend (Express)
  |  load AppSettings
  |  decrypt user key (AES-256-GCM)
  v
OpenRouter API
```

## Environment Variables

- `BYOK_ENCRYPTION_KEY` (required for BYOK)
  - Base64-encoded 32-byte key.
  - Used for AES-256-GCM encryption of user keys.

Example generation:

```bash
openssl rand -base64 32
```

## Data Model

### User

Stored on `User` with fields excluded from default queries (`select: false`).

- `openRouterKeyCiphertext`
- `openRouterKeyIv`
- `openRouterKeyTag`
- `openRouterKeyLast4`
- `openRouterKeyUpdatedAt`

### AppSettings

Single document used for global BYOK toggle.

- `byokEnabled` (boolean)
- `byokProvider` (string, currently "openrouter")

## Encryption

Location: `backend/src/utils/encryption.ts`

- Algorithm: AES-256-GCM
- IV length: 12 bytes (random per encryption)
- Authentication tag stored alongside ciphertext
- Key is loaded from `BYOK_ENCRYPTION_KEY` (base64, 32 bytes)

Encryption flow:

1. Generate IV (12 bytes).
2. Encrypt with AES-256-GCM using key + IV.
3. Store `ciphertext`, `iv`, `tag` (base64-encoded).

Decryption flow:

1. Decode base64 values.
2. Decrypt using AES-256-GCM with stored IV + tag.

## Backend API

### BYOK endpoints (auth required)

- `GET /api/byok`
  - Response: `{ configured, last4, updatedAt }`
- `PUT /api/byok`
  - Body: `{ apiKey }`
  - Stores encrypted key.
- `DELETE /api/byok`
  - Removes key fields.

### Settings endpoints

- `GET /api/settings/public`
  - Response: `{ byokEnabled, byokProvider }`
- `GET /api/settings` (admin)
  - Full settings document.
- `PATCH /api/settings` (admin)
  - Update `byokEnabled` and `byokProvider`.

## Request Flow

### Image to LaTeX

Route: `POST /api/imagetolatex/generate`

- Auth required (always).
- If BYOK enabled:
  - Load user encrypted key.
  - Decrypt and pass as OpenRouter API key.
  - Reject if missing.
- If BYOK disabled:
  - Use `OPENROUTER_API_KEY` from env.

### Model listing

Route: `GET /api/models`

- Auth required (aligned with BYOK auth-only experience).

## Frontend Integration

### BYOK key management

Location: `new-frontend/src/Pages/UserProfile.jsx`

- Shows status (configured or not)
- Saves/removes key via `/api/byok`
- Link to tutorial page

### Tutorial page

Location: `new-frontend/src/Pages/ByokTutorial.jsx`

- Short guide to create a key in OpenRouter
- Links to `https://openrouter.ai` and `https://openrouter.ai/keys`

### Image to LaTeX guardrails

Location: `new-frontend/src/Pages/ImageToLatex/ImageToLatex.jsx`

- Fetches `settings/public` and `byok` status
- If BYOK enabled and no key:
  - Disable upload/inputs/submit
  - Show warning with links to profile and tutorial

## Security Notes

- Keys are encrypted server-side only; no plaintext storage.
- Keys are never logged.
- HTTPS/TLS is required in production to protect keys in transit.
- Client-side encryption is not required when TLS is present.
- Protect against XSS; any client-side compromise could read user input.

## Rotation Guidance

If `BYOK_ENCRYPTION_KEY` changes, previously stored keys become undecryptable.
To rotate safely:

1. Decrypt existing keys with old key.
2. Re-encrypt with new key.
3. Update `BYOK_ENCRYPTION_KEY`.

## Files Touched

Backend:

- `backend/src/utils/encryption.ts`
- `backend/src/models/User.ts`
- `backend/src/models/AppSettings.ts`
- `backend/src/controllers/byok.controller.ts`
- `backend/src/controllers/settings.controller.ts`
- `backend/src/controllers/imagetolatex.controller.ts`
- `backend/src/controllers/benchmark.controller.ts`
- `backend/src/routes/byok.routes.ts`
- `backend/src/routes/settings.routes.ts`
- `backend/src/routes/imagetolatex.routes.ts`
- `backend/src/routes/models.routes.ts`
- `backend/src/services/openrouter.service.ts`

Frontend:

- `new-frontend/src/services/byok.service.js`
- `new-frontend/src/services/settings.service.js`
- `new-frontend/src/services/image.service.js`
- `new-frontend/src/services/model.service.js`
- `new-frontend/src/Pages/UserProfile.jsx`
- `new-frontend/src/Pages/ByokTutorial.jsx`
- `new-frontend/src/Pages/ImageToLatex/ImageToLatex.jsx`
- `new-frontend/src/App.jsx`
