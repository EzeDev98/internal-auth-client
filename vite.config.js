// Vite configuration with the React and PWA plugins.
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const buildVersion = new Date().toISOString()

export default defineConfig({
  define: {
    __APP_BUILD_VERSION__: JSON.stringify(buildVersion),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon-32.png', 'favicon-64.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'InternalAuth',
        short_name: 'InternalAuth',
        start_url: '/',
        display: 'standalone',
        theme_color: '#0f1b3d',
        background_color: '#FFFFFF',
        icons: [
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: [],
        navigateFallback: null,
        cacheId: `internal-auth-client-${buildVersion}`,
      },
    }),
  ],
})
