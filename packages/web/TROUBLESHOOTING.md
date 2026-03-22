# Web app troubleshooting

## Blank white screen (nothing renders)

1. **localStorage blocked** — The app used to read `localStorage` when the store module loaded. In Safari (private mode), strict privacy settings, or some enterprise browsers, that throws `SecurityError` and **the JavaScript bundle never finishes loading**, so you get a white page.  
   **Fix:** All token access goes through `src/lib/safe-storage.ts` (try/catch). Redeploy after pulling this change.

2. **Broken or stale JWT in storage** — `AuthRehydrator` parses the token on load; malformed tokens now clear the session instead of crashing.

3. **Deploy / assets** — Open DevTools → **Network**: if `index-*.js` or CSS returns 404, fix CloudFront/S3 paths or `base` in `vite.config.ts`. Open **Console** for red errors.

4. **Rebuild with env** — Production API URL must be baked in at build time: `VITE_API_URL` in `.env.production` (see `pnpm build` in CI).

After code changes, run `pnpm build` in `packages/web` and redeploy the `dist/` output.
