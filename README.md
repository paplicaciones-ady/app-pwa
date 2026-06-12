# app-pwa

Aplicación web progresiva (PWA) con autenticación biométrica WebAuthn (huella dactilar / Face ID / Windows Hello). Consta de un frontend Angular 21 con soporte SSR y un backend NestJS con base de datos SQLite.

## Stack tecnológico

### Frontend — `frontend/`

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Angular** | 21.2 | Framework SPA standalone, sin NgModules |
| **Angular SSR** | 21.2 | Renderizado del lado servidor con Express |
| **Angular Service Worker** | 21.2 | PWA offline y caché de activos |
| **TypeScript** | ~5.9.2 | Strict mode, `strictTemplates`, `isolatedModules` |
| **RxJS** | ~7.8 | Reactividad, Observables para peticiones HTTP |
| **Signals** | nativo | Estado reactivo (`signal`, `computed`) en lugar de ChangeDetection clásico |
| **Vitest** | ^4.0 | Tests unitarios con jsdom y variables globales |
| **Prettier** | ^3.8 | Formateo de código (no hay ESLint) |
| **@simplewebauthn/browser** | ^13.3 | Cliente WebAuthn (`startRegistration`, `startAuthentication`) |
| **http-proxy-middleware** | ^4.1 | Proxy de `/api` al backend en producción SSR |

**Arquitectura frontend:**
- Standalone components bootstraped con `bootstrapApplication`
- Estado de autenticación gestionado con Signals, persistencia JWT en IndexedDB
- Interceptor HTTP que añade `Authorization: Bearer` a las peticiones
- Guard de rutas que redirige a `/login` si no hay sesión
- Tres páginas: Login, Register, Profile (gestión de passkeys)
- Service Worker solo en producción, registrado 30s tras estabilizarse

### Backend — `backend/`

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **NestJS** | ^11.1 | Framework Node con decorators, módulos e inyección de dependencias |
| **TypeORM** | ^1.0 | ORM para gestión de entidades y repositorios |
| **better-sqlite3** | ^12.10 | Base de datos SQLite síncrona, rápida y sin servidor |
| **@nestjs/jwt** | ^11.0 | Generación y validación de JWT con expiración de 7 días |
| **@nestjs/passport + passport-jwt** | ^11.0 / ^4.0 | Estrategia de autenticación JWT mediante Bearer token |
| **bcrypt** | ^6.0 | Hashing de contraseñas con salt rounds |
| **@simplewebauthn/server** | ^13.3 | Verificación de registros y autenticaciones WebAuthn |
| **TypeScript** | ^6.0 | `target: ES2021`, `module: commonjs`, decorators habilitados |
| **ts-node** | ^10.9 | Ejecución directa de TypeScript en desarrollo |

**Arquitectura backend:**
- Módulos: `Users`, `Auth`, `Passkeys` más raíz `AppModule`
- Prefijo global `/api` en todas las rutas (`setGlobalPrefix('api')`)
- Entidad `User` con email único, passwordHash y createdAt
- Entidad `PasskeyCredential` con credentialId, publicKey (base64url), counter, backedUp, transports
- Challenges WebAuthn almacenados en memoria (dos Mapas: registro y login)
- CORS habilitado para desarrollo local
- Origin de WebAuthn resuelto dinámicamente desde header `Origin` de la petición

### WebAuthn — flujo

```
Registro:
  Cliente → POST /api/auth/passkey/register/begin → { publicKey: options }
  Cliente ← navigator.credentials.create(options) ← diálogo biométrico del SO
  Cliente → POST /api/auth/passkey/register/complete → { ok }

Login:
  Cliente → POST /api/auth/passkey/login/begin → { sessionId, publicKey }
  Cliente ← navigator.credentials.get(options) ← diálogo biométrico
  Cliente → POST /api/auth/passkey/login/complete → { access_token }
```

## Requisitos

- Node.js >= 18 LTS
- npm >= 10

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo> app-pwa
cd app-pwa

# Instalar backend
cd backend
npm install

# Instalar frontend
cd ../frontend
npm install
```

## Ejecución

### Desarrollo local (SQLite + dev server)

```bash
# Terminal 1 — Backend (puerto 3000)
cd backend
npm start

# Terminal 2 — Frontend (puerto 4200)
cd frontend
npm start
```

Abrir `http://localhost:4200`. El proxy de Angular redirige `/api` al backend.

### Desarrollo accesible desde la red local

Para probar desde un móvil en la misma WiFi:

```bash
# Terminal 1 — Backend con IP local para WebAuthn
cd backend
RP_ID=192.168.1.X EXPECTED_ORIGIN=http://192.168.1.X:4200 npm start

# Terminal 2 — Frontend en todas las interfaces
cd frontend
npm run start:network
```

### Producción local (SSR + build)

```bash
cd frontend
npm run build
npm run serve:ssr:pwa-app
# → http://localhost:4000
```

El SSR incluye un proxy que redirige `/api` al backend en `localhost:3000`.

### PostgreSQL con Docker (opcional)

```bash
# Arrancar contenedor PostgreSQL
cd bd
docker compose up -d

# Backend apuntando a PostgreSQL
cd backend
DB_TYPE=postgres npm start
```

## Comandos útiles

| Comando | En | Acción |
|---------|----|--------|
| `npm start` | backend/ | Inicia NestJS en :3000 |
| `npm start` | frontend/ | Inicia Angular dev en :4200 |
| `npm run start:network` | frontend/ | Angular dev en :4200 accesible desde la red |
| `npm run build` | frontend/ | Build producción a `dist/` |
| `npm run serve:ssr:pwa-app` | frontend/ | Sirve build SSR en :4000 |
| `npm test` | frontend/ | Tests unitarios con Vitest |
| `npx prettier --write .` | frontend/ | Formatear código |

### Entorno de desarrollo

| Aspecto | Detalle |
|---------|---------|
| Node.js | >= 18 LTS |
| npm | >= 10 |
| Backend | `cd backend && npm start` → `http://localhost:3000` |
| Frontend dev | `cd frontend && npm start` → `http://localhost:4200` |
| Frontend SSR | `cd frontend && npm run build && npm run serve:ssr:pwa-app` → `http://localhost:4000` |
| Proxy dev | `proxy.conf.json` redirige `/api` → `localhost:3000` |
| Proxy SSR | `server.ts` usa `http-proxy-middleware` con `pathRewrite: { '^/': '/api/' }` |
| DB | SQLite auto-creada en `backend/data/webauthn.db` con `synchronize: true` |
