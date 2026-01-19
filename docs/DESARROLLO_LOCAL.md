# Desarrollo Local

## Configuración del Entorno de Desarrollo

### Servidor de Desarrollo

Para desarrollo local, necesitas ejecutar dos servidores:

1. **Frontend (Vite)**: `npm run dev`
   - Se ejecuta en `http://localhost:5173`
   - Maneja el frontend React

2. **Backend API (Express)**: `npm run dev:api`
   - Se ejecuta en `http://localhost:3001`
   - Maneja las rutas `/api/*` (Google Fit, Ranking, Health Connect)

### Configuración del Proxy

El archivo `vite.config.ts` está configurado para hacer proxy de todas las peticiones `/api/*` al servidor backend en `localhost:3001`.

**Si el servidor backend no está corriendo:**
- Verás advertencias en la consola del servidor Vite
- Las peticiones a `/api/*` fallarán con error 503
- El frontend funcionará, pero Google Fit y el ranking no cargarán

**Solución:**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend API
npm run dev:api
```

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Google Fit
GOOGLE_FIT_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=tu_client_secret
GOOGLE_FIT_REDIRECT_URI=http://localhost:3001/api/google-fit/callback

# Frontend URL (opcional)
FRONTEND_URL=http://localhost:5173
```

## Notas Importantes

- El backend local (`npm run dev:api`) es **solo para desarrollo**
- En producción, las funciones serverless de Vercel manejan las rutas `/api/*`
- Si no necesitas probar Google Fit o el ranking localmente, puedes omitir ejecutar `npm run dev:api`
