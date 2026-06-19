import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'shared/logo-bna.png',
        'shared/mate.png',
        'shared/idle-video.mp4',
        'imagenes/bg-home.png',
        'imagenes/bg-game.png',
        'videos/bg-home.png',
        'videos/bg-game.png',
        'videos/watermark.png',
        'launcher/selfie.png',
        'launcher/video.png',
        'launcher/tractor.png',
        'fonts/Kievit-Bold.ttf',
        'fonts/Kievit-Medium.ttf',
        'fonts/Kievit-Black.ttf',
      ],
      manifest: {
        name: 'BNA — Juegos IA Campo Argentino',
        short_name: 'Campo AR',
        description: 'Juegos de IA — Campo Argentino (BNA): imágenes, videos y más',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#003a5c',
        theme_color: '#003a5c',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webp,woff,woff2,ttf,mp4}'],
        maximumFileSizeToCacheInBytes: 40 * 1024 * 1024,
        // The public download routes must hit a real document (to read ?u=),
        // never the cached SPA shell.
        navigateFallbackDenylist: [/^\/imagenes\/descargar/, /^\/videos\/descargar/],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@imagenes': path.resolve(__dirname, './src/games/imagenes'),
      '@videos': path.resolve(__dirname, './src/games/videos'),
      '@juego-tractor': path.resolve(__dirname, './src/games/juego-tractor'),
    },
  },
});
