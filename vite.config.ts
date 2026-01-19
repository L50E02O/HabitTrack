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
      includeAssets: ['icon-192.png', 'icon-512.png', 'badge.png'],
      filename: 'sw.js',
      strategies: 'generateSW',
      injectRegister: 'auto',
      manifestFilename: 'manifest.webmanifest',
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
    // NOTA: El servidor debe estar corriendo en puerto 3001 (npm run dev:api)
    // Si no está corriendo, las peticiones fallarán con error 503.
    // Solución: Ejecuta 'npm run dev:api' en otra terminal
    // Ver docs/DESARROLLO_LOCAL.md para más información
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        // Manejar errores de conexión de manera más silenciosa
        configure: (proxy, _options) => {
          let lastErrorTime = 0;
          const ERROR_THROTTLE_MS = 10000; // Mostrar error máximo cada 10 segundos
          
          proxy.on('error', (err, req, res) => {
            const now = Date.now();
            // Solo mostrar el error si pasó suficiente tiempo desde el último
            if (now - lastErrorTime > ERROR_THROTTLE_MS) {
              console.warn('\n[Vite Proxy] ⚠️  El servidor API en localhost:3001 no está disponible.');
              console.warn('[Vite Proxy] 💡 Ejecuta "npm run dev:api" en otra terminal para habilitar las APIs.');
              console.warn('[Vite Proxy] 📖 Ver docs/DESARROLLO_LOCAL.md para más información.\n');
              lastErrorTime = now;
            }
            
            // Responder con un error 503 para que el cliente pueda manejarlo
            if (res && !res.headersSent) {
              res.writeHead(503, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({
                error: 'Servidor API no disponible. Ejecuta "npm run dev:api" en otra terminal.'
              }));
            }
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
