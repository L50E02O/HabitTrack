# Integración Google Fit API - Guía Completa

## Resumen

He creado una integración modular y completa de Google Fit REST API en tu aplicación HabitTrack. La solución permite sincronizar automáticamente pasos, calorías y distancia desde Google Fit hacia tu plataforma web.

## Características

✅ **Autenticación OAuth2** - Flujo seguro con Google  
✅ **Manejo de Tokens** - Refresh automático de tokens expirados  
✅ **Almacenamiento Seguro** - Tokens en Supabase con RLS  
✅ **Hook React** - `useGoogleFit` para fácil integración  
✅ **Componente UI** - `GoogleFitConnection` listo para usar  
✅ **Tipo-Safe** - TypeScript completo  
✅ **Escalable** - Arquitectura modular

## Estructura de Carpetas

```
src/
├── services/googleFit/
│   ├── types.ts                 # Interfaces TypeScript
│   ├── googleFitService.ts       # Lógica principal (backend)
│   ├── routes.ts                # Rutas Express
│   └── client.ts                # Cliente frontend
├── hooks/
│   └── useGoogleFit.ts          # Hook de React
└── components/
    ├── GoogleFitConnection.tsx  # Componente React
    └── GoogleFitConnection.css  # Estilos

database/migrations/
└── 20260111_google_fit_tokens.sql  # Tabla para almacenar tokens

docs/
├── GOOGLE_FIT_SETUP.md          # Configuración
└── GOOGLE_FIT_EJEMPLOS.md       # Ejemplos de uso
```

## Instalación Rápida

### 1. Instalar Dependencias

```bash
npm install
```

Esto instalará:
- `googleapis` - Cliente de Google APIs
- `google-auth-library` - Manejo de OAuth2
- `express` - Servidor backend
- `cors` - CORS middleware

### 2. Configurar Variables de Entorno

Copia `.env.example` a `.env` y rellena:

```env
GOOGLE_FIT_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=tu_client_secret
GOOGLE_FIT_REDIRECT_URI=http://localhost:3001/api/google-fit/callback
```

### 3. Obtener Credenciales de Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo
3. Busca "Fitness API" y actívala
4. Ve a **Credenciales** → **Crear credenciales** → **ID de cliente OAuth 2.0**
5. Tipo: **Aplicación web**
6. URIs autorizados (agregar ambas):
   - `http://localhost:3001/api/google-fit/callback`
   - `https://tu-dominio.com/api/google-fit/callback` (para producción)
7. Copia **Client ID** y **Client Secret**

### 4. Ejecutar Migración de Base de Datos

Ejecuta el script SQL en Supabase:

```sql
-- Accede a Supabase Console → SQL Editor
-- Copia el contenido de: database/migrations/20260111_google_fit_tokens.sql
-- Ejecuta
```

### 5. Iniciar Servidor

```bash
# Terminal 1 - Servidor de API
npm run dev:api

# Terminal 2 - Aplicación web
npm run dev
```

## Uso en Componentes

### Opción 1: Componente Completo (Recomendado)

```typescript
import GoogleFitConnection from './components/GoogleFitConnection';

export default function Dashboard() {
  return (
    <GoogleFitConnection userId="user-id-del-usuario" />
  );
}
```

### Opción 2: Hook Personalizado

```typescript
import { useGoogleFit } from './hooks/useGoogleFit';

function MisEstadisticas({ userId }: { userId: string }) {
  const { stepsData, loading, error, refreshSteps, initiateLogin } = 
    useGoogleFit({ userId });

  if (!stepsData) {
    return (
      <button onClick={initiateLogin}>
        Conectar Google Fit
      </button>
    );
  }

  return (
    <div>
      <p>Pasos: {stepsData.steps}</p>
      <p>Calorías: {stepsData.calories}</p>
      <button onClick={() => refreshSteps()}>
        Actualizar
      </button>
    </div>
  );
}
```

## Endpoints API

### Autenticación

```bash
GET /api/google-fit/auth
Respuesta: { authUrl: "https://accounts.google.com/..." }
```

```bash
GET /api/google-fit/callback?code=CODE&state=USER_ID
Respuesta: { success: true, message: "..." }
```

### Obtener Datos

```bash
GET /api/google-fit/steps?userId=USER_ID&date=2025-01-11
Respuesta: {
  date: "2025-01-11",
  steps: 8234,
  calories: 450,
  distance: 5.82
}
```

```bash
GET /api/google-fit/steps-range?userId=USER_ID&startDate=2025-01-01&endDate=2025-01-31
Respuesta: [
  { date: "2025-01-01", steps: 8000, calories: 400, distance: 5.5 },
  { date: "2025-01-02", steps: 12000, calories: 600, distance: 8.2 },
  ...
]
```

### Desconectar

```bash
POST /api/google-fit/revoke?userId=USER_ID
Respuesta: { success: true, message: "..." }
```

## Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario hace clic en "Conectar Google Fit"              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend obtiene authUrl y redirige a Google OAuth      │
│    GET /api/google-fit/auth → authUrl                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Usuario autoriza la aplicación en Google                │
│    - Lee permisos requeridos (fitness.activity.read)        │
│    - Hace clic en "Autorizar"                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Google redirige a tu servidor con código                │
│    GET /api/google-fit/callback?code=CODE&state=USER_ID    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Backend intercambia código por tokens                    │
│    - googleFitService.exchangeCodeForTokens(code)          │
│    - Guarda en: google_fit_tokens table                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Frontend puede solicitar datos                           │
│    GET /api/google-fit/steps?userId=USER_ID               │
└─────────────────────────────────────────────────────────────┘
```

## Manejo de Tokens

El servicio maneja automáticamente:

### Token Expirado
```typescript
const isExpired = googleFitService.isTokenExpired(expiryDate);
// true si expira en menos de 60 segundos
```

### Refrescar Token
```typescript
if (isExpired) {
  const newTokens = await googleFitService.refreshAccessToken(refreshToken);
  // Los nuevos tokens se usan automáticamente
}
```

### Almacenamiento Seguro
```
Tabla: google_fit_tokens
├── id (UUID)
├── user_id (TEXT) - ID del usuario
├── access_token (TEXT) - Token para API calls
├── refresh_token (TEXT) - Para refrescar acceso
├── expiry_date (TIMESTAMP) - Expiración
└── token_type (TEXT) - "Bearer"

Row Level Security (RLS):
- Los usuarios solo pueden ver sus propios tokens
- Los tokens se pueden refrescar automáticamente
```

## Sincronización Automática (Opcional)

Para sincronizar automáticamente con tus hábitos:

```typescript
import googleFitService from './services/googleFit/googleFitService';

// Cada hora
setInterval(async () => {
  const usuarios = await supabase
    .from('google_fit_tokens')
    .select('user_id');

  for (const { user_id } of usuarios.data || []) {
    const tokens = await obtenerTokens(user_id);
    const stepsData = await googleFitService.getDailySteps(tokens);
    
    // Registrar en hábitos
    await registrarHabito(user_id, 'pasos-diarios', stepsData.steps);
  }
}, 60 * 60 * 1000);
```

## Scopes de Google Fit

La integración solicita:

- `fitness.activity.read` - Leer datos de actividad (pasos, calorías)
- `fitness.location.read` - Leer datos de ubicación
- `userinfo.email` - Leer correo del usuario (opcional)

Todos son scopes de **solo lectura**, por lo que no modifican datos del usuario.

## Debugging

### Verificar que Google Fit funciona

```bash
# 1. Ve a http://localhost:3001/api/google-fit/auth
# 2. Copia la URL
# 3. Abre en navegador
# 4. Autoriza
# 5. Deberías ser redirigido a /callback
```

### Ver logs del servidor

```bash
# En googleFitService.ts hay logs para cada paso
console.log('URL de auth:', authUrl);
console.log('Tokens intercambiados:', tokens);
console.log('Pasos obtenidos:', stepsData);
```

### Verificar tokens en BD

```sql
SELECT * FROM google_fit_tokens WHERE user_id = 'tu-usuario';
```

## Limitaciones de Google Fit API

- **Rate Limit**: 600 peticiones por minuto
- **Datos históricos**: Últimos 10 años disponibles
- **Granularidad**: Milisegundos
- **Precisión**: Varía según el dispositivo

## Seguridad

✅ **Tokens seguros**:
- Access tokens expiración corta (1 hora)
- Refresh tokens nunca se exponen al frontend
- Row Level Security en Supabase

✅ **Validación**:
- Validación de userId en todas las rutas
- CORS configurado
- Errores genéricos (sin exponer datos internos)

✅ **HTTPS en Producción**:
- Siempre usar HTTPS
- Actualizar REDIRECT_URI
- Usar variables de entorno

## Próximos Pasos

1. **Integración con Rachas**: Sincronizar pasos con el sistema de rachas
2. **Historial de Actividad**: Guardar histórico en `datos_salud`
3. **Notificaciones**: Avisar cuando se alcancen metas
4. **Gráficos**: Mostrar progreso con charts
5. **Compartir**: Permitir compartir logros

## Problemas Comunes

### "Error: REDIRECT_URI_MISMATCH"

**Causa**: La URL de callback no coincide en Google Cloud  
**Solución**: Verifica que `GOOGLE_FIT_REDIRECT_URI` esté exactamente igual en:
1. Variables de entorno
2. Google Cloud Console

### "Error: refresh_token is undefined"

**Causa**: Usuario solo autorizó acceso único  
**Solución**: En Google Cloud, usa `access_type: 'offline'` (ya está configurado)

### "No autorizado para acceder a datos"

**Causa**: El usuario revocó permisos en Google  
**Solución**: Pide que se vuelva a conectar

## Referencias

- [Google Fit REST API Docs](https://developers.google.com/fit/rest/v1/overview)
- [Google OAuth2 Flow](https://developers.google.com/identity/protocols/oauth2)
- [Google Auth Library](https://github.com/googleapis/google-api-nodejs-client)

## Soporte

Para problemas específicos, revisa:
- [docs/GOOGLE_FIT_SETUP.md](./GOOGLE_FIT_SETUP.md)
- [docs/GOOGLE_FIT_EJEMPLOS.md](./GOOGLE_FIT_EJEMPLOS.md)
