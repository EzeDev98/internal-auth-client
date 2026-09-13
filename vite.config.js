import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Step 3E: installable-only PWA - no offline support, so no precache
    // strategy (globPatterns: []). The service worker exists purely to
    // satisfy install criteria; this app is strictly online-use.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'WM Internal Auth Admin Console',
        short_name: 'Auth Admin',
        start_url: '/',
        display: 'standalone',
        theme_color: '#0f1b3d',
        background_color: '#0f1b3d',
        icons: [
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: [],
      },
    }),
  ],
})
