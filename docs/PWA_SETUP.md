# Configuración PWA - HabitTrack

## Configuración completada

La aplicación ahora está configurada como PWA (Progressive Web App) con soporte completo para notificaciones.

## Resumen de cambios

### 1. **Error del Proxy ECONNREFUSED**

**Problema:** El error `ECONNREFUSED` ocurre porque Vite intenta redirigir las peticiones `/api` a `http://localhost:4000`, pero el servidor no está corriendo.

**Solución:**
- Ejecuta el servidor API en otra terminal: `npm run dev:api`
- O configura la variable de entorno `VITE_API_BASE_URL` para usar una API en producción
- El código ahora tiene un fallback que usa Supabase directamente si el endpoint no está disponible

### 2. Configuración PWA

#### Archivos creados
- `public/manifest.json`: manifest de la PWA.
- `public/sw.js`: Service Worker personalizado.
- `src/utils/pwaService.ts`: utilidades para PWA.
- Configuración en `vite.config.ts` con `vite-plugin-pwa`.

#### Funcionalidades implementadas
- Service Worker para notificaciones en background.
- Cache de recursos estáticos.
- Notificaciones push cuando la aplicación está cerrada (si está totalmente configurado).
- Instalación como aplicación nativa.
- Soporte offline básico.

## Cómo usar

### Desarrollo local

1. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Iniciar el servidor API (en otra terminal):
   ```bash
   npm run dev:api
   ```
   **Nota:** Necesitas las variables de entorno `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`

### Producción

1. Construir la aplicación:
   ```bash
   npm run build
   ```

2. Previsualizar:
   ```bash
   npm run preview
   ```

## Instalación como PWA

1. Abre la aplicación en un navegador compatible (Chrome, Edge, Safari)
2. Busca el botón de "Instalar" en la barra de direcciones
3. O ve a Configuración > Instalar aplicación
4. La app se instalará y podrás abrirla como una app nativa

## Notificaciones

### Solicitar permisos

Las notificaciones se solicitan automáticamente cuando:
- El usuario crea un recordatorio
- El usuario accede a funciones que requieren notificaciones

### Funcionamiento

- Con Service Worker activo: las notificaciones pueden funcionar incluso cuando la aplicación está cerrada.
- Sin Service Worker: las notificaciones solo funcionan cuando la aplicación está abierta.
- Recordatorios programados: se verifican cada minuto y envían notificaciones a la hora configurada.

## Iconos requeridos

Necesitas crear los siguientes iconos en la carpeta `public/`:

- `icon-192.png` - Icono 192x192px
- `icon-512.png` - Icono 512x512px
- `badge.png` - Badge para notificaciones (opcional, 96x96px)

### Generar iconos

Puedes usar herramientas como:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- Cualquier editor de imágenes

## Configuración avanzada

### Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_BASE_URL=https://tu-api.vercel.app
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Personalizar el Service Worker

El Service Worker está en `public/sw.js`. Puedes modificarlo para:
- Agregar más estrategias de cache
- Personalizar las notificaciones
- Agregar sincronización en background

## Solución de problemas

### Las notificaciones no funcionan

1. Verifica que el navegador soporte notificaciones
2. Verifica que tengas permisos otorgados
3. Abre las DevTools > Application > Service Workers y verifica que esté activo
4. Revisa la consola para errores

### El Service Worker no se registra

1. Verifica que estés usando HTTPS (o localhost en desarrollo)
2. Revisa la consola del navegador
3. Verifica que `public/sw.js` exista y sea accesible

### Error del proxy en desarrollo

Si ves errores `ECONNREFUSED`:
- Ejecuta `npm run dev:api` en otra terminal
- O configura `VITE_API_BASE_URL` para usar una API remota
- La app funcionará pero el ranking puede no cargar correctamente

## Recursos

- [MDN - Service Workers](https://developer.mozilla.org/es/docs/Web/API/Service_Worker_API)
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

