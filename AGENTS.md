# app-pwa

Monorepo: `pwa-app/` (Angular 21 PWA + SSR) + `backend/` (NestJS + SQLite + WebAuthn).

## Quick start

```bash
# Backend (terminal 1)
cd backend
npm start          # ts-node src/main.ts → :3000

# Frontend dev (terminal 2)
cd pwa-app
npm start          # ng serve → :4200, proxy /api → :3000

# Frontend dev accessible on LAN (e.g. mobile testing)
npm run start:network   # --host 0.0.0.0 --port 4200

# Frontend production SSR
npm run build
npm run serve:ssr:pwa-app  # → :4000
```

## Architecture

- **All backend endpoints** under `/api/*` (global prefix set in `backend/src/main.ts`)
- **Dev proxy** via `proxy.conf.json` — `/api` → `localhost:3000`
- **Prod SSR proxy** in `server.ts` — Express middleware with `pathRewrite: { '^/': '/api/' }` (Express strips `/api` prefix, must re-add)
- **No CORS in production** — SSR proxy and browser share same origin
- **DB**: SQLite at `backend/data/webauthn.db`, `synchronize: true` (dev only)
- **Challenges**: in-memory Map (lost on backend restart)

## WebAuthn

- `rpID` and `expectedOrigin` resolved **dynamically from request `Origin` header** (`passkeys.service.ts:28-37`). Falls back to env vars `RP_ID` / `EXPECTED_ORIGIN`, then to `localhost` / `http://localhost:4200`
- Passkey login and registration `begin`+`complete` endpoints accept optional `origin` param from `@Headers('origin')`
- `localhost` and local network IPs work without HTTPS in Chrome

## Backend

| Command | Description |
|---------|-------------|
| `npm start` | `ts-node src/main.ts` (port 3000) |
| `npm run build` | `tsc` → `dist/` |
| No test script | |

- NestJS 11, TypeORM, `better-sqlite3`, `bcrypt`, `@nestjs/jwt`, `@simplewebauthn/server`
- `tsconfig.json`: `target: ES2021`, `module: commonjs`, `experimentalDecorators`, `emitDecoratorMetadata`
- `app.enableCors()` in `main.ts`
- JWT secret: `process.env.JWT_SECRET ?? 'dev-secret-change-in-production'`
- Challenge storage: two `Map`s — `challenges` (keyed by userId) and `loginChallenges` (keyed by crypto.randomUUID sessionId)

## Frontend

See `pwa-app/AGENTS.md` for full conventions. Key points:

| Command | Description |
|---------|-------------|
| `npm start` | `ng serve` → :4200 |
| `npm test` | Vitest via `@angular/build:unit-test` |
| `npm run build` | Production build to `dist/` |
| `npm run serve:ssr:pwa-app` | SSR Express on :4000 |

- **Standalone** components, **Signals**, new control flow, SSR with prerender by default
- **SW only in production** (`!isDevMode()`), registered after 30s stable
- **No ESLint** — only Prettier (`npx prettier --write .`)
- **TypeScript**: `strict`, `strictTemplates`, `isolatedModules`
- **Vitest + jsdom**: `describe`/`it`/`expect` globals, test files `src/**/*.spec.ts`

### Auth flow

- `AuthService.init()` runs in root `App` constructor, guarded by `isPlatformBrowser()` (SSR-safe)
- JWT stored in `IndexedDB` (not localStorage — avoids SW cache contamination)
- `authInterceptor` sets `Authorization: Bearer` header, skips paths containing `/auth/login` or `/auth/passkey/login`
- `authGuard` redirects to `/login` if not authenticated
- Login/register redirect to `/profile`

## Testing on Android from PC

```bash
# 1. Get local IP
ip a | grep -oP 'inet \K192\.168\.\d+\.\d+'

# 2. Backend with correct WebAuthn origin
RP_ID=192.168.1.X EXPECTED_ORIGIN=http://192.168.1.X:4200 npx ts-node src/main.ts

# 3. Frontend accessible on network
npm run start:network
```

For HTTPS (PWA install, ngrok tunnel): build → SSR → `ngrok http 4000`.
