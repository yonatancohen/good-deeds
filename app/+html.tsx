import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web HTML template for Expo Router.
 * Injects Tailwind CSS and sets RTL direction for Hebrew.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="he">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        {/* Tailwind CSS – generated via `npm run tw:build` */}
        <link rel="stylesheet" href="/tailwind.css" />
        {/*
          Prevent the white flash when switching between light and dark mode.
          https://docs.expo.dev/router/reference/static-rendering/#root-html
        */}
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body, #root { height: 100%; width: 100%; max-width: 100%; margin: 0; padding: 0; }
            html, body { background-color: #ecdbfb; overflow-x: hidden; direction: ltr; min-height: 100%; }
            #root {
              direction: rtl; unicode-bidi: isolate; min-height: 100dvh;
              display: flex; flex-direction: column; align-items: stretch; flex: 1; min-width: 100%;
            }
            #root > div {
              direction: rtl; display: flex; flex-direction: column; flex: 1;
              width: 100%; min-width: 100%;
            }
            * { box-sizing: border-box; }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
