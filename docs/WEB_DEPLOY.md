# Web app (casperevents.org) — deploy & reliability

The public site is a **Vite + React** app in `packages/web`, built to static files and served from **S3** behind **CloudFront**.

A **blank grey/white page** almost always means the browser loaded `index.html` but the **JavaScript failed** before React painted, or **asset URLs** don’t match what was deployed.

---

## Build requirements

### API URL (critical)

- **Production builds** must resolve `VITE_API_URL` to the real API, e.g. `https://api.casperevents.org/v1`.
- This repo includes `packages/web/.env.production` with that value. **Do not delete it** from the branch that builds production.
- The client also falls back to `https://api.casperevents.org/v1` when `import.meta.env.PROD` is true and `VITE_API_URL` is missing, so a mis-built bundle is less likely to call a broken relative `/api` on the static origin.

### Build command

From repo root:

```bash
cd packages/web && npm run build
```

Or with pnpm from monorepo root (follow your usual script).

---

## Deploy checklist (S3 + CloudFront)

1. **Build** with the same branch/commit you intend to ship.
2. **Upload the entire `packages/web/dist/`** to the static bucket (including `index.html` and all `assets/*` hashed files).
3. **Do not** leave orphaned old chunks as the only assets if `index.html` still references new hashes — deploy `index.html` **together** with its `assets/` folder from the same build.
4. **Invalidate CloudFront** after every deploy so users don’t get a **cached `index.html`** pointing at **deleted** JS/CSS files (classic cause of blank screen + 404s in DevTools Network).

Example:

```bash
aws s3 sync packages/web/dist/ s3://YOUR_BUCKET --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Common failure modes

| Symptom | Likely cause |
|--------|----------------|
| Blank page, no UI | JS bundle 404 (hash mismatch), or uncaught exception during module init (e.g. `localStorage` / `JSON.parse` on bad stored data). |
| Works in private window only | Corrupt `localStorage` (e.g. invalid `cyh_org_filter` JSON). Store init is defensive; users can clear site data. |
| API errors in Network tab | Wrong `VITE_API_URL`, or API/CORS — check `VITE_API_URL` in built chunk or Network request URL. |
| After deploy, some users broken | Stale CloudFront cache — **always invalidate** `/*` or at least `/` and `/index.html`. |

---

## Client-side safeguards (maintain these)

- **`packages/web/src/lib/store.ts`** — `localStorage` reads wrapped in try/catch; `cyh_org_filter` parsed with safe JSON helper.
- **`packages/web/src/lib/api.ts`** — token read via `safeGetStoredToken()`; production API fallback if env missing.
- **`packages/web/src/App.tsx`** — JWT payload parsing in try/catch; malformed token calls `logout()` instead of throwing.
- **`packages/web/src/main.tsx`** — mount failure shows a minimal inline message instead of a permanent blank screen.

When adding new persisted keys or `JSON.parse` of user data, **always** guard with try/catch and defaults.

---

## Local development

- Dev server uses Vite proxy: `/api` → local API (see `vite.config.ts`).
- For local testing against production API, you can use `.env.local`:

  `VITE_API_URL=https://api.casperevents.org/v1`

  (Mind CORS if the API only allows certain origins.)

---

## Quick verification after deploy

1. Open `https://casperevents.org` in a **private/incognito** window.
2. Open DevTools → **Network**: confirm main JS loads (200), not 404.
3. Confirm **Console** has no red errors on first paint.

If anything fails, fix deploy/cache first, then code.
