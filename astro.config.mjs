// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Every page stays a static file. Only files that say
  // `export const prerender = false` (the /api routes) run on Vercel's server.
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
});
