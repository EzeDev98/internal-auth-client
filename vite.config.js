import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Auto versioning for the service worker (see the VitePWA config comment
// below) - a fresh value every time `vite build`/`vite dev` evaluates this
// file, with no manual bump required.
const buildVersion = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_BUILD_VERSION__: JSON.stringify(buildVersion),
  },
  plugins: [
    react(),
    // Step 3E: installable-only PWA - no offline support, so no precache
    // strategy (globPatterns: []). The service worker exists purely to
    // satisfy install criteria; this app is strictly online-use.
    //
    // App-update feature: registerType changed from 'autoUpdate' to
    // 'prompt' so a new service worker installs and WAITS instead of
    // silently activating - App.jsx's UpdatePrompt controls exactly when
    // it takes over, via the update modal. injectRegister is off because
    // that manual registration happens ourselves through
    // virtual:pwa-register/react (UpdatePrompt.jsx) - leaving the default
    // 'auto' injection on would register the service worker a second,
    // independent time with none of our onNeedRefresh wiring.
    //
    // Auto versioning: with globPatterns: [] there's nothing that
    // naturally changes in the generated service worker between deploys,
    // so the browser's own update check (a byte-for-byte diff of the SW
    // file) would rarely see a difference and updates would go
    // undetected. cacheId is baked into the generated SW's source as a
    // literal string (it's how Workbox namespaces its cache storage
    // entries), so tying it to a value that's different on every build -
    // here, the build timestamp captured once when this config file is
    // evaluated - guarantees the SW file's bytes differ every deploy,
    // without ever precaching real app content. __APP_BUILD_VERSION__ is
    // the same value, exposed to app code via `define` below in case it's
    // ever useful (e.g. a debug footer).
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon-32.png', 'favicon-64.png', 'apple-touch-icon.png'],
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
        cacheId: `internal-auth-client-${buildVersion}`,
      },
    }),
  ],
})
