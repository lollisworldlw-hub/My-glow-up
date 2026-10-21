import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BUILD_ID = Date.now().toString(36);
// writes dist/version.json so open apps can notice a new deploy
const versionFile = () => ({
  name: 'glowup-version',
  apply: 'build' as const,
  writeBundle(opts: any) { writeFileSync(resolve(opts.dir ?? 'dist', 'version.json'), JSON.stringify({ id: BUILD_ID })); }
});

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    versionFile(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon-32.png'],
      manifest: {
        name: 'My Glow-Up',
        short_name: 'Glow-Up',
        description: 'My personal wellness planner — meals, workouts, progress.',
        theme_color: '#FFF9F7',
        background_color: '#FFF9F7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true
      }
    })
  ],
  test: { environment: 'node' },
  build: { chunkSizeWarningLimit: 1200 }
} as any);
