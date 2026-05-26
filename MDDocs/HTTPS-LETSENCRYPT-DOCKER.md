# HTTPS (Let’s Encrypt) on the VM (Docker Compose + Nginx)

This repo is set up to run behind a **reverse-proxy** container (`reverse-proxy`) that:
- serves **HTTP :80** only for Let’s Encrypt challenges + redirects to HTTPS
- serves **HTTPS :443** and proxies:
  - `/` → `frontend`
  - `/api/` → `backend`

Certificates are obtained/renewed by the `certbot` container using the **webroot** challenge.

## Prerequisites

- **A/AAAA DNS record**: your domain must point to the VM’s public IP
- **Firewall / Security Group**: ports **80** and **443** must be open to the internet
- **Domain env var**: you must set `DOMAIN` on the VM for Nginx config templating

## 1) Set environment variables on the VM

Create or edit `.env` in the project root on the VM:

```bash
DOMAIN=yourdomain.example
LETSENCRYPT_EMAIL=you@example.com
FRONTEND_URL=https://yourdomain.example
```

Notes:
- `FRONTEND_URL` is used by the backend for CORS/redirects; keep it in sync.

## 2) First-time certificate issuance

Bring up the reverse-proxy on **port 80** so the ACME challenge can be served.
It will start in **HTTP-only mode** until a cert exists:

```bash
docker compose up -d reverse-proxy
```

Request the cert (replace values as needed):

```bash
docker compose run --rm \
  -e DOMAIN="$DOMAIN" \
  -e LETSENCRYPT_EMAIL="$LETSENCRYPT_EMAIL" \
  certbot certonly \
  --webroot -w /var/www/certbot \
  --email "$LETSENCRYPT_EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"
```

Then restart the proxy so it picks up the new files:

```bash
docker compose restart reverse-proxy
```

Now you can start the full stack:

```bash
docker compose up -d
```

## 3) Renewals

The `certbot-renew` service runs `certbot renew` every 12 hours.

After a renewal, Nginx needs to reload to pick up the updated cert files. Easiest option:

```bash
docker compose restart reverse-proxy
```

If you want this to happen automatically, you can add a host cron to reload nginx daily:

```bash
docker compose exec -T reverse-proxy nginx -s reload
```

## Troubleshooting

- **ACME challenge fails**:
  - Verify DNS points to the VM
  - Verify port 80 is reachable from the internet
  - Confirm `reverse-proxy` is running and serving `/.well-known/acme-challenge/`
- **Nginx won’t start on 443**:
  - Cert files don’t exist yet; do the first issuance step
  - Confirm `DOMAIN` matches the cert directory name in `/etc/letsencrypt/live/${DOMAIN}/`


