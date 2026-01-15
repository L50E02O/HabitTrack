# Guía: Desplegar Backend en Azure y Frontend en Google Cloud

## 🎯 Arquitectura de Despliegue

```
┌─────────────────────┐         ┌─────────────────────┐
│   Google Cloud      │         │       Azure          │
│   (Frontend)        │ ──────► │   (Backend API)      │
│   React + Vite      │         │   Express Server     │
│   Puerto: 80/443    │         │   Puerto: 3001       │
└─────────────────────┘         └─────────────────────┘
                                        │
                                        ▼
                                ┌─────────────────────┐
                                │     Supabase        │
                                │   (Base de Datos)   │
                                └─────────────────────┘
```

---

## 📋 Parte 1: Desplegar Backend en Azure

### Opción A: Azure App Service (Recomendado para Express)

#### Paso 1: Preparar el Backend para Azure

✅ **Archivos ya creados:**
- `server.js` - Punto de entrada para Azure (ya existe en la raíz)
- `package.json` - Ya incluye el script `start` que ejecuta `server.js`

El archivo `server.js` ya está configurado con:
- CORS configurado para aceptar requests del frontend
- Todas las rutas de Google Fit
- Endpoint de ranking
- Health check en `/health`
- Manejo de errores

#### Paso 2: Crear Azure App Service

1. **Instalar Azure CLI:**
```bash
# Windows (PowerShell)
Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi
```

2. **Iniciar sesión en Azure:**
```bash
az login
```

3. **Crear grupo de recursos:**
```bash
az group create --name HabitTrack-RG --location eastus
```

4. **Crear App Service Plan:**
```bash
az appservice plan create \
  --name HabitTrack-Plan \
  --resource-group HabitTrack-RG \
  --sku B1 \
  --is-linux
```

5. **Crear Web App:**
```bash
az webapp create \
  --resource-group HabitTrack-RG \
  --plan HabitTrack-Plan \
  --name habittrack-api \
  --runtime "NODE:20-lts"
```

#### Paso 3: Configurar Variables de Entorno en Azure

```bash
az webapp config appsettings set \
  --resource-group HabitTrack-RG \
  --name habittrack-api \
  --settings \
    SUPABASE_URL="https://tu-proyecto.supabase.co" \
    SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key" \
    GOOGLE_FIT_CLIENT_ID="tu_client_id" \
    GOOGLE_FIT_CLIENT_SECRET="tu_client_secret" \
    GOOGLE_FIT_REDIRECT_URI="https://habittrack-api.azurewebsites.net/api/google-fit/callback" \
    FRONTEND_URL="https://tu-frontend-url.appspot.com" \
    NODE_ENV="production"
```

#### Paso 4: Desplegar el Backend

**Opción 1: Desde Git (Recomendado)**

```bash
# Configurar deployment desde GitHub
az webapp deployment source config \
  --name habittrack-api \
  --resource-group HabitTrack-RG \
  --repo-url https://github.com/tu-usuario/HabitTrack \
  --branch main \
  --manual-integration
```

**Opción 2: Desde ZIP**

```bash
# Crear ZIP del backend
# (Solo incluir archivos necesarios: server.js, package.json, src/, scripts/, node_modules/)

# Desplegar
az webapp deployment source config-zip \
  --resource-group HabitTrack-RG \
  --name habittrack-api \
  --src backend.zip
```

**Opción 3: Azure DevOps Pipeline**

Crea `.azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '20.x'
  displayName: 'Install Node.js'

- script: |
    npm install
  displayName: 'npm install'

- task: AzureWebApp@1
  inputs:
    azureSubscription: 'tu-subscription'
    appName: 'habittrack-api'
    package: '$(System.DefaultWorkingDirectory)'
```

#### Paso 5: Verificar el Despliegue

```bash
# Obtener URL del backend
az webapp show \
  --resource-group HabitTrack-RG \
  --name habittrack-api \
  --query defaultHostName \
  --output tsv

# Probar health check
curl https://habittrack-api.azurewebsites.net/health
```

**URL del Backend:** `https://habittrack-api.azurewebsites.net`

---

### Opción B: Azure Functions (Serverless)

Si prefieres serverless, puedes convertir las rutas en Azure Functions. Esto requiere más refactorización pero es más escalable.

---

## 📋 Parte 2: Desplegar Frontend en Google Cloud

### Opción A: Google Cloud Run (Recomendado)

#### Paso 1: Preparar el Frontend

✅ **Archivos ya creados:**
- `Dockerfile.frontend` - Dockerfile para construir la imagen del frontend
- `nginx.conf` - Configuración de Nginx para servir el frontend
- `.dockerignore.frontend` - Archivos a excluir del build del frontend

Los archivos ya están configurados con:
- Build multi-stage (Node.js para build, Nginx para servir)
- Configuración de Nginx para SPA routing
- Cache headers para assets estáticos
- Security headers
- Gzip compression

#### Paso 2: Configurar Variable de Entorno del Backend

Crea `.env.production`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_API_URL=https://habittrack-api.azurewebsites.net
```

#### Paso 3: Actualizar el Cliente de Google Fit

✅ **Ya actualizado:** El archivo `src/services/googleFit/client.ts` ya está configurado para usar `VITE_API_URL` en producción.

El cliente ahora usa:
- `VITE_API_URL` si está configurado (producción)
- `/api` como fallback (desarrollo, proxied por Vite)

#### Paso 4: Desplegar en Cloud Run

1. **Instalar Google Cloud SDK:**
```bash
# Windows
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

2. **Autenticarse:**
```bash
gcloud auth login
gcloud config set project tu-proyecto-id
```

3. **Habilitar APIs necesarias:**
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
```

4. **Build y deploy:**
```bash
# Build de la imagen
gcloud builds submit --tag gcr.io/tu-proyecto-id/habittrack-frontend

# Deploy a Cloud Run
gcloud run deploy habittrack-frontend \
  --image gcr.io/tu-proyecto-id/habittrack-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars VITE_API_URL=https://habittrack-api.azurewebsites.net \
  --set-env-vars VITE_SUPABASE_URL=https://tu-proyecto.supabase.co \
  --set-env-vars VITE_SUPABASE_ANON_KEY=tu_anon_key
```

**URL del Frontend:** `https://habittrack-frontend-xxxxx-uc.a.run.app`

---

### Opción B: Google App Engine

#### Paso 1: Crear app.yaml

```yaml
runtime: nodejs20

env_variables:
  VITE_API_URL: https://habittrack-api.azurewebsites.net
  VITE_SUPABASE_URL: https://tu-proyecto.supabase.co
  VITE_SUPABASE_ANON_KEY: tu_anon_key

handlers:
  - url: /.*
    script: auto
    static_files: dist/index.html
    upload: dist/index.html

  - url: /(.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))
    static_files: dist/\1
    upload: dist/(.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))
    expiration: 1y
```

#### Paso 2: Desplegar

```bash
# Build primero
npm run build

# Deploy
gcloud app deploy
```

---

## 🔧 Configuración Adicional

### 1. Actualizar Google Cloud Console

En Google Cloud Console, actualiza el `GOOGLE_FIT_REDIRECT_URI`:

```
https://habittrack-api.azurewebsites.net/api/google-fit/callback
```

### 2. Configurar CORS en Azure

Asegúrate de que el backend en Azure permita requests desde tu frontend:

```javascript
app.use(cors({
  origin: [
    'https://habittrack-frontend-xxxxx-uc.a.run.app',
    'https://tu-proyecto.appspot.com'
  ],
  credentials: true
}));
```

### 3. Actualizar Vite Config para Producción

Modifica `vite.config.ts`:

```typescript
export default defineConfig({
  // ... configuración existente
  
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  // Build config
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
```

---

## ✅ Checklist de Despliegue

### Backend (Azure)
- [ ] Crear `server.js` en la raíz
- [ ] Actualizar `package.json` con script `start`
- [ ] Crear App Service en Azure
- [ ] Configurar variables de entorno en Azure
- [ ] Actualizar `GOOGLE_FIT_REDIRECT_URI` en Google Cloud Console
- [ ] Desplegar código
- [ ] Verificar health check: `https://habittrack-api.azurewebsites.net/health`

### Frontend (Google Cloud)
- [ ] Crear `Dockerfile.frontend`
- [ ] Crear `nginx.conf`
- [ ] Actualizar `src/services/googleFit/client.ts` para usar `VITE_API_URL`
- [ ] Crear `.env.production`
- [ ] Build local: `npm run build`
- [ ] Desplegar en Cloud Run o App Engine
- [ ] Verificar que el frontend carga correctamente
- [ ] Probar conexión con Google Fit

### Configuración Final
- [ ] Actualizar CORS en Azure con URL del frontend
- [ ] Verificar que todas las variables de entorno estén configuradas
- [ ] Probar flujo completo: Login → Dashboard → Google Fit

---

## 🐛 Solución de Problemas

### Error: CORS en Azure
**Solución:** Verifica que `FRONTEND_URL` esté configurado correctamente en Azure App Settings.

### Error: Frontend no puede conectar con backend
**Solución:** 
1. Verifica que `VITE_API_URL` esté configurado en Cloud Run/App Engine
2. Verifica que la URL del backend sea accesible públicamente
3. Revisa la consola del navegador para ver errores de red

### Error: Google Fit callback falla
**Solución:** 
1. Verifica que `GOOGLE_FIT_REDIRECT_URI` en Azure apunte a: `https://habittrack-api.azurewebsites.net/api/google-fit/callback`
2. Verifica que la misma URL esté en Google Cloud Console

---

## 💰 Costos Estimados

### Azure App Service (B1)
- ~$13/mes (Basic tier)
- Incluye 1 GB RAM, 1.75 GB storage

### Google Cloud Run
- Pay-per-use: ~$0.40 por millón de requests
- Free tier: 2 millones de requests/mes

### Alternativa: Azure Functions + Cloud Run
- Más económico si el tráfico es bajo
- Escala automáticamente

---

## 📚 Referencias

- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [Google App Engine Docs](https://cloud.google.com/appengine/docs)
