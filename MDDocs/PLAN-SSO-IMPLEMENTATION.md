# Plán implementácie SSO (Single Sign-On) - KPI

## Prehľad
Implementácia univerzitného SSO prihlásenia pomocou OpenID Connect (OIDC) protokolu. Začíname s testovacou verziou SSO.

## Testovacie údaje SSO

**Endpoint:** `https://sso2.kpi.fei.tuke.sk/realms/testing`  
**Client ID:** `testing`  
**Secret Key:** `s49Y8cHbGA9aYj9c15lxMJIOcuU9wzfr`

## Dostupné scopes a údaje

### Štandardné scopes (email, profile):
- `email` - univerzitná emailová adresa
- `name` - celé meno bez titulov
- `full_name` - meno vrátane titulov
- `family_name` - priezvisko
- `given_name` - krstné meno
- `preferred_username` - jedinečný login (xx123yy)

### Voliteľný scope (employee_info):
- `employee_type` - Typ používateľa: S (študent), D (doktorand), P (pedagog), N (administratívny pracovník)

## Architektúra riešenia

### OIDC Authorization Code Flow:
1. **Frontend:** Používateľ klikne na "Prihlásiť sa cez SSO"
2. **Backend:** Generuje authorization URL a presmeruje používateľa na SSO provider
3. **SSO Provider:** Používateľ sa prihlási a autorizuje aplikáciu
4. **SSO Provider:** Presmeruje späť na callback URL s authorization code
5. **Backend:** Vymení authorization code za access token a ID token
6. **Backend:** Získa user info z SSO providera
7. **Backend:** Vytvorí alebo aktualizuje používateľa v našej databáze
8. **Backend:** Vygeneruje JWT token (kompatibilný s existujúcou autentifikáciou)
9. **Frontend:** Uloží token a prihlási používateľa

## Fázy implementácie

### Fáza 1: Backend - OIDC konfigurácia a základné endpointy

#### Krok 1.1: Inštalácia závislostí
- [ ] Pridať `openid-client` balíček do `backend/package.json`
- [ ] Pridať environment premenné do `.env` (SSO konfigurácia)

#### Krok 1.2: Vytvorenie SSO konfiguračného súboru
- [ ] Vytvoriť `backend/src/config/sso.config.ts`
  - Konfigurácia OIDC providera (issuer, client ID, secret)
  - Discovery endpoint URL
  - Callback URL
  - Scopes (email, profile, employee_info)

#### Krok 1.3: Vytvorenie SSO service
- [ ] Vytvoriť `backend/src/services/sso.service.ts`
  - Inicializácia OIDC klienta
  - Generovanie authorization URL
  - Spracovanie callback (výmena code za token)
  - Získanie user info z SSO providera

#### Krok 1.4: Vytvorenie SSO controller
- [ ] Vytvoriť `backend/src/controllers/sso.controller.ts`
  - `initiateSSO()` - endpoint na iniciovanie SSO prihlásenia
  - `handleCallback()` - endpoint na spracovanie callbacku z SSO providera

#### Krok 1.5: Vytvorenie SSO routes
- [ ] Vytvoriť `backend/src/routes/sso.routes.ts`
  - `GET /api/sso/login` - iniciuje SSO prihlásenie
  - `GET /api/sso/callback` - spracováva callback

#### Krok 1.6: Aktualizácia User modelu
- [ ] Upraviť `backend/src/models/User.ts`
  - Pridať `ssoId` (preferred_username z SSO)
  - Pridať `ssoProvider` (napr. "kpi-testing")
  - Urobiť `password` voliteľným (pre SSO používateľov)
  - Pridať `employeeType` (voliteľné)
  - Pridať metódu na vytvorenie/aktualizáciu používateľa zo SSO dát

#### Krok 1.7: Integrácia do app.ts
- [ ] Pridať SSO routes do `backend/src/app.ts`

### Fáza 2: Backend - Spracovanie SSO callbacku a user management

#### Krok 2.1: Implementácia SSO service logiky
- [ ] Implementovať získanie authorization URL
- [ ] Implementovať výmenu authorization code za tokeny
- [ ] Implementovať získanie user info
- [ ] Implementovať validáciu tokenov

#### Krok 2.2: Implementácia user creation/update logiky
- [ ] V SSO service: logika na vytvorenie alebo aktualizáciu používateľa
- [ ] Mapovanie SSO údajov na User model:
  - `email` → `email`
  - `name` alebo `full_name` → `name`
  - `preferred_username` → `ssoId`
  - `employee_type` → `employeeType` (ak je dostupné)

#### Krok 2.3: Implementácia callback handlera
- [ ] Spracovanie authorization code
- [ ] Validácia state parametra (CSRF ochrana)
- [ ] Vytvorenie/aktualizácia používateľa
- [ ] Generovanie JWT tokenu
- [ ] Presmerovanie na frontend s tokenom

### Fáza 3: Frontend - SSO prihlásenie

#### Krok 3.1: Aktualizácia auth service
- [ ] Pridať metódu `initiateSSO()` do `new-frontend/src/services/auth.service.js`
  - Volá backend endpoint `/api/sso/login`
  - Presmeruje používateľa na SSO provider

#### Krok 3.2: Aktualizácia LoginForm
- [ ] Pridať tlačidlo "Prihlásiť sa cez SSO" do `new-frontend/src/Pages/AuthForms/LoginForm.jsx`
- [ ] Implementovať handler na spustenie SSO prihlásenia

#### Krok 3.3: Spracovanie SSO callbacku na frontende
- [ ] Vytvoriť alebo aktualizovať callback page/komponent
- [ ] Spracovať token z URL parametrov (alebo z backend callback endpointu)
- [ ] Uložiť token do localStorage
- [ ] Aktualizovať AuthContext
- [ ] Presmerovať na hlavnú stránku

### Fáza 4: Testovanie a ošetrenie edge cases

#### Krok 4.1: Testovanie SSO flow
- [ ] Testovanie úspešného prihlásenia
- [ ] Testovanie prihlásenia existujúceho používateľa
- [ ] Testovanie prihlásenia nového používateľa
- [ ] Testovanie chybových stavov (zrušené prihlásenie, neplatný token, atď.)

#### Krok 4.2: Ošetrenie edge cases
- [ ] Používateľ sa prihlási cez SSO, ale už má účet s rovnakým emailom (bez SSO)
- [ ] Používateľ sa prihlási cez SSO, ale už má účet s rovnakým emailom (s iným SSO)
- [ ] SSO provider vráti chybu
- [ ] Timeout pri komunikácii so SSO providerom
- [ ] Neplatný alebo expirovaný authorization code

#### Krok 4.3: Logovanie a error handling
- [ ] Pridať logovanie SSO operácií
- [ ] Vylepšiť error messages pre používateľa
- [ ] Pridať fallback na manuálne prihlásenie

## Technické detaily

### OIDC Authorization Code Flow

```
1. User clicks "Login with SSO"
   ↓
2. Frontend → Backend: GET /api/sso/login
   ↓
3. Backend generates authorization URL with:
   - client_id
   - redirect_uri (callback URL)
   - response_type=code
   - scope (email profile employee_info)
   - state (CSRF token)
   ↓
4. Backend redirects user to SSO provider
   ↓
5. User authenticates at SSO provider
   ↓
6. SSO provider redirects to: /api/sso/callback?code=...&state=...
   ↓
7. Backend exchanges code for tokens:
   - POST to token endpoint with:
     * grant_type=authorization_code
     * code
     * redirect_uri
     * client_id
     * client_secret
   ↓
8. Backend receives:
   - access_token
   - id_token
   - refresh_token (optional)
   ↓
9. Backend validates id_token
   ↓
10. Backend gets user info:
    - GET userinfo endpoint with access_token
   ↓
11. Backend creates/updates user in database
   ↓
12. Backend generates JWT token
   ↓
13. Backend redirects to frontend with token:
    - Option A: Redirect to frontend URL with token in query param
    - Option B: Set token in HTTP-only cookie
    - Option C: Return token via API and frontend handles it
   ↓
14. Frontend stores token and logs user in
```

### Environment premenné

```env
# SSO Configuration
SSO_ISSUER=https://sso2.kpi.fei.tuke.sk/realms/testing
SSO_CLIENT_ID=testing
SSO_CLIENT_SECRET=s49Y8cHbGA9aYj9c15lxMJIOcuU9wzfr
SSO_REDIRECT_URI=http://localhost:3001/api/sso/callback
SSO_SCOPES=email profile employee_info
```

### Dependencies

**Backend:**
- `openid-client` - OIDC klientska knižnica
- (existujúce: `jsonwebtoken`, `express`, `mongoose`)

**Frontend:**
- (žiadne nové - použijeme existujúce auth service a context)

## Bezpečnostné opatrenia

1. **CSRF Protection:** Použitie `state` parametra v OIDC flow
2. **Token Validation:** Validácia ID tokenu pred vytvorením session
3. **Secure Storage:** JWT tokeny v localStorage (alebo HTTP-only cookies)
4. **HTTPS:** V produkcii použiť HTTPS pre všetky SSO komunikácie
5. **Secret Management:** SSO secret v environment premenných, nie v kóde

## Migrácia na produkčné SSO

Keď bude potrebné prejsť na produkčné SSO:
1. Zmeniť `SSO_ISSUER` na produkčný endpoint
2. Zmeniť `SSO_CLIENT_ID` a `SSO_CLIENT_SECRET` na produkčné hodnoty
3. Aktualizovať `SSO_REDIRECT_URI` na produkčnú URL
4. Otestovať s reálnymi univerzitnými účtami

## Poznámky

- SSO používatelia nebudú mať heslo v databáze (password bude null/undefined)
- Existujúci email/password login zostane funkčný
- Používatelia sa môžu prihlásiť buď cez SSO alebo cez email/password
- Ak používateľ má účet s emailom a prihlási sa cez SSO, účet sa aktualizuje (pridá sa ssoId)

