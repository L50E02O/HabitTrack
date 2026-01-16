# Instalación de Dependencias para Google Fit

## Dependencias Requeridas

```bash
npm install googleapis google-auth-library express cors
```

O con especificaciones de versión:

```bash
npm install googleapis@^118.0.0 google-auth-library@^9.0.0 express@^5.2.0 cors@^2.8.5
```

## Dependencias de Desarrollo (ya tienes)

```bash
npm install --save-dev typescript @types/node @types/express
```

## Variables de Entorno Requeridas

Crea o actualiza tu archivo `.env`:

```env
# Google Fit OAuth2
GOOGLE_FIT_CLIENT_ID=TU_CLIENT_ID.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=TU_CLIENT_SECRET
GOOGLE_FIT_REDIRECT_URI=http://localhost:3001/api/google-fit/callback

# En producción
# GOOGLE_FIT_REDIRECT_URI=https://tu-dominio.com/api/google-fit/callback
```

## Obtener Credenciales de Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto (o selecciona uno existente)
3. Busca "Fitness API" y actívala
4. Ve a "Credenciales" → "Crear credenciales" → "ID de cliente OAuth 2.0"
5. Tipo: "Aplicación web"
6. URIs autorizados:
   - `http://localhost:3001/api/google-fit/callback` (desarrollo)
   - `https://tu-dominio.com/api/google-fit/callback` (producción)
7. Copia `Client ID` y `Client Secret`

## Scopes Utilizados

- `https://www.googleapis.com/auth/fitness.activity.read` - Leer datos de actividad
- `https://www.googleapis.com/auth/fitness.location.read` - Leer datos de ubicación
- `https://www.googleapis.com/auth/userinfo.email` - Leer correo del usuario

## Estructura de Archivos Creados

```
src/
  services/
    googleFit/
      types.ts              # Interfaces TypeScript
      googleFitService.ts   # Lógica de autenticación y API
      routes.ts             # Rutas Express
      client.ts             # Cliente para el frontend
  hooks/
    useGoogleFit.ts         # Hook de React
  components/
    GoogleFitConnection.tsx # Componente React
    GoogleFitConnection.css # Estilos

database/
  migrations/
    20260111_google_fit_tokens.sql  # Tabla para almacenar tokens

scripts/
  dev-api-google-fit-example.js     # Ejemplo de integración Express
```

## Uso en Componentes React

```typescript
import GoogleFitConnection from './components/GoogleFitConnection';

export default function App() {
  const userId = 'user-id-desde-auth';
  
  return (
    <GoogleFitConnection userId={userId} />
  );
}
```

## Uso en Backend

```typescript
import googleFitService from './services/googleFit/googleFitService';

// Obtener URL de autenticación
const authUrl = googleFitService.getAuthUrl();

// Intercambiar código por tokens
const tokens = await googleFitService.exchangeCodeForTokens(code);

// Obtener pasos
const stepsData = await googleFitService.getDailySteps(tokens);

// Refrescar token expirado
const newTokens = await googleFitService.refreshAccessToken(refreshToken);
```

## Flujo de Autenticación

```
1. Usuario hace clic en "Conectar Google Fit"
2. Se redirige a Google OAuth consent screen
3. Usuario autoriza la app
4. Google redirige a /api/google-fit/callback?code=CODE
5. Backend intercambia código por access_token y refresh_token
6. Backend almacena tokens en Supabase (tabla google_fit_tokens)
7. Frontend puede solicitar datos usando userId
```

## Testing en Desarrollo

```bash
# 1. Instala dependencias
npm install

# 2. Inicia el servidor de API
npm run dev:api

# 3. En otra terminal, inicia el frontend
npm run dev

# 4. Abre en el navegador
http://localhost:5173
```

## Manejo de Errores

El servicio maneja automáticamente:

- **Tokens expirados**: Usa refresh_token automáticamente
- **Errores de autenticación**: Proporciona mensajes claros
- **Respuestas vacías**: Retorna datos con valores 0
- **Límites de API**: Implementa retry logic (opcional)

## Límites de la API de Google Fit

- **Requests por segundo**: 600 QPM
- **Datos históricos**: Hasta 10 años
- **Granularidad**: Milisegundos
- **Actualizaciones**: En tiempo real

## Seguridad

- ✅ Tokens almacenados en Supabase con Row Level Security
- ✅ Refresh tokens nunca se exponen al frontend
- ✅ Access tokens con expiración corta (1 hora)
- ✅ CORS configurado para tu dominio
- ✅ Validación de userId en todas las rutas
