# pwa-app

Angular 21 standalone PWA with SSR and Vitest.

## Commands

| Command | Action |
|---------|--------|
| `npm start` | Dev server on `:4200` with HMR |
| `npm run build` | Production build to `dist/` |
| `npm test` | Run Vitest unit tests (via `@angular/build:unit-test`) |
| `npm run serve:ssr:pwa-app` | Serve production SSR on `:4000` |

No lint script exists. Only Prettier is configured — run `npx prettier --write .` to format.

## Framework conventions

- **Standalone components only** — no NgModules. Use `bootstrapApplication`, `imports` on `@Component`, `provideRouter`.
- **Signals** (`signal()`, `computed()`, `effect()`) for state, not classic `ChangeDetectorRef` or `ngZone`.
- **New control flow** — `@if`, `@for`, `@defer` instead of `*ngIf`, `*ngFor`.
- **SSR by default** — Angular SSR is enabled; prerendering is the default render mode.
- **Service Worker** — registered in `app.config.ts` only when not in dev mode (`!isDevMode()`).

## Testing

- **Vitest** with **jsdom** and `vitest/globals` types (`describe`/`it`/`expect` without imports).
- Use `TestBed.configureTestingModule({ imports: [YourComponent] })` for standalone components.
- Test files are `src/**/*.spec.ts`.

## TypeScript

- `strict: true`, `strictTemplates: true`, `strictInputAccessModifiers: true`.
- Decorators enabled (`experimentalDecorators: true`).
- `isolatedModules: true` — don't rely on cross-file type erasure.

## Build

- Production budgets: initial 500kB warn / 1MB error; component style 4kB warn / 8kB error.
- Output hashing `all` in production — the SW glob patterns (`/*.css`, `/*.js`) match hashed filenames. If you change output hashing, update `ngsw-config.json`.
- Static assets live in `public/`.
- No CI, no e2e framework installed.

## PWA

- **SW only in production builds** — `npm start` (dev server) does not register the SW. Test SW behavior by running `npm run build` then `npm run serve:ssr:pwa-app`.
- **Registration delay** — `registerWhenStable:30000` waits 30s after the app stabilizes before registering the SW. Reduce this for faster offline coverage.
- **`ngsw-config.json`** controls caching, not a raw SW script. After any change to it, rebuild (`npm run build`) to regenerate the manifest.
- **Hashed output globs** — the SW config uses `/*.css` and `/*.js` to match all hashed build artifacts. Adding new file extensions to the build output requires updating these globs.
- **SSR + SW** — both `/index.csr.html` (CSR fallback) and `/index.html` are prefetched, because SSR routes need a cached fallback for offline.
- **Data groups** — there are no `dataGroups` yet. When introducing API calls, add them to `ngsw-config.json` with appropriate `strategy` (`freshness` for live data, `performance` for cached-first).
- **Navigation URLs** — by default the SW serves `index.html` for all navigation requests. If you add routes with unusual URL patterns or query params, configure `navigationUrls` in `ngsw-config.json`.
- **Icons** — 8 sizes (72–512px), all with `purpose: "maskable any"`. Keep this set complete when replacing icons.
- **Version bumps** — every `ng build` produces a new SW manifest with a new hash. The SW auto-detects the update on the client and prompts for reload.
- **No offline analytics** — there's no `navigationRequestStrategy: 'freshness'` set. Offline navigation serves the cached version for all routes.
- **No e2e** — PWA flows (install prompt, update, push) cannot be tested without an e2e framework (none installed).
