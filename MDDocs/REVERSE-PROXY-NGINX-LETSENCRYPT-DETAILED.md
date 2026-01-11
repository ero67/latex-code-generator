# Reverse Proxy (Nginx) + Let’s Encrypt (Certbot) — Detailed Implementation Notes

This document explains **exactly what was added/changed in this repo** to support HTTPS using **Let’s Encrypt** on a VM, with **Nginx as the reverse proxy** and **Certbot** for certificate issuance/renewal.

The high-level idea is:
- Only **one container** (`reverse-proxy`) binds public ports **80** and **443**.
- Everything else (`frontend`, `backend`, etc.) is reachable **only inside the Docker network**.
- Let’s Encrypt HTTP-01 challenges are served by Nginx from a shared **webroot volume**.
- Certificates are stored in a shared **Let’s Encrypt config volume** and mounted read-only into Nginx.

---

## Architecture overview

### Request flow (normal HTTPS)

1. Browser hits `https://<DOMAIN>/...` on the VM
2. `reverse-proxy` (Nginx) terminates TLS using certs from `/etc/letsencrypt/live/<DOMAIN>/...`
3. Nginx routes:
   - `/` → `frontend` container (Nginx serving the built SPA)
   - `/api/...` → `backend` container (Node/Express on port `3001`)

### Request flow (Let’s Encrypt issuance/renewal)

1. Let’s Encrypt calls `http://<DOMAIN>/.well-known/acme-challenge/<token>`
2. Nginx serves files from `/var/www/certbot` (a shared volume)
3. `certbot` container writes the token file into that same shared volume
4. If validation succeeds, certbot writes certs into `/etc/letsencrypt` (another shared volume)

---

## Docker Compose changes (`docker-compose.yml`)

### `reverse-proxy` service

**Purpose**: Public ingress for the whole app; performs:
- TLS termination
- HTTP→HTTPS redirect (once cert exists)
- Reverse proxying to internal services

Key details:
- **Ports**:
  - `80:80` (required for ACME HTTP-01 validation)
  - `443:443` (HTTPS)
- **Environment**:
  - `DOMAIN=${DOMAIN}` — used for template substitution
- **Volumes**:
  - `./infra/nginx/templates:/etc/nginx/templates:ro`
    - Nginx config templates (HTTP bootstrap and HTTPS config)
  - `./infra/nginx/docker-entrypoint.d:/docker-entrypoint.d:ro`
    - A small startup script that selects the correct template
  - `certbot-www:/var/www/certbot:ro`
    - Read-only mount of the challenge webroot
  - `certbot-conf:/etc/letsencrypt:ro`
    - Read-only mount of certificates

### `certbot` and `certbot-renew` services

**Purpose**:
- `certbot`: one-off runner for initial issuance / manual operations
- `certbot-renew`: certificate renewal loop

Key details:
- Mounts the same volumes as Nginx, but **read/write**:
  - `certbot-www:/var/www/certbot`
  - `certbot-conf:/etc/letsencrypt`
- `certbot-renew` runs a lightweight loop:
  - `certbot renew --webroot -w /var/www/certbot --quiet`
  - sleeps 12 hours

Important note:
- After a cert is renewed, Nginx needs a reload/restart to pick up new cert files.
- The doc includes a simple reload command:
  - `docker compose exec -T reverse-proxy nginx -s reload`

### `frontend` service

**Purpose**: Serve the built SPA **internally**. This service does **not** publish ports.

- It uses the existing `new-frontend/Dockerfile` which builds the app and serves it with Nginx on port 80.
- Reverse proxy connects to it at `http://frontend:80`.

### `backend` service

**Purpose**: Node/Express API.

Key security improvement:
- The public port mapping `3001:3001` was removed (commented) so the backend is only reachable via reverse proxy at `/api/`.

---

## Nginx reverse proxy config

Nginx config is generated at container start from templates.

### File: `infra/nginx/docker-entrypoint.d/99-generate-conf.sh`

**Purpose**: Bootstrap logic so the proxy can start even before certs exist.

What it does:
- Requires `DOMAIN` env var
- Checks whether cert files exist:
  - `/etc/letsencrypt/live/${DOMAIN}/fullchain.pem`
  - `/etc/letsencrypt/live/${DOMAIN}/privkey.pem`
- Chooses one template:
  - If cert exists → writes HTTPS config to `/etc/nginx/conf.d/default.conf`
  - Otherwise → writes HTTP-only config to `/etc/nginx/conf.d/default.conf`
- Uses `envsubst '$DOMAIN'` to replace `${DOMAIN}` in the template

Why this exists:
- If Nginx is configured for TLS before certs exist, it fails to start.
- We want Nginx to always start on port 80, so certbot can complete the first issuance.

### File: `infra/nginx/templates/app-http.conf.template`

**Purpose**: HTTP-only “bootstrap” config used before certs exist.

What it serves:
- `/.well-known/acme-challenge/` from:
  - `root /var/www/certbot;`
- Proxies normal traffic (temporary) to:
  - `/` → `frontend`
  - `/api/` → `backend`

This lets you bring the site up quickly on HTTP while issuing certs.

### File: `infra/nginx/templates/app-https.conf.template`

**Purpose**: Full HTTPS config used once cert exists.

Behavior:
- **Port 80**:
  - serves ACME challenge path
  - redirects all other requests to HTTPS
- **Port 443**:
  - uses cert files from `/etc/letsencrypt/live/${DOMAIN}/...`
  - proxies:
    - `/` → `frontend:80`
    - `/api/` → `backend:3001`

---

## Volumes (cert storage)

### `certbot-www`

Used for:
- ACME HTTP-01 challenge files (tokens)

Mounted:
- Read-write in `certbot`
- Read-only in `reverse-proxy`

### `certbot-conf`

Used for:
- Let’s Encrypt certs and account data (`/etc/letsencrypt`)

Mounted:
- Read-write in `certbot`
- Read-only in `reverse-proxy`

This ensures Nginx can serve certs, but cannot accidentally modify them.

---

## Backend change: CORS (`backend/src/app.ts`)

Because the frontend will now be served from **HTTPS on your domain**, the backend must allow that origin.

What changed:
- Replaced the static `origin: [ ... ]` list with a function-based allowlist.
- Added `process.env.FRONTEND_URL` as an allowed origin.

How to set it:
- In `.env` on the VM:
  - `FRONTEND_URL=https://yourdomain.example`

Why this matters:
- Without it, browsers will block frontend → backend requests due to CORS when you move to HTTPS.

---

## Operational steps (how to use it on the VM)

See `MDDocs/HTTPS-LETSENCRYPT-DOCKER.md` for the exact commands, but the gist is:

1. Set DNS + open ports 80/443
2. Create `.env` with:
   - `DOMAIN`
   - `LETSENCRYPT_EMAIL`
   - `FRONTEND_URL=https://<DOMAIN>`
3. Start reverse proxy (HTTP bootstrap):
   - `docker compose up -d reverse-proxy`
4. Issue first cert via a one-off certbot run:
   - `docker compose run --rm certbot certonly --webroot ...`
5. Restart reverse proxy; it will detect certs and switch to HTTPS template:
   - `docker compose restart reverse-proxy`
6. Start the rest of the stack:
   - `docker compose up -d`

---

## Notes / limitations (current)

- **Automatic Nginx reload after renew**: certbot renewals happen automatically, but Nginx reload is manual unless you add cron or a hook.
- **Single domain only**: the templates assume one `${DOMAIN}`. If you want multiple domains/subdomains, we’ll extend templates.
- **No HSTS yet**: we can add `Strict-Transport-Security` after you confirm HTTPS is stable.


