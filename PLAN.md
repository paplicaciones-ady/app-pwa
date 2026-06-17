# Plan: Microsoft Entra ID + Passkey + Offline

## Arquitectura

```
Tres piezas:
  Microsoft Entra ID  → identidad oficial (cloud)
  Passkey / WebAuthn   → prueba del usuario en el dispositivo
  Biometría            → desbloqueo de la passkey

Dos sesiones:
  Sesión Microsoft  → "Puedo hablar con Microsoft"
  Sesión Local      → "Este dispositivo reconoce al usuario"
```

---

## Fase 1 — Base de Datos

### `users` — columnas nuevas

| Columna | Tipo | Notas |
|---------|------|-------|
| `microsoftId` | VARCHAR unique nullable | `oid` de Entra ID |

No se agregan columnas para email, nombre, etc. — esos datos se obtienen de Microsoft en cada autenticación.

### Nueva tabla `devices`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | SERIAL PK | |
| `userId` | INTEGER NOT NULL FK → users.id | |
| `deviceName` | VARCHAR | ej. "MacBook Pro", "Samsung S25" |
| `deviceFingerprint` | VARCHAR NOT NULL | hash único del navegador/equipo |
| `isTrusted` | BOOLEAN DEFAULT false | |
| `lastUsedAt` | TIMESTAMP | |
| `createdAt` | TIMESTAMP DEFAULT now() | |

### `passkey_credentials` — columna nueva

| Columna | Tipo | Notas |
|---------|------|-------|
| `deviceId` | INTEGER FK → devices.id nullable | Una passkey → un dispositivo |

No hay referencia bilateral. Devices no apunta a passkey_credentials.

### Entidades TypeORM nuevas / modificadas

```
src/users/user.entity.ts        → + microsoftId
src/passkeys/passkey.entity.ts  → + deviceId, relación ManyToOne con Device
src/devices/device.entity.ts    → nuevo
```

---

## Fase 2 — Backend: Microsoft Entra ID (BFF Flow)

MSAL se maneja **en el backend**. El frontend nunca ve tokens de Microsoft.

### Flujo OAuth Authorization Code

```
 Frontend                    Backend (BFF)                     Microsoft
    │                            │                                │
    │  GET /api/auth/microsoft/login                              │
    │───────────────────────────►│                                │
    │                   { url }                                   │
    │◄───────────────────────────│                                │
    │  redirige navegador a URL                                   │
    │───────────────────────────────────────────────────────────►│
    │                            │                                │
    │                            │  callback con auth code        │
    │◄────────────────────────────────────────────────────────────│
    │  POST /api/auth/microsoft/callback { code, state }          │
    │───────────────────────────►│                                │
    │                            │──── exchange code ───────────►│
    │                            │◄──── tokens (id, access, ref) │
    │                   { jwt, isNewUser }                        │
    │◄───────────────────────────│                                │
    │  almacena JWT en IndexedDB                                  │
    │  navega a onboarding o dashboard                            │
```

### Endpoints nuevos

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/auth/microsoft/login` | Devuelve `{ url }` con la URL de autorización de Microsoft (state guardado en memoria/redis) |
| `POST /api/auth/microsoft/callback` | Recibe `{ code, state }`, intercambia por tokens, valida ID token, crea/busca usuario, devuelve JWT propio + `{ isNewUser }` |
| `POST /api/auth/microsoft/refresh` | Usa refresh_token (si aplica) para renovar la sesión Microsoft silenciosamente |

### MicrosoftAuthService (backend)

- Mantiene configuración de la app registrada en Azure (client_id, client_secret, tenant, redirect_uri)
- Genera URL de autorización con state (PKCE opcional)
- Intercambia código por tokens
- Valida ID token (firma con JWKS de Microsoft, exp, aud, issuer)
- Extrae `oid` (microsoftId), `email`, `name` del ID token
- Crea usuario si no existe por `microsoftId`
- Almacena `refresh_token` cifrado (o en sesión) para renovación silenciosa

### Dependencias nuevas (backend)

Ninguna librería MSAL en el backend. Se puede implementar con:
- `jsonwebtoken` + `jwks-rsa` para validar tokens de Microsoft
- `node-fetch` o `axios` para intercambio de código
- O usar `msal-node` (opcional, evalúa si simplifica)

---

## Fase 3 — Backend: Devices & Passkeys

### Endpoints de dispositivos

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `POST /api/devices` | JWT | Registrar dispositivo actual. Body: `{ deviceName, deviceFingerprint }`. Crea device con `isTrusted=true` |
| `GET /api/devices` | JWT | Listar dispositivos del usuario |
| `DELETE /api/devices/:id` | JWT | Eliminar dispositivo (revocar trust) |

### Modificaciones a passkeys

- `POST /api/auth/passkey/register/begin` — además de userId, recibe `deviceId` opcional. Si el usuario viene de Microsoft login y es primera vez, el device ya se creó, se pasa su ID.
- `POST /api/auth/passkey/register/complete` — asocia la credencial al `deviceId`.
- `POST /api/auth/passkey/login/begin` — ahora acepta `deviceFingerprint` además de `email`. Permite encontrar el device y saber si está registrado.
- `POST /api/auth/passkey/login/complete` — devuelve `{ access_token, isOnlineRequired: boolean }`. `isOnlineRequired = true` si el token de Microsoft expiró y necesita renovación.

### DeviceFingerprint

Se genera en el frontend como hash de:
```
navigator.userAgent + navigator.language + screen.width + screen.height
```
Algoritmo: SHA-256 (vía Web Crypto API o librería ligera).

---

## Fase 4 — Frontend: Servicios y Estado

### AuthService — señales

| Signal | Tipo | Descripción |
|--------|------|-------------|
| `microsoftSession` | `UserProfile \| null` | Usuario autenticado vía Microsoft |
| `localSession` | `{ device, user } \| null` | Sesión local desbloqueada con passkey |
| `authLevel` | `computed<'none'\|'local'\|'full'>` | `full` = ambas sesiones activas |
| `isFullyAuthenticated` | `computed<boolean>` | `authLevel() === 'full'` |
| `deviceFingerprint` | `string \| null` | Fingerprint del dispositivo actual |

### Nuevos servicios

| Servicio | Descripción |
|----------|-------------|
| `MicrosoftAuthService` | `login()` → obtiene URL del backend y redirige. `handleCallback()` → procesa código en URL. `refreshToken()` → renovación silenciosa. `logout()` |
| `DeviceService` | `registerDevice(name)`, `getDevices()`, `deleteDevice(id)` |
| `FingerprintService` | `getFingerprint(): Promise<string>` — genera hash único del dispositivo |

### Auth interceptor — modificaciones

- Dejar de skippear `/auth/passkey/login/*` (ahora esos endpoints requieren JWT también, excepto quizás login begin)
- Agregar skip para `/auth/microsoft/*` (los endpoints de login/callback no llevan JWT)

---

## Fase 5 — Frontend: UI Adaptativa

La pantalla de login debe mostrar opciones **según el estado de la app**:

| Estado | UI |
|--------|-----|
| **Primera vez (online)** | Botón "Continuar con Microsoft" |
| **Dispositivo registrado (online)** | Botón "Entrar con huella" (passkey) + link "Usar otra cuenta de Microsoft" |
| **Dispositivo registrado (offline)** | Botón "Entrar con huella" |
| **Sin internet + sin dispositivo** | Mensaje: "Conéctate a internet para iniciar sesión por primera vez" |

### Flujo completo

```
Primera vez (online):
  Login Microsoft
  → Backend crea usuario por microsoftId
  → Frontend muestra: "Registra este dispositivo"
    → nombre del dispositivo + biometría (passkey)
    → POST /api/devices + POST /api/auth/passkey/register
  → Device marcado como confiable
  → Dashboard

Online recurrente:
  Passkey (biometría)
  → Desbloquea sesión local
  → Backend: POST /api/auth/microsoft/refresh (silent)
    → Si funciona: sesión Microsoft activa → nivel full
    → Si falla: solo sesión local, muestra "requiere reautenticación Microsoft"
  → Dashboard

Offline:
  Passkey (biometría)
  → Desbloquea sesión local
  → Acceso a datos offline cacheados

Recuperación de conexión:
  ConnectivityService detecta online
  → POST /api/auth/microsoft/refresh
    → Si funciona: nivel full
    → Si falla: solicitar login Microsoft
```

---

## Fase 6 — Frontend: Guards y Rutas

| Guard | Lógica |
|-------|--------|
| `authGuard` (modificado) | Si `authLevel() === 'full'` → allow. Si `authLevel() === 'local'` → allow pero muestra banner "Modo offline - reconecta para funciones completas". Si `authLevel() === 'none'` → redirect `/login` |
| Ruta `/login` (modificada) | Sin guard, redirige a `/dashboard` si `authLevel() === 'full'` |

---

## Fase 7 — Offline Data (Service Worker)

### ngsw-config.json — mejoras

```json
{
  "dataGroups": [
    {
      "name": "api-products",
      "urls": ["/api/products"],
      "cacheConfig": {
        "maxSize": 50,
        "maxAge": "7d",
        "strategy": "performance"
      }
    },
    {
      "name": "api-pqrs",
      "urls": ["/api/pqrs"],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "7d",
        "strategy": "performance"
      }
    }
  ]
}
```

Cambiar estrategia de `freshness` (network-first) a `performance` (cache-first) para que funcione offline. Los writes (POST/PUT/DELETE) se bloquean offline con mensaje al usuario.

---

## Fase 8 — Limpieza

### Email/password legacy

- Endpoints `POST /api/auth/register` y `POST /api/auth/login` se **eliminan** en producción
- Se mantienen en desarrollo si es útil para testing (controlado por env var)
- Columna `passwordHash` en `users` pasa a ser nullable
- Tabla `passkey_credentials` deja de existir sin relación a device (migrar data existente si la hay)

---

## Orden de implementación sugerido

```
1. Fase 1  — BD: migraciones, entidades nuevas
2. Fase 2  — Backend: Microsoft Entra ID (BFF flow)
3. Fase 3  — Backend: Devices + passkey link
4. Fase 4  — Frontend: servicios y estado
5. Fase 5  — Frontend: UI adaptativa
6. Fase 6  — Guards y rutas
7. Fase 7  — Service Worker offline
8. Fase 8  — Limpieza de legacy
```
