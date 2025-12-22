# SSO Environment Variables

Pridajte tieto premenné do vášho `.env` súboru alebo do `docker-compose.yml`:

## Testovacia verzia SSO

```env
# SSO Configuration (Testing)
SSO_ISSUER=https://sso2.kpi.fei.tuke.sk/realms/testing
SSO_CLIENT_ID=testing
SSO_CLIENT_SECRET=s49Y8cHbGA9aYj9c15lxMJIOcuU9wzfr
SSO_REDIRECT_URI=http://localhost:3001/api/sso/callback
SSO_SCOPES=email profile employee_info

# Frontend URL (pre redirect po SSO prihlásení)
# Pre lokálny Vite dev server použite: http://localhost:5173
# Pre Docker frontend použite: http://localhost:80 alebo http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

## Pre produkciu (keď bude dostupné)

```env
# SSO Configuration (Production)
SSO_ISSUER=https://sso.kpi.fei.tuke.sk/realms/production
SSO_CLIENT_ID=<production-client-id>
SSO_CLIENT_SECRET=<production-client-secret>
SSO_REDIRECT_URI=https://your-domain.com/api/sso/callback
SSO_SCOPES=email profile employee_info

# Frontend URL
FRONTEND_URL=https://your-domain.com
```

## Poznámky

- `SSO_REDIRECT_URI` musí byť zaregistrovaný v SSO provideri
- Pre lokálny vývoj použite `http://localhost:3001/api/sso/callback`
- Pre produkciu použite plnú HTTPS URL
- `FRONTEND_URL` sa používa na redirect po úspešnom SSO prihlásení

