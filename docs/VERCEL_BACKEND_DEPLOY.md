# Guía: Desplegar Backend de Google Fit en Vercel

Tu proyecto está desplegado en Vercel, pero el backend (`npm run dev:api`) necesita convertirse en Serverless Functions de Vercel.

---

## 🎯 Opciones Disponibles

Tienes **dos opciones** para desplegar tu backend en Vercel:

### Opción 1: Serverless Functions (Recomendado) ✅

Convertir cada ruta de Express en una función serverless individual. Esta es la forma nativa de Vercel y es más eficiente.

**Ventajas:**
- ✅ Escalado automático por función
- ✅ Cold start más rápido
- ✅ Mejor para producción
- ✅ Facturación más eficiente

**Desventajas:**
- ⚠️ Requiere convertir cada ruta manualmente

### Opción 2: Servidor Express Completo

Mantener tu servidor Express y ejecutarlo como una función serverless.

**Ventajas:**
- ✅ Cambios mínimos en el código
- ✅ Más rápido de implementar

**Desventajas:**
- ⚠️ Cold start más lento
- ⚠️ Menos eficiente para múltiples rutas

---

## 🚀 Opción 1: Serverless Functions (Recomendado)

### Paso 1: Instalar Dependencias

Vercel necesita el paquete `@vercel/node` para ejecutar TypeScript en las funciones serverless:

```bash
npm install --save-dev @vercel/node
```

### Paso 2: Crear Estructura de API

Las funciones serverless en Vercel se crean en la carpeta `api/`. Cada ruta se convierte en un archivo:

```
api/
  google-fit/
    auth.ts          → GET /api/google-fit/auth
    callback.ts      → GET /api/google-fit/callback
    steps.ts         → GET /api/google-fit/steps
    steps-range.ts   → GET /api/google-fit/steps-range
    revoke.ts        → POST /api/google-fit/revoke
    sync.ts          → POST /api/google-fit/sync
```

### Paso 3: Crear las Funciones Serverless

Ya creé la primera función como ejemplo. Necesitas crear las demás siguiendo el mismo patrón.

Cada función debe exportar un `handler` que recibe `VercelRequest` y `VercelResponse`.

### Paso 4: Actualizar vercel.json

El archivo `vercel.json` necesita incluir las funciones serverless. Vercel detecta automáticamente la carpeta `api/`, pero puedes configurar el runtime:

```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node"
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Paso 5: Variables de Entorno en Vercel

Asegúrate de agregar todas las variables de entorno en Vercel:

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Settings → Environment Variables
3. Agrega:
   - `GOOGLE_FIT_CLIENT_ID`
   - `GOOGLE_FIT_CLIENT_SECRET`
   - `GOOGLE_FIT_REDIRECT_URI` (debe ser tu URL de Vercel)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Paso 6: Actualizar GOOGLE_FIT_REDIRECT_URI

En Vercel, el `GOOGLE_FIT_REDIRECT_URI` debe ser tu URL de producción:

```
https://tu-proyecto.vercel.app/api/google-fit/callback
```

Y en Google Cloud Console, agrega esta misma URL en los URIs de redireccionamiento autorizados.

---

## 🔄 Opción 2: Servidor Express Completo (Más Rápido)

Si quieres una solución más rápida sin cambiar mucho código:

### Paso 1: Crear api/index.ts

Crea un archivo `api/index.ts` que envuelva tu servidor Express:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import googleFitRoutes from '../src/services/googleFit/routes';

const app = express();
app.use(cors());
app.use(express.json());

// Cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseServiceKey) {
  // Rutas
  app.use('/api/google-fit', googleFitRoutes);
  
  // Otras rutas que tengas...
}

// Exportar como handler de Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
```

### Paso 2: Instalar @vercel/node

```bash
npm install --save-dev @vercel/node
```

### Paso 3: Actualizar vercel.json

```json
{
  "functions": {
    "api/index.ts": {
      "runtime": "@vercel/node"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## ⚠️ Importante: Variables de Entorno

**En Vercel**, agrega todas las variables necesarias:

```
GOOGLE_FIT_CLIENT_ID=tu_client_id
GOOGLE_FIT_CLIENT_SECRET=tu_client_secret
GOOGLE_FIT_REDIRECT_URI=https://tu-proyecto.vercel.app/api/google-fit/callback
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

**Después de agregar variables, haz un redeploy.**

---

## 🧪 Pruebas

Después de desplegar:

1. Verifica que las rutas funcionan:
   ```
   https://tu-proyecto.vercel.app/api/google-fit/auth?userId=TEST
   ```

2. Revisa los logs en Vercel:
   - Ve a Deployments
   - Abre el deployment más reciente
   - Ve a "Functions" o "Logs"

---

## 📝 Recomendación

Para empezar rápido, usa la **Opción 2** (Servidor Express Completo). Es más fácil de implementar y mantener.

Si necesitas mejor rendimiento o escalado, luego puedes migrar a la **Opción 1** (Serverless Functions individuales).

---

## 🔗 Referencias

- [Documentación de Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Express en Vercel](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js#using-express)
- [Variables de Entorno en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
