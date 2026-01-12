# Índice de Integración Google Fit

## Archivos Creados

### Backend (Node.js/Express)

| Archivo | Descripción | Tipo |
|---------|-------------|------|
| `src/services/googleFit/types.ts` | Interfaces TypeScript | 100% Tipo-Safe |
| `src/services/googleFit/googleFitService.ts` | Lógica principal OAuth2 y API | Backend Principal |
| `src/services/googleFit/routes.ts` | Rutas Express (GET/POST) | API REST |
| `src/services/googleFit/client.ts` | Cliente para frontend | Cliente Frontend |

### Frontend (React/TypeScript)

| Archivo | Descripción | Tipo |
|---------|-------------|------|
| `src/hooks/useGoogleFit.ts` | Hook React reutilizable | Hook |
| `src/components/GoogleFitConnection.tsx` | Componente UI listo para usar | Componente React |
| `src/components/GoogleFitConnection.css` | Estilos del componente | Estilos |

### Base de Datos

| Archivo | Descripción | Tipo |
|---------|-------------|------|
| `database/migrations/20260111_google_fit_tokens.sql` | Tabla de almacenamiento de tokens | SQL Migration |

### Documentación

| Archivo | Descripción | Tipo |
|---------|-------------|------|
| `docs/GOOGLE_FIT_README.md` | Guía completa (este archivo) | Documentación |
| `docs/GOOGLE_FIT_SETUP.md` | Guía de configuración | Documentación |
| `docs/GOOGLE_FIT_EJEMPLOS.md` | Ejemplos de código | Ejemplos |
| `.env.example` | Variables de entorno de ejemplo | Configuración |

### Configuración

| Archivo | Descripción | Cambio |
|---------|-------------|--------|
| `package.json` | Dependencias agregadas | Actualizado |

## Dependencias Agregadas

```json
{
  "googleapis": "^118.0.0",
  "google-auth-library": "^9.0.0",
  "express": "^5.2.1",
  "cors": "^2.8.5"
}
```

## Funcionalidades Implementadas

### 1. Autenticación OAuth2
- [x] Generar URL de autorización
- [x] Intercambiar código por tokens
- [x] Almacenar tokens en Supabase
- [x] Refrescar tokens automáticamente
- [x] Manejar errores de autenticación

### 2. Obtención de Datos
- [x] Obtener pasos del día actual
- [x] Obtener calorías quemadas
- [x] Obtener distancia recorrida
- [x] Obtener rango de fechas (histórico)
- [x] Parsear respuestas de Google Fit API

### 3. Seguridad
- [x] Row Level Security (RLS) en Supabase
- [x] Validación de tokens expirados
- [x] Refresh token automático
- [x] Tokens nunca expuestos al frontend
- [x] CORS configurado

### 4. Frontend
- [x] Hook `useGoogleFit` reutilizable
- [x] Componente `GoogleFitConnection` UI
- [x] Manejo de estados (loading, error)
- [x] Selector de fechas
- [x] Botón de sincronización
- [x] Botón de desconexión

## Cómo Comenzar

### Paso 1: Instalar Dependencias
```bash
npm install
```

### Paso 2: Configurar Google Cloud
1. Ve a https://console.cloud.google.com/
2. Crea proyecto y activa "Fitness API"
3. Crea OAuth2 credentials
4. Copia Client ID y Secret

### Paso 3: Configurar Variables de Entorno
```bash
cp .env.example .env
# Edita .env con tus credenciales de Google
```

### Paso 4: Ejecutar Migración SQL
```sql
-- Ejecuta en Supabase Console:
-- database/migrations/20260111_google_fit_tokens.sql
```

### Paso 5: Iniciar Servidor
```bash
npm run dev:api      # Terminal 1
npm run dev          # Terminal 2
```

### Paso 6: Usar en Componentes
```typescript
import GoogleFitConnection from './components/GoogleFitConnection';

<GoogleFitConnection userId={userId} />
```

## Endpoints API

### Autenticación
```
GET /api/google-fit/auth
→ Retorna URL de autenticación de Google
```

### Callback
```
GET /api/google-fit/callback?code=CODE&state=USER_ID
→ Intercambia código por tokens
```

### Obtener Pasos
```
GET /api/google-fit/steps?userId=USER_ID&date=2025-01-11
→ Retorna: { date, steps, calories, distance }
```

### Rango de Pasos
```
GET /api/google-fit/steps-range?userId=USER_ID&startDate=2025-01-01&endDate=2025-01-31
→ Retorna array de DailyStepsData
```

### Desconectar
```
POST /api/google-fit/revoke?userId=USER_ID
→ Elimina tokens del usuario
```

## Estructura de Datos

### Tabla: google_fit_tokens
```sql
CREATE TABLE google_fit_tokens (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMP NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Tipo: DailyStepsData
```typescript
interface DailyStepsData {
  date: string;           // "2025-01-11"
  steps: number;          // 8234
  calories: number;       // 450
  distance: number;       // 5.82
}
```

## Ejemplos Rápidos

### Usar el Componente
```typescript
import GoogleFitConnection from './components/GoogleFitConnection';

export default function Dashboard() {
  return <GoogleFitConnection userId="user-123" />;
}
```

### Usar el Hook
```typescript
const { stepsData, loading, refreshSteps } = useGoogleFit({ userId });

return (
  <div>
    <p>Pasos: {stepsData?.steps}</p>
    <button onClick={() => refreshSteps()}>Actualizar</button>
  </div>
);
```

### Usar el Servicio Directo
```typescript
const tokens = await obtenerTokenosDelUsuario(userId);
const stepsData = await googleFitService.getDailySteps(tokens);
console.log(stepsData.steps); // 8234
```

## Testing

### Manual Testing Checklist
- [ ] Abre http://localhost:5173
- [ ] Haz clic en "Conectar Google Fit"
- [ ] Autoriza en Google
- [ ] Deberías ver tus pasos del día
- [ ] Cambia la fecha y verifica que funcione
- [ ] Haz clic en "Desconectar"
- [ ] Verifica que no puedas obtener datos

## Próximas Mejoras

### Integración con Hábitos
```typescript
// Registrar pasos como completación de hábito
await registrarHabito(userId, 'pasos-diarios', stepsData.steps);
```

### Sincronización Automática
```typescript
// Cada hora, sincronizar pasos de todos los usuarios
setInterval(sincronizacionAutomatica, 60 * 60 * 1000);
```

### Gráficos y Análisis
```typescript
// Mostrar gráfico de progreso
<StepsChart data={stepsRange} />
```

## Troubleshooting

### REDIRECT_URI_MISMATCH
**Problema**: La URL de callback no coincide  
**Solución**: Verifica en Google Cloud que `GOOGLE_FIT_REDIRECT_URI` sea exactamente igual

### Token Expirado
**Problema**: "El token de refresco es inválido"  
**Solución**: El usuario debe volver a conectar (revocó permisos en Google)

### 404 en /api/google-fit/auth
**Problema**: Las rutas no están registradas  
**Solución**: Asegúrate de importar las rutas en tu servidor Express

## Soporte

Para más información:
- [docs/GOOGLE_FIT_README.md](./GOOGLE_FIT_README.md) - Guía completa
- [docs/GOOGLE_FIT_SETUP.md](./GOOGLE_FIT_SETUP.md) - Configuración detallada
- [docs/GOOGLE_FIT_EJEMPLOS.md](./GOOGLE_FIT_EJEMPLOS.md) - Ejemplos de código
