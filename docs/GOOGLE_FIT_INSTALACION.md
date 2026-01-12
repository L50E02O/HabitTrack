# Guía de Instalación - Google Fit API

## Tabla de Contenidos
1. [Requisitos Previos](#requisitos-previos)
2. [Paso 1: Configurar Google Cloud](#paso-1-configurar-google-cloud)
3. [Paso 2: Instalar Dependencias](#paso-2-instalar-dependencias)
4. [Paso 3: Configurar Variables de Entorno](#paso-3-configurar-variables-de-entorno)
5. [Paso 4: Ejecutar Migración SQL](#paso-4-ejecutar-migración-sql)
6. [Paso 5: Integrar Rutas Express](#paso-5-integrar-rutas-express)
7. [Paso 6: Actualizar Servidor](#paso-6-actualizar-servidor)
8. [Paso 7: Probar Integración](#paso-7-probar-integración)
9. [Troubleshooting](#troubleshooting)

## Requisitos Previos

- Node.js 16+ instalado
- Acceso a Google Cloud Console
- Acceso a Supabase
- HabitTrack ejecutándose (opcional pero recomendado)

## Paso 1: Configurar Google Cloud

### 1.1 Crear Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en el selector de proyectos (arriba)
3. Haz clic en "NUEVO PROYECTO"
4. Nombre: "HabitTrack" (o el que prefieras)
5. Haz clic en "CREAR"

### 1.2 Activar Fitness API

1. En la búsqueda, escribe "Fitness API"
2. Haz clic en el resultado "Fitness API"
3. Haz clic en "ACTIVAR"
4. Espera a que se active (1-2 minutos)

### 1.3 Crear Credenciales OAuth2

1. En el panel izquierdo, ve a **APIs y servicios** → **Credenciales**
2. Haz clic en "Crear credenciales" → "ID de cliente OAuth 2.0"
3. **Tipo de aplicación**: Selecciona "Aplicación web"
4. **Nombre**: "HabitTrack Web"
5. En **URIs de redirección autorizados**, agrega:
   - `http://localhost:3001/api/google-fit/callback` (desarrollo local)
   - `https://habit-track-two.vercel.app/api/google-fit/callback` (producción Vercel)
6. Haz clic en "CREAR"

### 1.4 Copiar Credenciales

Verás un diálogo con:
- **Client ID**: algo como `123456789.apps.googleusercontent.com`
- **Client Secret**: algo como `GOCSPX-XXXXX`

**Cópialos en un lugar seguro** (los necesitarás en el paso 3)

## Paso 2: Instalar Dependencias

```bash
# Navega a la carpeta del proyecto
cd c:\Users\leoan\Desktop\HabitTrack

# Instala las dependencias
npm install

# Verifica que se instalaron correctamente
npm list googleapis google-auth-library
```

Deberías ver:
```
habittrack@0.0.0
├── googleapis@118.0.0
├── google-auth-library@9.0.0
├── express@5.2.1
└── cors@2.8.5
```

## Paso 3: Configurar Variables de Entorno

### 3.1 Crear archivo .env

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

O manualmente:
1. Ve a la carpeta raíz del proyecto
2. Crea un archivo llamado `.env` (sin extensión)
3. Copia el contenido de `.env.example`

### 3.2 Rellenar Credenciales

Abre `.env` y rellena con lo que copiaste de Google Cloud:

**Para desarrollo local:**
```env
# Google Fit OAuth2 (de Google Cloud Console)
GOOGLE_FIT_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=GOCSPX-XXXXX
GOOGLE_FIT_REDIRECT_URI=http://localhost:3001/api/google-fit/callback

# Supabase (si no lo tienes)
VITE_SUPABASE_URL=https://pahegdcyadnndhbtzaps.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

**Para producción en Vercel:**
```env
# Google Fit OAuth2
GOOGLE_FIT_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=GOCSPX-XXXXX
GOOGLE_FIT_REDIRECT_URI=https://habit-track-two.vercel.app/api/google-fit/callback

# Supabase
VITE_SUPABASE_URL=https://pahegdcyadnndhbtzaps.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

**IMPORTANTE**: 
- No commitees `.env` a Git (está en `.gitignore`)
- En Vercel, agrega las variables en: **Settings → Environment Variables**
- Asegúrate que `GOOGLE_FIT_REDIRECT_URI` sea exactamente igual en Google Cloud y en tu `.env`

## Paso 4: Ejecutar Migración SQL

### 4.1 Abrir Supabase Console

1. Ve a [Supabase Dashboard](https://app.supabase.com/)
2. Selecciona tu proyecto HabitTrack
3. Ve a **SQL Editor**

### 4.2 Ejecutar Migration

1. En la esquina derecha, haz clic en "Crear nueva query"
2. Dale nombre: "Google Fit Tokens Table"
3. Copia todo el contenido de:
   ```
   database/migrations/20260111_google_fit_tokens.sql
   ```
4. Pégalo en el editor
5. Haz clic en "Ejecutar" (o Ctrl+Enter)

Deberías ver: ✅ "Success. No rows returned."

### 4.3 Verificar Tabla

1. Ve a **Table Editor** (en el panel izquierdo)
2. Deberías ver la tabla `google_fit_tokens`
3. Haz clic para ver sus columnas

## Paso 5: Integrar Rutas Express

Si tienes un servidor Express existente, agrega las rutas:

```javascript
// En tu archivo principal del servidor (ej: scripts/dev-api.js)

import express from 'express';
import cors from 'cors';
import googleFitRoutes from '../src/services/googleFit/routes.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Agregar estas líneas:
app.use('/api/google-fit', googleFitRoutes);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
```

## Paso 6: Actualizar Servidor

Asegúrate de que tu servidor Express está actualizado:

### 6.1 Archivo: scripts/dev-api.js

```javascript
import express from 'express';
import cors from 'cors';
import googleFitRoutes from '../src/services/googleFit/routes.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rutas de Google Fit
app.use('/api/google-fit', googleFitRoutes);

// Rutas de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`API corriendo en http://localhost:${port}`);
  console.log(`Google Fit disponible en http://localhost:${port}/api/google-fit`);
});
```

## Paso 7: Probar Integración

### 7.1 Iniciar Servidor

```bash
# Terminal 1 - Servidor API
npm run dev:api

# Deberías ver:
# API corriendo en http://localhost:3001
# Google Fit disponible en http://localhost:3001/api/google-fit
```

### 7.2 Probar Endpoints

Abre en el navegador:

```
http://localhost:3001/api/google-fit/auth
```

Deberías ver JSON:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### 7.3 Probar Flujo Completo

1. Abre navegador a `http://localhost:5173` (aplicación web)
2. Busca el componente `GoogleFitConnection`
3. Haz clic en "Conectar Google Fit"
4. Autoriza en Google
5. Deberías ver tus pasos del día

## Uso en Componentes

### Opción 1: Usar el Componente Directo

```typescript
import GoogleFitConnection from './components/GoogleFitConnection';

export default function Dashboard() {
  const userId = 'tu-user-id'; // De tu sistema de auth

  return (
    <div>
      <h1>Mi Dashboard</h1>
      <GoogleFitConnection userId={userId} />
    </div>
  );
}
```

### Opción 2: Usar el Hook

```typescript
import { useGoogleFit } from './hooks/useGoogleFit';

function MisEstadisticas({ userId }: { userId: string }) {
  const { 
    stepsData, 
    loading, 
    error, 
    isAuthenticated,
    refreshSteps, 
    initiateLogin,
    revoke 
  } = useGoogleFit({ userId });

  if (!isAuthenticated) {
    return (
      <button onClick={initiateLogin}>
        Conectar Google Fit
      </button>
    );
  }

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h3>Pasos de hoy: {stepsData?.steps || 0}</h3>
      <p>Calorías: {stepsData?.calories || 0}</p>
      <p>Distancia: {stepsData?.distance || 0} km</p>
      <button onClick={() => refreshSteps()}>Actualizar</button>
      <button onClick={() => revoke()}>Desconectar</button>
    </div>
  );
}
```

## Troubleshooting

### Error: "REDIRECT_URI_MISMATCH"

**Problema**: La URL de callback no coincide entre `.env` y Google Cloud

**Solución**:
1. Ve a Google Cloud Console
2. Ve a **Credenciales** → Tu OAuth 2.0 client
3. Haz clic en **EDITAR**
4. Verifica que `http://localhost:3001/api/google-fit/callback` esté exactamente igual
5. Haz clic en **GUARDAR**

### Error: "invalid_grant"

**Problema**: El código de autorización expiró o es inválido

**Solución**: Vuelve a hacer login en Google Fit

### Error: "access_denied"

**Problema**: El usuario canceló la autorización

**Solución**: Pide que intente de nuevo haciendo clic en "Conectar Google Fit"

### Error: "The token has been revoked"

**Problema**: El usuario revocó el acceso en su cuenta de Google

**Solución**: Pide que se vuelva a conectar

### No aparecen datos pero dice que está conectado

**Problema**: Posible problema con la API de Google Fit

**Solución**:
1. Verifica que tienes al menos 1 dispositivo que envía datos a Google Fit
2. Prueba con un rango de fechas más amplio
3. Revisa los logs del servidor

### "TypeError: Cannot read property 'user_id'"

**Problema**: No existe tabla de Google Fit en Supabase

**Solución**: Ejecuta la migración SQL nuevamente (Paso 4)

## Verificación Final

Después de completar todos los pasos, verifica que:

- [ ] `npm install` completó sin errores
- [ ] `.env` tiene todas las variables rellenadas
- [ ] Google Fit API está activada en Google Cloud
- [ ] OAuth2 credentials creadas en Google Cloud
- [ ] Migración SQL ejecutada en Supabase
- [ ] Rutas Express están importadas
- [ ] `npm run dev:api` se inicia sin errores
- [ ] Puedes abrir http://localhost:3001/api/google-fit/auth
- [ ] El componente `GoogleFitConnection` aparece en tu app

¡Si todo está verde, tu integración está lista!

## Próximos Pasos

Después de la instalación, considera:

1. **Sincronizar con Hábitos**: Registrar pasos como completación de hábitos
2. **Histórico de Datos**: Guardar datos en tabla `datos_salud`
3. **Gráficos**: Mostrar progreso con charts
4. **Notificaciones**: Avisar cuando se alcancen metas
5. **Sincronización Automática**: Cada hora, actualizar datos

Ver ejemplos en: [docs/GOOGLE_FIT_EJEMPLOS.md](./GOOGLE_FIT_EJEMPLOS.md)
