import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Must match the GitHub repo name: https://<user>.github.io/<repo>/
const BASE = '/normalday/';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Icons are generated from public/favicon.svg (see pwa-assets.config.ts)
      pwaAssets: { config: true },
      manifest: {
        id: BASE,
        name: 'Normalday — เครื่องมือประจำวัน',
        short_name: 'Normalday',
        description: 'Everyday calculators and quick references for life in Thailand',
        lang: 'th',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        theme_color: '#2F7E77',
        background_color: '#EDF1EF',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
});
