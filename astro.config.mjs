// @ts-check
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import { NOSCRIPT_CSS } from './src/layouts/inline-css.mjs';

/** Fingerprint of an inline script/style, so the security policy allows exactly it. */
const sha256 = (/** @type {string} */ text) =>
  /** @type {`sha256-${string}`} */ (`sha256-${createHash('sha256').update(text).digest('base64')}`);

const HEAD_INIT = readFileSync(new URL('./src/layouts/head-init.js', import.meta.url), 'utf8');

// The security policy is for the real site only. In `npm run dev` the dev
// server injects its own unfingerprinted styles and scripts, which the policy
// would block (the page loses all its styling).
const IS_BUILD = process.argv.includes('build');

// https://astro.build/config
export default defineConfig({
  // The real address: used for link previews and the sitemap
  site: 'https://isurukavi.vercel.app',

  // Every page stays a static file. Only files that say
  // `export const prerender = false` (the /api routes) run on Vercel's server.
  // staticHeaders: the security policy below is sent as a real HTTP header.
  adapter: vercel({ staticHeaders: IS_BUILD }),

  security: IS_BUILD ? {
    // Content Security Policy: the browser refuses anything not listed here.
    // Astro adds exact fingerprints (hashes) of our own scripts and styles,
    // so an injected script cannot run even if one ever got into the page.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        'frame-src https://my.spline.design',   // the landing orb
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",                // no other site may embed this one
        'upgrade-insecure-requests',
      ],
      scriptDirective: { hashes: [sha256(HEAD_INIT)] },
      styleDirective: { hashes: [sha256(NOSCRIPT_CSS)] },
    },
  } : {},

  // Server settings, read when the server runs (never baked into the build
  // and never sent to the browser). Values: .env locally, Vercel settings live.
  env: {
    schema: {
      GEMINI_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      GEMINI_MODEL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CHAT_ENABLED: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
