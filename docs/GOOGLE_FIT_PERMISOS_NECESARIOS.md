# Permisos Necesarios para Google Fit API

## ❌ Permisos que NO necesitas

Los siguientes permisos que aparecen en Google Cloud Console **NO son necesarios** para Google Fit API:

- ❌ `.../auth/bigquery` - BigQuery (análisis de datos)
- ❌ `.../auth/cloud-platform` - Google Cloud Platform completo
- ❌ `.../auth/bigquery.readonly` - BigQuery solo lectura
- ❌ `.../auth/cloud-platform.read-only` - Google Cloud solo lectura
- ❌ `.../auth/devstorage.full_control` - Cloud Storage completo
- ❌ `.../auth/devstorage.read_only` - Cloud Storage solo lectura
- ❌ `.../auth/devstorage.read_write` - Cloud Storage lectura/escritura

**¿Por qué aparecen?**
Estos permisos aparecen porque tu proyecto de Google Cloud puede tener otros servicios habilitados (BigQuery, Cloud Storage, etc.), pero **NO son requeridos** para que Google Fit funcione.

---

## ✅ Permisos que SÍ necesitas

Google Fit API requiere **únicamente** estos 3 scopes (permisos):

### 1. Fitness Activity Read
```
https://www.googleapis.com/auth/fitness.activity.read
```
**Propósito**: Leer datos de actividad física (pasos, calorías, distancia, ejercicios)

### 2. Fitness Location Read
```
https://www.googleapis.com/auth/fitness.location.read
```
**Propósito**: Leer datos de ubicación relacionados con actividades físicas

### 3. User Info Email
```
https://www.googleapis.com/auth/userinfo.email
```
**Propósito**: Obtener el correo electrónico del usuario para identificar la cuenta

---

## 🔍 Dónde se configuran estos permisos

### ✅ En tu código (Ya configurado)

Los scopes están definidos en `src/services/googleFit/googleFitService.ts`:

```typescript
const scopes = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.location.read',
  'https://www.googleapis.com/auth/userinfo.email'
];
```

**Estos scopes se solicitan automáticamente** cuando el usuario autoriza tu aplicación. No necesitas configurarlos manualmente en Google Cloud Console.

---

## 📋 Configuración en Google Cloud Console

### Lo que SÍ debes hacer:

1. **Habilitar Fitness API**
   - Ve a "API y servicios" > "Biblioteca"
   - Busca "Fitness API"
   - Haz clic en "Habilitar"

2. **Configurar Pantalla de Consentimiento OAuth**
   - Ve a "API y servicios" > "Pantalla de consentimiento de OAuth"
   - Completa la información básica (nombre, email, etc.)
   - **NO necesitas agregar scopes manualmente aquí** - se solicitan automáticamente

3. **Crear Credenciales OAuth 2.0**
   - Ve a "API y servicios" > "Credenciales"
   - Crea un "ID de cliente OAuth 2.0"
   - Tipo: "Aplicación web"
   - Agrega URIs de redireccionamiento autorizados

### Lo que NO necesitas hacer:

- ❌ No necesitas habilitar BigQuery API
- ❌ No necesitas habilitar Cloud Storage API
- ❌ No necesitas agregar scopes manualmente en la pantalla de consentimiento
- ❌ No necesitas crear cuentas de servicio para Google Fit

---

## 🎯 Resumen

| Permiso | Necesario | Dónde se configura |
|---------|-----------|-------------------|
| `fitness.activity.read` | ✅ SÍ | Automático en código |
| `fitness.location.read` | ✅ SÍ | Automático en código |
| `userinfo.email` | ✅ SÍ | Automático en código |
| `bigquery.*` | ❌ NO | No necesario |
| `cloud-platform.*` | ❌ NO | No necesario |
| `devstorage.*` | ❌ NO | No necesario |

---

## 🐛 Si ves esos permisos en la pantalla de consentimiento

Si ves permisos de BigQuery, Cloud Storage, etc. en la pantalla de consentimiento de OAuth:

1. **No te preocupes** - No afectan a Google Fit
2. **Puedes ignorarlos** - No son necesarios para tu aplicación
3. **Los usuarios solo verán los scopes que realmente solicitas** (los 3 de Google Fit)

---

## ✅ Verificación

Para verificar que todo está correcto:

1. **Habilita Fitness API** en Google Cloud Console
2. **Crea credenciales OAuth 2.0** (Client ID y Secret)
3. **Configura las variables de entorno**:
   ```env
   GOOGLE_FIT_CLIENT_ID=tu_client_id.apps.googleusercontent.com
   GOOGLE_FIT_CLIENT_SECRET=tu_client_secret
   GOOGLE_FIT_REDIRECT_URI=http://localhost:3001/api/google-fit/callback
   ```
4. **Prueba la conexión** - Al hacer clic en "Conectar Google Fit", deberías ver solo los 3 scopes de Google Fit en la pantalla de autorización de Google

---

## 📚 Referencias

- [Google Fit API Scopes](https://developers.google.com/fit/rest/v1/authorization)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)
