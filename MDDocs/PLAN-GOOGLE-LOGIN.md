# Plán implementácie Google Login

## Prehľad
Pridanie Google OAuth 2.0 prihlásenia do aplikácie. Google login bude fungovať paralelne s existujúcim univerzitným SSO loginom.

## Google OAuth 2.0 Flow

### Authorization Code Flow:
1. **Frontend:** Používateľ klikne na "Sign in with Google"
2. **Backend:** Generuje Google OAuth authorization URL
3. **Google:** Používateľ sa prihlási a autorizuje aplikáciu
4. **Google:** Presmeruje späť na callback URL s authorization code
5. **Backend:** Vymení authorization code za access token a ID token
6. **Backend:** Získa user info z Google API
7. **Backend:** Vytvorí alebo aktualizuje používateľa v databáze
8. **Backend:** Vygeneruje JWT token (kompatibilný s existujúcou autentifikáciou)
9. **Frontend:** Uloží token a prihlási používateľa

## Potrebné údaje z Google Cloud Console

### Google Cloud Console Setup:
1. Vytvoriť projekt v [Google Cloud Console](https://console.cloud.google.com/)
2. Povoliť Google+ API
3. Vytvoriť OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/api/auth/google/callback` (dev) a produkčná URL
4. Získať:
   - **Client ID**
   - **Client Secret**

### Dostupné údaje z Google:
- `email` - emailová adresa
- `name` - celé meno
- `given_name` - krstné meno
- `family_name` - priezvisko
- `picture` - URL profilovej fotky
- `locale` - jazyk/národnosť
- `sub` - unique Google user ID

## Architektúra riešenia

### Možnosti integrácie:

#### Možnosť 1: Použiť `openid-client` (odporúčané)
- **Pros:**
  - Konzistentné s existujúcou SSO implementáciou
  - Rovnaký kód pattern
  - Podporuje Google OAuth 2.0
- **Cons:**
  - Možno trochu komplexnejšie ako priamy OAuth

#### Možnosť 2: Použiť `passport-google-oauth20`
- **Pros:**
  - Špecializovaná knižnica pre Google
  - Jednoduchšia implementácia
- **Cons:**
  - Iný pattern ako SSO
  - Potrebuje Passport.js

#### Možnosť 3: Priamy OAuth 2.0 s `google-auth-library`
- **Pros:**
  - Oficiálna Google knižnica
  - Plná kontrola
- **Cons:**
  - Viac kódu
  - Manuálna implementácia flow

**Odporúčanie:** Možnosť 1 - použiť `openid-client`, pretože už máme SSO implementáciu a môžeme znovu použiť rovnaký pattern.

## Fázy implementácie

### Fáza 1: Backend - Google OAuth konfigurácia

#### Krok 1.1: Google Cloud Console setup
- [ ] Vytvoriť Google Cloud projekt
- [ ] Povoliť Google+ API
- [ ] Vytvoriť OAuth 2.0 Client ID
- [ ] Získať Client ID a Client Secret
- [ ] Nastaviť Authorized redirect URIs

#### Krok 1.2: Environment premenné
- [ ] Pridať Google OAuth premenné do `docker-compose.yml`:
  ```env
  GOOGLE_CLIENT_ID=your-google-client-id
  GOOGLE_CLIENT_SECRET=your-google-client-secret
  GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
  ```

#### Krok 1.3: Vytvorenie Google OAuth service
- [ ] Vytvoriť `backend/src/services/google.service.ts`
  - Inicializácia Google OAuth klienta pomocou `openid-client`
  - Google issuer: `https://accounts.google.com`
  - Generovanie authorization URL
  - Spracovanie callbacku (výmena code za tokeny)
  - Získanie user info z Google

#### Krok 1.4: Vytvorenie Google OAuth controller
- [ ] Vytvoriť `backend/src/controllers/google.controller.ts`
  - `initiateGoogleLogin()` - endpoint na iniciovanie Google prihlásenia
  - `handleGoogleCallback()` - endpoint na spracovanie callbacku z Google

#### Krok 1.5: Vytvorenie Google OAuth routes
- [ ] Vytvoriť `backend/src/routes/google.routes.ts`
  - `GET /api/auth/google/login` - iniciuje Google prihlásenie
  - `GET /api/auth/google/callback` - spracováva callback

#### Krok 1.6: Aktualizácia User modelu
- [ ] Upraviť `backend/src/models/User.ts`
  - Pridať `googleId` (sub z Google)
  - Pridať `googleProvider: "google"` (pre rozlíšenie od SSO)
  - Pridať `avatar` (URL profilovej fotky z Google)
  - Aktualizovať `findOrCreateFromSSO` na `findOrCreateFromOAuth` (aby fungovalo pre oba)

#### Krok 1.7: Integrácia do app.ts
- [ ] Pridať Google routes do `backend/src/app.ts`

### Fáza 2: Backend - Spracovanie Google callbacku

#### Krok 2.1: Implementácia Google service logiky
- [ ] Implementovať získanie authorization URL
- [ ] Implementovať výmenu authorization code za tokeny
- [ ] Implementovať získanie user info z Google
- [ ] Validácia tokenov

#### Krok 2.2: Implementácia user creation/update logiky
- [ ] V Google service: logika na vytvorenie alebo aktualizáciu používateľa
- [ ] Mapovanie Google údajov na User model:
  - `email` → `email`
  - `name` → `name`
  - `sub` → `googleId`
  - `picture` → `avatar`
  - `given_name` → `givenName` (ak potrebné)
  - `family_name` → `familyName` (ak potrebné)

#### Krok 2.3: Implementácia callback handlera
- [ ] Spracovanie authorization code
- [ ] Validácia state parametra (CSRF ochrana)
- [ ] Vytvorenie/aktualizácia používateľa
- [ ] Generovanie JWT tokenu
- [ ] Presmerovanie na frontend s tokenom

### Fáza 3: Frontend - Google prihlásenie

#### Krok 3.1: Aktualizácia auth service
- [ ] Pridať metódu `initiateGoogleLogin()` do `new-frontend/src/services/auth.service.js`
  - Volá backend endpoint `/api/auth/google/login`
  - Presmeruje používateľa na Google

#### Krok 3.2: Aktualizácia LoginForm
- [ ] Pridať tlačidlo "Sign in with Google" do `new-frontend/src/Pages/AuthForms/LoginForm.jsx`
- [ ] Implementovať handler na spustenie Google prihlásenia
- [ ] Použiť Google ikonu (môže byť z react-icons alebo obrázok)

#### Krok 3.3: Spracovanie Google callbacku
- [ ] Použiť existujúci `SSOCallback.jsx` komponent alebo vytvoriť univerzálný `OAuthCallback.jsx`
- [ ] Spracovať token z URL parametrov
- [ ] Uložiť token do localStorage
- [ ] Aktualizovať AuthContext
- [ ] Presmerovať na hlavnú stránku

### Fáza 4: Testovanie a ošetrenie edge cases

#### Krok 4.1: Testovanie Google OAuth flow
- [ ] Testovanie úspešného prihlásenia
- [ ] Testovanie prihlásenia existujúceho používateľa
- [ ] Testovanie prihlásenia nového používateľa
- [ ] Testovanie chybových stavov (zrušené prihlásenie, neplatný token, atď.)

#### Krok 4.2: Ošetrenie edge cases
- [ ] Používateľ sa prihlási cez Google, ale už má účet s rovnakým emailom (bez Google)
- [ ] Používateľ sa prihlási cez Google, ale už má účet s rovnakým emailom (s SSO)
- [ ] Google provider vráti chybu
- [ ] Timeout pri komunikácii s Google
- [ ] Neplatný alebo expirovaný authorization code

#### Krok 4.3: Logovanie a error handling
- [ ] Pridať logovanie Google OAuth operácií
- [ ] Vylepšiť error messages pre používateľa
- [ ] Pridať fallback na manuálne prihlásenie

## Technické detaily

### Google OAuth 2.0 Authorization Code Flow

```
1. User clicks "Login with Google"
   ↓
2. Frontend → Backend: GET /api/auth/google/login
   ↓
3. Backend generates authorization URL with:
   - client_id
   - redirect_uri (callback URL)
   - response_type=code
   - scope (email profile)
   - state (CSRF token)
   - access_type=online
   - prompt=select_account (optional)
   ↓
4. Backend redirects user to Google
   ↓
5. User authenticates at Google
   ↓
6. Google redirects to: /api/auth/google/callback?code=...&state=...
   ↓
7. Backend exchanges code for tokens:
   - POST to https://oauth2.googleapis.com/token with:
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
    - GET https://www.googleapis.com/oauth2/v2/userinfo with access_token
    - OR decode id_token (obsahuje user info)
   ↓
11. Backend creates/updates user in database
   ↓
12. Backend generates JWT token
   ↓
13. Backend redirects to frontend with token
   ↓
14. Frontend stores token and logs user in
```

### Environment premenné

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

### Dependencies

**Backend:**
- `openid-client` - už nainštalovaný (použijeme pre Google)
- (existujúce: `jsonwebtoken`, `express`, `mongoose`)

**Frontend:**
- (žiadne nové - použijeme existujúce auth service a context)

### Google OAuth Scopes

- `openid` - pre ID token
- `email` - emailová adresa
- `profile` - základné profilové informácie (name, picture, locale)

## Bezpečnostné opatrenia

1. **CSRF Protection:** Použitie `state` parametra v OAuth flow
2. **Token Validation:** Validácia ID tokenu pred vytvorením session
3. **Secure Storage:** JWT tokeny v localStorage (alebo HTTP-only cookies)
4. **HTTPS:** V produkcii použiť HTTPS pre všetky OAuth komunikácie
5. **Secret Management:** Google secret v environment premenných, nie v kóde
6. **Redirect URI Validation:** Google validuje redirect URI, musí byť presne zaregistrovaný

## User Model Changes

### Nové polia:
```typescript
googleId?: string;        // Google sub (unique ID)
googleProvider?: string;  // "google"
avatar?: string;          // URL profilovej fotky z Google
```

### Aktualizácia metódy:
- Zmeniť `findOrCreateFromSSO` na `findOrCreateFromOAuth`
- Podporovať oba typy OAuth (SSO a Google)
- Mapovanie podľa providera

## Frontend Changes

### LoginForm.jsx
- Pridať Google login tlačidlo vedľa SSO tlačidla
- Použiť Google farby a ikonu
- Rovnaký flow ako SSO

### Auth Service
- Pridať `initiateGoogleLogin()` metódu

## Porovnanie: SSO vs Google Login

| Aspekt | SSO (Keycloak) | Google OAuth |
|--------|----------------|--------------|
| Provider | Univerzitný SSO | Google |
| Issuer | `https://sso2.kpi.fei.tuke.sk/realms/testing` | `https://accounts.google.com` |
| Client ID | `testing` | Google Client ID |
| Scopes | `openid email profile employee_info` | `openid email profile` |
| User Info | ID token + userinfo endpoint | ID token (obsahuje všetko) |
| Employee Type | Áno (S, D, P, N) | Nie |
| Avatar | Nie | Áno (picture) |

## Migrácia existujúceho kódu

### Refaktoring SSO service
- Premenovať `sso.service.ts` na `oauth.service.ts` (alebo vytvoriť univerzálny)
- Vytvoriť abstrakciu pre rôzne OAuth providery
- Spoločná logika pre SSO a Google

### Alternatíva: Samostatné služby
- Ponechať `sso.service.ts` pre SSO
- Vytvoriť `google.service.ts` pre Google
- Zdieľať spoločnú logiku cez helper funkcie

**Odporúčanie:** Samostatné služby (jednoduchšie, jasnejšie rozdelenie)

## Testovanie

### Testovacie scenáre:
1. Nový používateľ sa prihlási cez Google
2. Existujúci používateľ (email/password) sa prihlási cez Google
3. Existujúci používateľ (SSO) sa prihlási cez Google
4. Používateľ má účet s rovnakým emailom cez Google aj SSO
5. Zrušenie Google prihlásenia
6. Neplatný authorization code
7. Expired token

## Produkčné poznámky

### Google Cloud Console:
- Pre produkciu vytvoriť nový OAuth Client ID
- Nastaviť produkčnú redirect URI
- Pridať do Authorized domains

### Security:
- Použiť HTTPS v produkcii
- Validovať redirect URI
- Použiť `state` parameter pre CSRF protection
- Rate limiting na OAuth endpointoch

## Výhody pridania Google Login

1. **Väčšia dostupnosť** - používatelia nemusia mať univerzitný účet
2. **Rýchlejšie prihlásenie** - Google je široko používaný
3. **Jednoduchšie pre externých používateľov** - nemusia sa registrovať
4. **Profilové fotky** - automaticky z Google

## Potenciálne problémy

1. **Duplicitné účty** - používateľ môže mať účet s rovnakým emailom cez SSO aj Google
   - **Riešenie:** Pri prihlásení cez Google skontrolovať, či už existuje účet s emailom a zlúčiť ich

2. **Email konflikty** - rôzni používatelia môžu mať rovnaký email
   - **Riešenie:** Google garantuje unikátnosť emailov

3. **Zmena emailu v Google** - používateľ zmení email v Google
   - **Riešenie:** Pri každom prihlásení aktualizovať email z Google

## Ďalšie možnosti

### V budúcnosti:
- Facebook Login
- GitHub Login
- Microsoft/Azure AD Login
- Multi-provider account linking (používateľ môže prepojiť viacero providerov)

