# Despliegue del Backend en Vercel

## ✅ Estado Actual

**SÍ, el proyecto se puede desplegar en Vercel con el backend incluido.**

El backend Express (`npm run dev:api`) ha sido convertido a **Serverless Functions de Vercel**.

## 📁 Estructura Creada

Se han creado las siguientes funciones serverless en la carpeta `/api`:

```
api/
├── getRanking.ts                    # GET /api/getRanking
├── google-fit/
│   ├── auth.ts                      # GET /api/google-fit/auth
│   ├── callback.ts                  # GET /api/google-fit/callback
│   ├── steps.ts                     # GET /api/google-fit/steps
│   ├── steps-range.ts               # GET /api/google-fit/steps-range
│   ├── revoke.ts                    # POST /api/google-fit/revoke
│   └── sync.ts                      # POST /api/google-fit/sync
└── health-connect/
    ├── estado.ts                    # GET /api/health-connect/estado
    ├── permisos.ts                  # GET /api/health-connect/permisos
    └── datos.ts                     # GET/POST /api/health-connect/datos
```

## 🔧 Configuración de Vercel

### 1. Variables de Entorno Requeridas

En **Vercel Dashboard → Settings → Environment Variables**, agrega:

```env
# Supabase
SUPABASE_URL=https://pahegdcyadnndhbtzaps.supabase.co
VITE_SUPABASE_URL=https://pahegdcyadnndhbtzaps.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Google Fit
GOOGLE_FIT_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=tu_client_secret
GOOGLE_FIT_REDIRECT_URI=https://tu-dominio.vercel.app/api/google-fit/callback

# Frontend URL (opcional, se detecta automáticamente)
FRONTEND_URL=https://tu-dominio.vercel.app
```

### 2. vercel.json Actualizado

El archivo `vercel.json` ahora incluye:
- Configuración de funciones serverless (Node.js 20.x)
- Rewrites para rutas de API
- Headers para PWA y Service Workers

## 🚀 Cómo Funciona

### En Desarrollo Local

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend Express
npm run dev:api
```

El frontend usa un proxy en `vite.config.ts` que redirige `/api/*` a `http://localhost:3001`.

### En Vercel (Producción)

1. **Frontend**: Se despliega como sitio estático (SPA)
2. **Backend**: Las funciones en `/api` se convierten automáticamente en serverless functions
3. **Rutas**: 
   - `/api/*` → Serverless Functions
   - `/*` → Frontend (index.html)

## 📋 Rutas Disponibles

### Google Fit
- `GET /api/google-fit/auth?userId=USER_ID` - Obtener URL de autenticación
- `GET /api/google-fit/callback?code=CODE&state=USER_ID` - Callback de OAuth
- `GET /api/google-fit/steps?userId=USER_ID&date=YYYY-MM-DD` - Obtener pasos del día
- `GET /api/google-fit/steps-range?userId=USER_ID&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Obtener rango de pasos
- `POST /api/google-fit/revoke?userId=USER_ID` - Revocar autorización
- `POST /api/google-fit/sync?userId=USER_ID&daysBack=30` - Sincronizar datos

### Ranking
- `GET /api/getRanking?limit=100` - Obtener ranking de usuarios

### Health Connect (Mock)
- `GET /api/health-connect/estado` - Estado de Health Connect
- `GET /api/health-connect/permisos` - Permisos disponibles
- `GET /api/health-connect/datos?fecha=YYYY-MM-DD` - Obtener datos del día
- `POST /api/health-connect/datos` - Actualizar datos (testing)

## 🔄 Flujo de Deployment

1. **Push a GitHub** → Vercel detecta cambios automáticamente
2. **Build** → Vercel construye el frontend (`npm run build`)
3. **Deploy Functions** → Vercel detecta funciones en `/api` y las despliega como serverless
4. **Ready** → Frontend y backend disponibles en la misma URL

## ⚙️ Diferencias entre Desarrollo y Producción

| Aspecto | Desarrollo Local | Vercel (Producción) |
|---------|----------------|---------------------|
| **Backend** | Express en puerto 3001 | Serverless Functions |
| **Frontend** | Vite dev server (5173) | Sitio estático |
| **API Base URL** | `http://localhost:3001/api` | `/api` (relativo) |
| **Variables de entorno** | `.env` local | Vercel Dashboard |
| **CORS** | Configurado en Express | Configurado en cada función |

## 🧪 Pruebas Locales

### Probar Serverless Functions Localmente

Vercel CLI permite probar las funciones localmente:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Ejecutar en modo desarrollo
vercel dev
```

Esto iniciará:
- Frontend en `http://localhost:3000`
- Serverless Functions en `http://localhost:3000/api/*`

## 📝 Notas Importantes

1. **Runtime**: Las funciones usan Node.js 20.x (configurado en `vercel.json`)
2. **TypeScript**: Las funciones están en TypeScript, Vercel las compila automáticamente
3. **Dependencias**: Asegúrate de que todas las dependencias estén en `package.json`
4. **Timeout**: Las funciones tienen un timeout máximo de 10s (Hobby) o 60s (Pro)
5. **Cold Start**: La primera llamada puede tardar más (cold start), las siguientes son rápidas

## 🔍 Verificación

Después del deployment, verifica que las funciones funcionan:

```bash
# Probar endpoint de ranking
curl https://tu-dominio.vercel.app/api/getRanking

# Probar Google Fit auth
curl "https://tu-dominio.vercel.app/api/google-fit/auth?userId=test-user"
```

## 🐛 Troubleshooting

### Error: "Function not found"
- Verifica que los archivos estén en `/api`
- Verifica que `vercel.json` tenga la configuración correcta
- Revisa los logs en Vercel Dashboard → Functions

### Error: "Module not found"
- Verifica que las dependencias estén en `package.json`
- Asegúrate de que los imports usen rutas relativas correctas

### Error: "Environment variable not found"
- Verifica que todas las variables estén en Vercel Dashboard
- Haz redeploy después de agregar variables

## ✅ Checklist de Deployment

- [ ] Todas las funciones creadas en `/api`
- [ ] `vercel.json` configurado correctamente
- [ ] Variables de entorno agregadas en Vercel
- [ ] Google Cloud tiene la URI de callback correcta
- [ ] Pruebas locales funcionan (`npm run dev`)
- [ ] Push a GitHub
- [ ] Verificar deployment en Vercel Dashboard
- [ ] Probar endpoints en producción

## 🎯 Resumen

**SÍ, el backend se puede desplegar en Vercel.** 

Las rutas Express han sido convertidas a serverless functions que:
- ✅ Funcionan en el mismo dominio que el frontend
- ✅ No requieren servidor separado
- ✅ Se escalan automáticamente
- ✅ Son más económicas (solo pagas por uso)

¡Listo para desplegar! 🚀
