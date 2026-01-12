# Arquitectura Google Fit - HabitTrack

## Diagrama de Flujo General

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO (Navegador)                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ 1. Hace clic en "Conectar Google Fit"
                       ▼
        ┌──────────────────────────────────┐
        │  GoogleFitConnection Component   │
        │  - UI lista para usar            │
        │  - Manejo de estados             │
        │  - Selector de fechas            │
        └──────────┬───────────────────────┘
                   │
                   │ 2. Llama a useGoogleFit hook
                   ▼
        ┌──────────────────────────────────┐
        │   useGoogleFit Hook              │
        │  - Gestiona estado               │
        │  - Llama al cliente              │
        │  - Maneja errores y loading      │
        └──────────┬───────────────────────┘
                   │
                   │ 3. Usa googleFitClient
                   ▼
        ┌──────────────────────────────────┐
        │   googleFitClient (Frontend)     │
        │  - Fetch de HTTP                 │
        │  - Wrapper de endpoints          │
        │  - Manejo de errores             │
        └──────────┬───────────────────────┘
                   │
       ┌───────────┴──────────────────────────┐
       │                                      │
   GET /api/google-fit/auth              GET /api/google-fit/steps
       │                                      │
       ▼                                      ▼
┌──────────────────────────────────────────────────────────────────┐
│              Express Backend (Node.js)                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Google Fit Routes (routes.ts)                              │  │
│  │  - GET /auth → genera URL de Google OAuth                  │  │
│  │  - GET /callback → intercambia código                      │  │
│  │  - GET /steps → obtiene pasos del día                      │  │
│  │  - GET /steps-range → obtiene rango de fechas             │  │
│  │  - POST /revoke → desconecta usuario                       │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                 │
│               ▼                                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Google Fit Service (googleFitService.ts)                   │  │
│  │  - Gestiona OAuth2 con google-auth-library                 │  │
│  │  - Lee datos de Google Fit API                             │  │
│  │  - Maneja refresh de tokens                                │  │
│  │  - Parsea respuestas de Google                             │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                 │
└───────────────┼─────────────────────────────────────────────────┘
                │
    ┌───────────┴──────────────┬──────────────────┐
    │                          │                  │
    ▼                          ▼                  ▼
┌─────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Google OAuth    │ │  Google Fit API  │ │  Supabase BD     │
│                 │ │                  │ │                  │
│ - Genera URLs   │ │ - aggregate:     │ │ google_fit_tokens│
│ - Intercambia   │ │   dataset        │ │  - access_token  │
│   códigos       │ │ - Pasos          │ │  - refresh_token │
│ - Refresca      │ │ - Calorías       │ │  - expiry_date   │
│   tokens        │ │ - Distancia      │ │ - user_id        │
└─────────────────┘ └──────────────────┘ │ Row Level        │
                                         │ Security (RLS)   │
                                         └──────────────────┘
```

## Interacción de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  GoogleFitConnection.tsx                                         │
│  ├─ useState para estatus de UI                                 │
│  ├─ useGoogleFit hook para lógica                               │
│  └─ Renderiza botones y datos                                   │
│                                                                   │
│  useGoogleFit hook (src/hooks/useGoogleFit.ts)                  │
│  ├─ Gestiona state (stepsData, loading, error)                  │
│  ├─ Llama a googleFitClient.getDailySteps()                     │
│  ├─ useEffect para cargar datos al montar                       │
│  └─ Retorna métodos: refreshSteps, initiateLogin, revoke        │
│                                                                   │
│  googleFitClient (src/services/googleFit/client.ts)             │
│  ├─ Método: getAuthUrl()                                        │
│  ├─ Método: getDailySteps(userId, date?)                        │
│  ├─ Método: getDailyStepsRange(userId, startDate, endDate)      │
│  ├─ Método: initiateLogin()                                     │
│  └─ Método: revokeAuthorization(userId)                         │
│                                                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP Requests
        ┌──────────────────┴──────────────────┐
        │                                      │
    GET /api/                             POST /api/
    google-fit/auth                       google-fit/callback
        │                                      │
    GET /api/                             (redirect from Google)
    google-fit/steps                          │
        │                                      ▼
        └──────────────────┬──────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                       BACKEND (Express)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  routes.ts                                                       │
│  ├─ GET /auth → googleFitService.getAuthUrl()                   │
│  ├─ GET /callback → googleFitService.exchangeCodeForTokens()    │
│  ├─ GET /steps → googleFitService.getDailySteps()               │
│  ├─ GET /steps-range → googleFitService.getDailyStepsRange()    │
│  └─ POST /revoke → delete from Supabase                         │
│                                                                   │
│  googleFitService.ts                                            │
│  ├─ Maneja OAuth2 (google-auth-library)                         │
│  ├─ Lee de Google Fit API (googleapis)                          │
│  ├─ Parsea datos (pasos, calorías, distancia)                   │
│  └─ Detecta y refresca tokens expirados                         │
│                                                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    Supabase          Google Fit API    Google OAuth
    Database          (googleapis)       (google-auth)
    (tokens)
```

## Flujo de Autenticación Detallado

```
┌────────────────────────────────────────────────────────────────────┐
│ 1. USUARIO INICIA LOGIN                                            │
│    Click en "Conectar Google Fit"                                  │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────┐
│ 2. OBTENER URL DE AUTENTICACIÓN                                    │
│    googleFitClient.getAuthUrl()                                    │
│    → GET /api/google-fit/auth                                      │
│    → googleFitService.getAuthUrl()                                 │
│       oauth2Client.generateAuthUrl({                               │
│         scopes: [fitness.activity.read, fitness.location.read],   │
│         access_type: 'offline',                                    │
│         prompt: 'consent'                                          │
│       })                                                            │
│    ← Retorna: https://accounts.google.com/o/oauth2/v2/auth?...    │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────┐
│ 3. USUARIO AUTORIZA EN GOOGLE                                      │
│    - Redirige a URL de Google                                      │
│    - Usuario ve permisos (leer pasos, calorías, ubicación)         │
│    - Usuario hace clic "Autorizar"                                 │
│    - Google redirige a: /api/google-fit/callback?code=CODE&...     │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────┐
│ 4. INTERCAMBIAR CÓDIGO POR TOKENS                                  │
│    GET /api/google-fit/callback?code=CODE&state=USER_ID            │
│    ↓                                                                │
│    googleFitService.exchangeCodeForTokens(code)                    │
│    ↓                                                                │
│    oauth2Client.getToken(code)                                     │
│    ↓ (llamada a Google)                                            │
│    Respuesta de Google:                                            │
│    {                                                               │
│      access_token: "ya29.a0AfH6SMDhX...",                          │
│      refresh_token: "1//0gU4kv...",                                │
│      expiry_date: 1705078800000,                                   │
│      token_type: "Bearer"                                          │
│    }                                                               │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────┐
│ 5. GUARDAR TOKENS EN SUPABASE                                      │
│    supabase.from('google_fit_tokens').upsert({                     │
│      user_id: USER_ID,                                             │
│      access_token: tokens.access_token,                            │
│      refresh_token: tokens.refresh_token,                          │
│      expiry_date: new Date(tokens.expiry_date),                    │
│      token_type: tokens.token_type                                 │
│    })                                                              │
│                                                                    │
│    Tabla google_fit_tokens:                                        │
│    ┌─────────────────────────────────────────────────────┐         │
│    │ id        │ UUID (generado)                         │         │
│    │ user_id   │ USER_ID (único, indexado)               │         │
│    │ access    │ ya29.a0AfH6SMDhX...                     │         │
│    │ refresh   │ 1//0gU4kv...                            │         │
│    │ expiry    │ 2025-01-12 08:00:00                     │         │
│    │ token_    │ Bearer                                  │         │
│    │ type      │                                         │         │
│    │ created   │ 2025-01-11 14:20:00                     │         │
│    │ updated   │ 2025-01-11 14:20:00                     │         │
│    └─────────────────────────────────────────────────────┘         │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────┐
│ 6. USUARIO COMPLETAMENTE AUTENTICADO                               │
│    - Frontend recibe: { success: true }                            │
│    - Tokens seguros en BD                                          │
│    - Puede solicitar datos de fitness                              │
└─────────────────────────────────────────────────────────────────────┘
```

## Flujo de Obtención de Datos (Pasos)

```
┌────────────────────────────────────────────────────────────────────┐
│ USUARIO PIDE PASOS DEL DÍA                                         │
│ Click en botón "Actualizar" o carga de página                      │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────┐
│ googleFitClient.getDailySteps(userId, date?)                       │
│ ↓                                                                   │
│ GET /api/google-fit/steps?userId=USER_ID&date=2025-01-11          │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────┐
│ BACKEND: GET /api/google-fit/steps                                 │
│ 1. Obtener tokens de Supabase                                      │
│    supabase.from('google_fit_tokens')                              │
│      .select('access_token, refresh_token, expiry_date')           │
│      .eq('user_id', userId)                                        │
│                                                                    │
│ 2. Verificar si token está expirado                                │
│    if (isTokenExpired(expiryDate)) {                               │
│      const newTokens = await refreshAccessToken(refreshToken)     │
│    }                                                               │
│                                                                    │
│ 3. Llamar a Google Fit API                                         │
│    POST https://www.googleapis.com/fitness/v1/users/me/dataset:   │
│    aggregate                                                       │
│    {                                                               │
│      "aggregateBy": [                                              │
│        { "dataTypeName": "com.google.step_count.delta" },          │
│        { "dataTypeName": "com.google.calories.expended" },         │
│        { "dataTypeName": "com.google.distance.delta" }             │
│      ],                                                            │
│      "bucketByTime": { "durationMillis": 86400000 },              │
│      "startTimeMillis": 1705017600000,                            │
│      "endTimeMillis": 1705104000000                               │
│    }                                                              │
│    Headers: { Authorization: "Bearer ACCESS_TOKEN" }              │
│                                                                    │
│ 4. Google responde con datos agregados                             │
│    {                                                               │
│      "bucket": [                                                   │
│        {                                                           │
│          "startTimeMillis": "1705017600000",                       │
│          "dataset": [                                              │
│            {                                                       │
│              "point": [                                            │
│                { "value": [{ "intVal": 8234 }] }   ← PASOS         │
│              ]                                                     │
│            },                                                      │
│            {                                                       │
│              "point": [                                            │
│                { "value": [{ "fpVal": 450000 }] }  ← CALORÍAS      │
│              ]                                                     │
│            },                                                      │
│            {                                                       │
│              "point": [                                            │
│                { "value": [{ "fpVal": 5820 }] }    ← DISTANCIA     │
│              ]                                                     │
│            }                                                       │
│          ]                                                         │
│        }                                                           │
│      ]                                                             │
│    }                                                              │
│                                                                    │
│ 5. Parsear respuesta                                               │
│    parseAggregateData(data) → {                                    │
│      date: "2025-01-11",                                           │
│      steps: 8234,                                                  │
│      calories: 450,                                                │
│      distance: 5.82                                                │
│    }                                                              │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────┐
│ RESPUESTA AL FRONTEND                                              │
│ {                                                                  │
│   "date": "2025-01-11",                                            │
│   "steps": 8234,                                                   │
│   "calories": 450,                                                 │
│   "distance": 5.82                                                 │
│ }                                                                 │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────┐
│ MOSTRAR EN UI                                                      │
│ stepsData.steps = 8234                                             │
│ stepsData.calories = 450                                           │
│ stepsData.distance = 5.82 km                                       │
│ stepsData.date = 2025-01-11                                        │
└─────────────────────────────────────────────────────────────────────┘
```

## Manejo de Token Expirado

```
┌──────────────────────────────────────────────────────────────────┐
│ SOLICITUD A GOOGLE FIT API                                       │
│ Verificar: isTokenExpired(expiryDate)                            │
└────────────┬───────────────────────────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
  SI  ▼             ▼  NO
  ┌───────────┐  ┌─────────────┐
  │ EXPIRADO  │  │ VÁLIDO      │
  └─────┬─────┘  └─────────────┘
        │               │
        ▼               │
┌──────────────────┐    │
│ Refrescar token: │    │
│                  │    │
│ refreshAccess    │    │
│ Token(refresh)   │    │
│                  │    │
│ OAuth2Client     │    │
│ .refresh         │    │
│ AccessToken()    │    │
│                  │    │
│ ↓ Google         │    │
│ responde con     │    │
│ nuevo access_    │    │
│ token            │    │
└────────┬─────────┘    │
         │              │
         └──────┬───────┘
                │
                ▼
        ┌──────────────────┐
        │ Usar access_token│
        │ para solicitud a │
        │ Google Fit API   │
        └──────┬───────────┘
               │
               ▼
        ┌──────────────────┐
        │ Actualizar token │
        │ en Supabase      │
        │                  │
        │ supabase.from    │
        │ ('google_fit_    │
        │ tokens')         │
        │ .update({        │
        │   access_token,  │
        │   expiry_date    │
        │ })               │
        └──────────────────┘
```

## Tipos de Datos

```
DailyStepsData
├── date: string           "2025-01-11"
├── steps: number          8234
├── calories: number       450
└── distance: number       5.82

GoogleFitTokens
├── access_token: string   "ya29.a0AfH6SMDhX..."
├── refresh_token: string  "1//0gU4kv..."
├── expiry_date: number    1705078800000
└── token_type: string     "Bearer"

GoogleFitCredentials
├── userId: string
├── tokens: GoogleFitTokens
├── createdAt: Date
└── updatedAt: Date
```

## Variables de Entorno

```
GOOGLE_FIT_CLIENT_ID
  → De: Google Cloud Console → Credenciales
  → Formato: XXXXX.apps.googleusercontent.com

GOOGLE_FIT_CLIENT_SECRET
  → De: Google Cloud Console → Credenciales
  → Formato: GOCSPX-XXXXX (seguro, no compartir)

GOOGLE_FIT_REDIRECT_URI
  → Debe coincidir en Google Cloud Console
  → Local: http://localhost:3001/api/google-fit/callback
  → Prod: https://tu-dominio.com/api/google-fit/callback

SUPABASE_URL
  → De: Supabase Dashboard → Settings → API

SUPABASE_ANON_KEY
  → De: Supabase Dashboard → Settings → API
```
