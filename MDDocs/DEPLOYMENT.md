# Deployment Guide

## Deployment Script

### `deploy.sh`
Main deployment script that pulls latest changes, rebuilds services, and restarts containers.

**Usage:**
```bash
./deploy.sh                    # Rebuilds all services (backend, frontend, latex-compiler, python-preprocess)
./deploy.sh backend            # Rebuilds only backend
./deploy.sh backend frontend   # Rebuilds backend and frontend
```

**Features:**
- Git pull latest changes
- Environment file check
- Rebuilds specified services (without stopping them first)
- Health checks
- Service status display

**What it does:**
1. Pulls latest changes from Git
2. Checks for .env file
3. Rebuilds specified services (with --no-cache)
4. Restarts services (docker-compose up -d)
5. Shows service status

## Manual Deployment Steps

If you prefer to deploy manually:

```bash
# 1. Pull latest changes
git pull

# 2. Rebuild specific service
docker-compose build --no-cache backend
docker-compose build --no-cache frontend
docker-compose build --no-cache latex-compiler
docker-compose build --no-cache python-preprocess

# 3. Restart services
docker-compose up -d

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f backend
```

## Service-Specific Deployment

### Backend Only
```bash
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Frontend Only
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### LaTeX Compiler Only
```bash
docker-compose build --no-cache latex-compiler
docker-compose up -d latex-compiler
```

### Python Preprocess Only
```bash
docker-compose build --no-cache python-preprocess
docker-compose up -d python-preprocess
```

## Environment Variables

Make sure your `.env` file or environment variables are set before deployment:

```env
MONGO_ROOT_USERNAME=your_username
MONGO_ROOT_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
SSO_ISSUER=https://sso2.kpi.fei.tuke.sk/realms/testing
SSO_CLIENT_ID=testing
SSO_CLIENT_SECRET=your_secret
SSO_REDIRECT_URI=http://your-domain.com/api/sso/callback
SSO_SCOPES=openid email profile employee_info
FRONTEND_URL=http://your-domain.com
```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs [service-name]

# Check if ports are in use
netstat -tulpn | grep :3001
netstat -tulpn | grep :80
```

### Rebuild fails
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache [service-name]
```

### Database connection issues
```bash
# Check MongoDB health
docker-compose ps latex_db_instance

# View MongoDB logs
docker-compose logs latex_db_instance
```

## Post-Deployment Checklist

- [ ] All services are running (`docker-compose ps`)
- [ ] Backend is accessible (`curl http://localhost:3001/api/health`)
- [ ] Frontend is accessible (`curl http://localhost:80`)
- [ ] LaTeX compiler is healthy (`curl http://localhost:8080/health`)
- [ ] SSO login works
- [ ] LaTeX compilation works

## Automated Deployment (CI/CD)

For automated deployments, use `deploy.sh`:

```bash
#!/bin/bash
cd /path/to/latex-code-generator
./deploy.sh
```

Or add to your CI/CD pipeline:
```yaml
deploy:
  script:
    - cd /path/to/latex-code-generator
    - ./deploy.sh
```
