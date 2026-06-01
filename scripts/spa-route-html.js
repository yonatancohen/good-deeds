#!/usr/bin/env node
/**
 * Expo web export is a single index.html SPA. Copy it to deep route paths so
 * hosts (and Vercel cleanUrls) can serve /auth/set-password etc. directly.
 */
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');
const INDEX = path.join(DIST, 'index.html');

const ROUTES = [
  'auth/login',
  'auth/set-password',
  'admin',
  'admin/teachers',
  'teacher',
];

if (!fs.existsSync(INDEX)) {
  console.error('[spa-route-html] dist/index.html not found — run expo export first');
  process.exit(1);
}

const html = fs.readFileSync(INDEX, 'utf8');

for (const route of ROUTES) {
  const dir = path.join(DIST, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

console.log(`[spa-route-html] Wrote ${ROUTES.length} route fallbacks under dist/`);
