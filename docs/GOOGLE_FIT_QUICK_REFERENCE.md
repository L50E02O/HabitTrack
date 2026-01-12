# Google Fit API - Referencia Rápida

## Instalación Rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env
GOOGLE_FIT_CLIENT_ID=...
GOOGLE_FIT_CLIENT_SECRET=...
GOOGLE_FIT_REDIRECT_URI=http://localhost:3001/api/google-fit/callback

# 3. Ejecutar migración SQL en Supabase
-- Contenido de: database/migrations/20260111_google_fit_tokens.sql

# 4. Iniciar servidor
npm run dev:api
```

## Uso en Componentes

### Opción 1: Componente Completo (Recomendado)

```typescript
import GoogleFitConnection from './components/GoogleFitConnection';

export default function Dashboard({ userId }: { userId: string }) {
  return <GoogleFitConnection userId={userId} />;
}
```

### Opción 2: Hook Personalizado

```typescript
import { useGoogleFit } from './hooks/useGoogleFit';

function MisEstadisticas({ userId }: { userId: string }) {
  const { stepsData, loading, error, initiateLogin } = useGoogleFit({ userId });

  if (!stepsData) {
    return <button onClick={initiateLogin}>Conectar Google Fit</button>;
  }

  return <div>Pasos: {stepsData.steps}</div>;
}
```

### Opción 3: Cliente Directo

```typescript
import googleFitClient from './services/googleFit/client';

const stepsData = await googleFitClient.getDailySteps(userId);
console.log(stepsData.steps); // 8234
```

## Endpoints API

### Obtener URL de Autenticación
```bash
GET /api/google-fit/auth
→ { authUrl: "https://accounts.google.com/..." }
```

### Callback de Google
```bash
GET /api/google-fit/callback?code=CODE&state=USER_ID
→ { success: true, message: "..." }
```

### Obtener Pasos del Día
```bash
GET /api/google-fit/steps?userId=USER_ID&date=2025-01-11
→ {
    date: "2025-01-11",
    steps: 8234,
    calories: 450,
    distance: 5.82
  }
```

### Obtener Rango de Pasos
```bash
GET /api/google-fit/steps-range?userId=USER_ID&startDate=2025-01-01&endDate=2025-01-31
→ [
    { date: "2025-01-01", steps: 8000, calories: 400, distance: 5.5 },
    { date: "2025-01-02", steps: 12000, calories: 600, distance: 8.2 },
    ...
  ]
```

### Desconectar Usuario
```bash
POST /api/google-fit/revoke?userId=USER_ID
→ { success: true, message: "..." }
```

## Tipos TypeScript

```typescript
// Datos diarios
interface DailyStepsData {
  date: string;       // "2025-01-11"
  steps: number;      // 8234
  calories: number;   // 450
  distance: number;   // 5.82
}

// Tokens de Google
interface GoogleFitTokens {
  access_token: string;   // Para API calls
  refresh_token: string;  // Para refrescar acceso
  expiry_date: number;    // Timestamp de expiración
  token_type: string;     // "Bearer"
}
```

## Hook useGoogleFit

```typescript
const {
  stepsData,           // DailyStepsData | null
  stepsRange,          // DailyStepsData[]
  loading,             // boolean
  error,               // string | null
  isAuthenticated,     // boolean
  refreshSteps,        // (date?: Date) => Promise<void>
  getStepsRange,       // (start: Date, end: Date) => Promise<void>
  initiateLogin,       // () => Promise<void>
  revoke               // () => Promise<void>
} = useGoogleFit({ userId, autoFetch?: true });
```

## Variables de Entorno Requeridas

```env
# Google Fit OAuth2
GOOGLE_FIT_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_FIT_REDIRECT_URI=http://localhost:3001/api/google-fit/callback

# Supabase (si no lo tienes)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

## Flujo de Autenticación (4 pasos)

```
1. Usuario hace clic en "Conectar Google Fit"
   ↓ initiateLogin() o <GoogleFitConnection />
2. Redirige a Google OAuth consent
   ↓ googleFitClient.getAuthUrl()
3. Usuario autoriza
   ↓ Google redirige a /api/google-fit/callback?code=CODE
4. Backend intercambia código por tokens
   ↓ googleFitService.exchangeCodeForTokens(code)
   ↓ Guarda en Supabase (google_fit_tokens)
✓ Usuario conectado - puede solicitar datos
```

## Obtener Pasos (3 pasos)

```
1. Frontend solicita pasos
   ↓ googleFitClient.getDailySteps(userId)
2. Backend obtiene tokens de Supabase
   ↓ Verifica si están expirados
   ↓ Si están expirados, refresca automáticamente
3. Llama a Google Fit API
   ↓ POST https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate
   ↓ Parsea respuesta
✓ Retorna: { date, steps, calories, distance }
```

## Manejo de Errores Comunes

### REDIRECT_URI_MISMATCH
```
Causa: URL de callback diferente en .env y Google Cloud
Solución: Verifica que GOOGLE_FIT_REDIRECT_URI sea exactamente igual
```

### Token Expirado
```
Causa: Access token expiró (1 hora)
Solución: Service lo refresca automáticamente usando refresh_token
```

### Token de refresco inválido
```
Causa: Usuario revocó permisos en Google
Solución: Pedir que se vuelva a conectar
```

### No hay datos
```
Causa: El usuario no tiene dispositivo enviando datos a Google Fit
Solución: Sincronizar smartwatch/teléfono con Google Fit
```

## Tabla de Base de Datos

```sql
CREATE TABLE google_fit_tokens (
  id UUID PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMP NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Row Level Security: usuarios solo ven sus propios tokens
```

## Scopes de Google

La integración solicita:
- `fitness.activity.read` - Leer pasos, calorías, distancia
- `fitness.location.read` - Leer ubicación
- `userinfo.email` - Leer correo (opcional)

Todos son **solo lectura** (no modifica datos).

## Opciones de Configuración

```typescript
// Usar componente con opciones
interface GoogleFitConnectionProps {
  userId: string;  // Requerido: ID del usuario
}

// Usar hook con opciones
interface UseGoogleFitOptions {
  userId: string;        // Requerido
  autoFetch?: boolean;   // Opcional: true por defecto
}
```

## Integración con Hábitos (Ejemplo)

```typescript
// Registrar pasos como hábito completado
async function syncStepsWithHabit(userId: string) {
  const stepsData = await googleFitClient.getDailySteps(userId);
  
  const metaPasos = 10000;
  const completado = stepsData.steps >= metaPasos;
  
  await supabase.from('registros').insert({
    id_habito: 'pasos-diarios',
    id_perfil: userId,
    fecha: stepsData.date,
    completado,
    descripcion: `${stepsData.steps} pasos`
  });
}
```

## Testing Manual

```bash
# 1. Abre en navegador
http://localhost:3001/api/google-fit/auth

# 2. Deberías ver JSON con authUrl
{ "authUrl": "https://..." }

# 3. Abre la authUrl en navegador
# 4. Autoriza en Google
# 5. Serás redirigido a /callback
# 6. Ahora puedes solicitar datos
```

## Comandos Útiles

```bash
# Instalar dependencias
npm install

# Iniciar servidor API
npm run dev:api

# Iniciar aplicación web
npm run dev

# Ver logs de errores SQL
# Supabase Console → Logs → postgres
```

## Recursos

| Recurso | Enlace |
|---------|--------|
| Documentación Completa | [GOOGLE_FIT_README.md](./GOOGLE_FIT_README.md) |
| Guía de Instalación | [GOOGLE_FIT_INSTALACION.md](./GOOGLE_FIT_INSTALACION.md) |
| Ejemplos de Código | [GOOGLE_FIT_EJEMPLOS.md](./GOOGLE_FIT_EJEMPLOS.md) |
| Arquitectura | [GOOGLE_FIT_ARQUITECTURA.md](./GOOGLE_FIT_ARQUITECTURA.md) |
| Setup Avanzado | [GOOGLE_FIT_SETUP.md](./GOOGLE_FIT_SETUP.md) |
| Google Fit API Docs | https://developers.google.com/fit/rest/v1/overview |
| Google OAuth Docs | https://developers.google.com/identity/protocols/oauth2 |

## Versiones

| Componente | Versión |
|-----------|---------|
| googleapis | ^118.0.0 |
| google-auth-library | ^9.0.0 |
| express | ^5.2.1 |
| React | ^19.1.1 |
| TypeScript | ~5.9.3 |

## Soporte Rápido

**¿Dónde está cada cosa?**
```
Lógica OAuth2 → src/services/googleFit/googleFitService.ts
Rutas API → src/services/googleFit/routes.ts
Componente UI → src/components/GoogleFitConnection.tsx
Hook React → src/hooks/useGoogleFit.ts
Tabla BD → database/migrations/20260111_google_fit_tokens.sql
```

**¿Cómo funciona?**
- [GOOGLE_FIT_ARQUITECTURA.md](./GOOGLE_FIT_ARQUITECTURA.md) tiene diagramas

**¿Cómo lo uso?**
- [GOOGLE_FIT_EJEMPLOS.md](./GOOGLE_FIT_EJEMPLOS.md) tiene código

**¿Cómo lo configuro?**
- [GOOGLE_FIT_INSTALACION.md](./GOOGLE_FIT_INSTALACION.md) paso a paso

**¿Tengo un problema?**
- [GOOGLE_FIT_README.md](./GOOGLE_FIT_README.md) sección Troubleshooting
