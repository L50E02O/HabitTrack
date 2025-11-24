import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['manifest.json'],
      filename: 'sw.js',
      strategies: 'generateSW',
      injectRegister: 'auto',
      manifest: {
        name: 'HabitTrack - Seguimiento de Hábitos',
        short_name: 'HabitTrack',
        description: 'Aplicación para rastrear y mejorar tus hábitos diarios',
        theme_color: '#4a90e2',
        background_color: '#1a1a1a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Ver tu dashboard de hábitos',
            url: '/dashboard',
            icons: [{ 
              src: '/icon-192.png', 
              sizes: '192x192',
              type: 'image/png'
            }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Configurar NavigationRoute para manejar todas las rutas de la SPA
        // Esto permite que el router del cliente maneje el enrutamiento
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/./], // Permitir todas las rutas (patrón estándar de Workbox)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    // Proxy /api to local dev API when running vite in development.
    // NOTA: El servidor debe estar corriendo en puerto 4000 (npm run dev:api)
    // Si no está corriendo, verás errores ECONNREFUSED. 
    // Solución: Ejecuta 'npm run dev:api' en otra terminal
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        // Si el servidor no está disponible, no fallar silenciosamente
        configure: (proxy, _options) => {
          proxy.on('error', (_err, _req, _res) => {
            console.warn('[Vite Proxy] El servidor API en localhost:4000 no está disponible.');
            console.warn('[Vite Proxy] Ejecuta "npm run dev:api" en otra terminal para solucionarlo.');
            console.warn('[Vite Proxy] La app funcionará pero el ranking puede no cargar correctamente.');
          });
        }
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
