# Pam's Pool House

A point-and-click 3D designer for the pool area: pool, deck, pool house, outdoor kitchen and yard.
Vite + Three.js, plain JavaScript. No accounts, no API keys.

- `site.json` holds every dimension (decimal feet). It is locked; the app never changes it in normal use.
- `npm run dev` to work on it, `npm run build` to build, `npm run plan` to redraw `stage0-plan.html` from `site.json`.
- Add `?selftest` to the address to get a pass/fail line in the browser tab title.

Stages: 0 drawings → 1 3D site (done) → 2 finishes and colors → 3 kitchen and furniture → 4 save, compare, export.
