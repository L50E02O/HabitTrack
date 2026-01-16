# Google Fit API - Instrucciones de Uso

## ✅ Cambios Realizados

Se ha eliminado completamente la integración de Health Connect y se ha reemplazado por Google Fit API.

### Archivos Eliminados/Deprecados:
- `src/core/components/Smartwatch/` - Componente de Health Connect
- `src/services/smartwatch/` - Servicio de Health Connect
- `src/types/ISmartwatch.ts` - Tipos de Health Connect
- `SETUP_HEALTH_CONNECT.md` - Documentación de Health Connect

### Archivos Nuevos/Actualizados:
- `src/components/GoogleFitConnection.tsx` - Componente de Google Fit
- `src/hooks/useGoogleFit.ts` - Hook para Google Fit
- `src/services/googleFit/` - Servicios de Google Fit
- `scripts/googleFitRoutes.js` - Rutas del servidor backend
- `scripts/dev-api.js` - Servidor backend actualizado

## 🚀 Cómo Ejecutar

### 1. Verificar Variables de Entorno

Asegúrate de que tu archivo `.env` contenga:

```env
# Supabase
VITE_SUPABASE_URL=https://pahegdcyadnndhbtzaps.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_URL=https://pahegdcyadnndhbtzaps.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Google Fit API
GOOGLE_FIT_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_FIT_REDIRECT_URI=http://localhost:3001/api/google-fit/callback
```

### 2. Iniciar el Servidor Backend

Abre una terminal y ejecuta:

```bash
npm run dev:api
```

Deberías ver:
```
🔧 Iniciando servidor...
📍 SUPABASE_URL: Configurado ✓
🔑 SUPABASE_SERVICE_ROLE_KEY: Configurado ✓
🏋️ GOOGLE_FIT_CLIENT_ID: Configurado ✓
📦 Cargando rutas de Google Fit...

✅ Servidor corriendo exitosamente!
🌐 URL: http://localhost:3001
🏋️ Google Fit API: http://localhost:3001/api/google-fit
💊 Health Connect Mock: http://localhost:3001/api/health-connect
```

### 3. Iniciar el Frontend

En otra terminal, ejecuta:

```bash
npm run dev
```

### 4. Probar la Integración

1. Abre http://localhost:5173 en tu navegador
2. Inicia sesión en la aplicación
3. En el dashboard, verás el componente "Sincronizar con Google Fit"
4. Haz clic en "Conectar Google Fit"
5. Serás redirigido a Google para autorizar la aplicación
6. Después de autorizar, verás tus datos de pasos, calorías y distancia

## 🔍 Endpoints Disponibles

### Google Fit API

- `GET /api/google-fit/auth` - Obtener URL de autenticación
- `GET /api/google-fit/callback` - Callback de OAuth2
- `GET /api/google-fit/steps?userId=USER_ID` - Obtener pasos del día
- `GET /api/google-fit/steps-range?userId=USER_ID&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Obtener rango de pasos
- `POST /api/google-fit/revoke?userId=USER_ID` - Revocar autorización

### Health Connect Mock (Deprecado)

Estas rutas aún existen para compatibilidad pero están deprecadas:
- `GET /api/health-connect/estado`
- `GET /api/health-connect/permisos`
- `GET /api/health-connect/datos`

## 🐛 Solución de Problemas

### Error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"

Verifica que tu archivo `.env` esté en la raíz del proyecto y contenga las variables correctas.

### Error 404 en /api/google-fit/steps

Asegúrate de que el servidor backend esté corriendo (`npm run dev:api`).

### Error: "Usuario no autenticado con Google Fit"

1. Haz clic en "Conectar Google Fit" en el dashboard
2. Autoriza la aplicación en Google
3. Espera a que se complete la redirección

### El servidor no inicia

1. Verifica que tengas Node.js o Bun instalado
2. Ejecuta `npm install` para instalar dependencias
3. Verifica que el puerto 3001 no esté en uso

## 📝 Notas Importantes

- El servidor backend debe estar corriendo en el puerto 3001
- El frontend debe estar corriendo en el puerto 5173
- Las credenciales de Google Fit deben estar configuradas en Google Cloud Console
- La tabla `google_fit_tokens` debe existir en Supabase

## 🔐 Configuración de Google Cloud

1. Ve a https://console.cloud.google.com/
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Fit
4. Crea credenciales OAuth 2.0:
   - Tipo: Aplicación web
   - URI de redirección autorizada: `http://localhost:3001/api/google-fit/callback`
5. Copia el Client ID y Client Secret al archivo `.env`

## 📊 Base de Datos

Asegúrate de que la tabla `google_fit_tokens` exista en Supabase:

```sql
CREATE TABLE IF NOT EXISTS google_fit_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
