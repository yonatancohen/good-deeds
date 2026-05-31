#!/usr/bin/env node
/**
 * Injects PWA / iOS "add to home screen" tags into the Expo web build.
 *
 * Expo's metro web bundler runs in single-page (SPA) mode for this app, so the
 * `app/+html.tsx` template is not used and there is no build-time hook for the
 * <head>. This script post-processes dist/index.html after `expo export -p web`
 * to add the web manifest link, theme color, and Apple-specific meta tags.
 *
 * The icons and manifest.json themselves are served from `public/` (Expo copies
 * that folder to the dist root automatically).
 */
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');
const INDEX = path.join(DIST, 'index.html');

const APP_NAME = 'תפסתי אותך בטוב';
const SHORT_NAME = 'תפסתי בטוב';
const DESCRIPTION =
  'מערכת לעידוד מעשים טובים בבית הספר — מורים מעניקים נקודות לתלמידים על מעשים טובים, והכיתות צוברות נקודות לקראת מתנה.';
const THEME_COLOR = '#fff8f2';
const SPLASH_BG = '#ecdbfb';
const VIEWPORT =
  'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover';

const TAGS = [
  `<meta name="description" content="${DESCRIPTION}" />`,
  `<link rel="manifest" href="/manifest.json" />`,
  `<meta name="theme-color" content="${THEME_COLOR}" />`,
  `<meta name="application-name" content="${APP_NAME}" />`,
  `<meta name="mobile-web-app-capable" content="yes" />`,
  `<meta name="apple-mobile-web-app-capable" content="yes" />`,
  `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`,
  `<meta name="apple-mobile-web-app-title" content="${SHORT_NAME}" />`,
  `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />`,
  `<link rel="icon" type="image/png" href="/icons/icon-192.png" />`,
].join('\n    ');

const MARKER = '<!-- pwa:start -->';

function main() {
  if (!fs.existsSync(INDEX)) {
    console.error(`[inject-pwa] ${INDEX} not found. Run "expo export -p web" first.`);
    process.exit(1);
  }

  let html = fs.readFileSync(INDEX, 'utf8');

  if (html.includes(MARKER)) {
    console.log('[inject-pwa] PWA tags already present, skipping.');
    return;
  }

  const splashPaint = `<style id="splash-paint">html,body{background-color:${SPLASH_BG}}</style>`;
  const block = `\n    ${MARKER}\n    ${splashPaint}\n    ${TAGS}\n    <!-- pwa:end -->\n  `;

  if (!html.includes('</head>')) {
    console.error('[inject-pwa] No </head> found in index.html.');
    process.exit(1);
  }

  html = html.replace('</head>', `${block}</head>`);

  // Viewport: notch support + prevent iOS input-focus zoom in standalone PWA
  if (html.includes('name="viewport"')) {
    html = html.replace(
      /<meta\s+name="viewport"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="viewport" content="${VIEWPORT}" />`,
    );
  } else {
    html = html.replace('</head>', `    <meta name="viewport" content="${VIEWPORT}" />\n  </head>`);
  }

  // RTL + Hebrew for production SPA (app/+html.tsx is not used in metro web export)
  html = html.replace(/<html([^>]*)>/i, (match, attrs) => {
    let next = attrs || '';
    if (!/\blang=/i.test(next)) next += ' lang="he"';
    if (!/\bdir=/i.test(next)) next += ' dir="rtl"';
    return `<html${next}>`;
  });

  fs.writeFileSync(INDEX, html);
  console.log('[inject-pwa] Injected PWA / iOS meta tags into dist/index.html');
}

main();
