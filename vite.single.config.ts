// Single-file build: everything (JS, CSS, fonts) inlined into one index.html.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: { alias: { 'virtual:pwa-register': fileURLToPath(new URL('./src/stubs/pwa-register.ts', import.meta.url)) } },
  build: { outDir: 'dist-single', assetsInlineLimit: 100000000, chunkSizeWarningLimit: 5000 }
});
