import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          id: '/',
          name: 'Parallel Eats',
          short_name: 'Parallel Eats',
          description:
            'QR + WhatsApp hostel restaurant and vendor-supply ordering.',
          theme_color: '#090d16',
          background_color: '#090d16',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
      server: {
        // HMR is disabled in AI Studio via DISABLE_HMR env var.
        // Do not modify—file watching is disabled to prevent flickering during agent edits.
        hmr: process.env.DISABLE_HMR !== 'true',
        // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
        watch:
          process.env.DISABLE_HMR === 'true'
            ? null
            : {
                ignored: ['**/.opencode/**', '**/.git/**', '**/dev-dist/**', '**/.gemini/**'],
              },
      },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'server.test.ts', 'functions/**/*.test.ts', 'worker/**/*.test.ts'],
      css: false,
      testTimeout: 15000,
    },
  };
});
