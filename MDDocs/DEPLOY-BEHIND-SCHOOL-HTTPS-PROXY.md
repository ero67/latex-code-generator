# Deploy behind a school/university HTTPS reverse proxy (TLS already handled upstream)

If your school provides a domain like `latexgenerator.kpi.fei.tuke.sk` that already serves **HTTPS**, they likely configured an **upstream reverse proxy** (on the university side) that:
- terminates TLS (HTTPS certificate is managed by the school)
- forwards requests to your VM over plain HTTP (usually port **80**)

When visiting `https://latexgenerator.kpi.fei.tuke.sk/` shows the default “Welcome to nginx” page, it means:
- the upstream proxy is reaching your VM successfully, but
- your VM is currently serving the default Nginx site, not your app.

## Should you delete the Nginx+Certbot setup we added?

- **You can likely skip Let’s Encrypt / certbot** in this scenario (because the school proxy already provides HTTPS).
- But you still need **some HTTP service on the VM** to serve your app and route `/api/` to your backend.
  - The simplest is to keep **our `reverse-proxy` container**, but run it as an **HTTP-only** reverse proxy behind the school’s HTTPS proxy.

## What to ask your school (so we can configure correctly)

Ask what the university proxy forwards to:
- **Target IP**: `147.232.205.53` (your VM)
- **Target port**: usually **80**
- Any path rules: do they forward all paths (`/`) or only a prefix?

If they forward **all paths** to `http://<VM_IP>:80`, then your VM must serve:
- `/` → frontend
- `/api/...` → backend

## Why you see “Welcome to nginx”

Typically one of these is true:
- A host-level Nginx is installed/enabled on the VM and serving its default site.
- Or a container is bound to port 80, but it’s serving a default Nginx config.
- Or your Docker reverse-proxy isn’t running / not in the directory with `docker-compose.yml`.

## Checks on the VM

Run these **on the VM**:

### 1) Ensure you’re in the repo root

```bash
cd ~/latex-code-generator
ls docker-compose.yml
```

### 2) See what’s bound to port 80

```bash
sudo ss -lntp | grep ':80'
```

### 3) Check Docker containers

```bash
docker compose ps
docker compose logs --tail=80 reverse-proxy
```

### 4) If host Nginx is installed, see if it’s running

```bash
sudo systemctl status nginx
```

If it is running and you want Docker to own port 80, stop it:

```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

## Minimal “behind upstream HTTPS proxy” runtime

In this model, you generally want the VM to serve **HTTP only**.

### Backend CORS

Set in `.env` on the VM:

```bash
FRONTEND_URL=https://latexgenerator.kpi.fei.tuke.sk
```

This ensures browser requests from the new HTTPS domain are allowed by CORS.

### Start the stack

```bash
cd ~/latex-code-generator
docker compose up -d
```

## Note about Let’s Encrypt

If the school proxy is the one serving HTTPS publicly, you usually **do not need**:
- opening public port 80 on your VM to the whole internet
- Let’s Encrypt HTTP-01 validation
- certbot on your VM

But you *do* need the school proxy to be able to reach your VM (likely over the university network).


