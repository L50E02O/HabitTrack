# Google Fit en Vercel - Guía de Configuración

## ⚠️ Problema Encontrado

Error en Google Cloud:
```
Redireccionamiento no válido: debe terminar con un dominio público de nivel superior 
(como .com o .org). Debes usar un dominio que sea un Dominio privado principal válido.
```

**Causa**: URI con formato incorrecto o dominio no reconocido

---

## ✅ Solución

### Paso 1: Verificar tu URL de Vercel

Tu dominio es: **`habit-track-two.vercel.app`**

La URI de callback debe ser:
```
https://habit-track-two.vercel.app/api/google-fit/callback
```

**IMPORTANTE**: 
- ❌ NO: `https://https://...` (sin doble https://)
- ✅ SÍ: `https://habit-track-two.vercel.app/...`

### Paso 2: Actualizar en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Ve a **APIs y servicios** → **Credenciales**
3. Haz clic en tu OAuth 2.0 credential (HabitTrack Web)
4. Haz clic en **EDITAR**
5. En **URIs de redirección autorizados**, actualiza:
   - Elimina cualquier entrada con formato incorrecto
   - Agrega EXACTAMENTE:
     ```
     https://habit-track-two.vercel.app/api/google-fit/callback
     ```
6. Haz clic en **GUARDAR**

### Paso 3: Actualizar Variables de Entorno en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Abre tu proyecto `habit-track-two`
3. Ve a **Settings** → **Environment Variables**
4. Agrega o actualiza:

```
GOOGLE_FIT_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=tu_client_secret
GOOGLE_FIT_REDIRECT_URI=https://habit-track-two.vercel.app/api/google-fit/callback
VITE_SUPABASE_URL=https://pahegdcyadnndhbtzaps.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

5. Haz clic en **Save**
6. **IMPORTANTE**: Redeploy la aplicación para aplicar los cambios:
   - Ve a **Deployments**
   - Haz clic en el deployment más reciente
   - Haz clic en los tres puntos → **Redeploy**

### Paso 4: Actualizar tu `.env` local

Para desarrollo local, mantén:
```env
GOOGLE_FIT_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=tu_client_secret
GOOGLE_FIT_REDIRECT_URI=http://localhost:3001/api/google-fit/callback
```

### Paso 5: Configurar Múltiples URIs en Google Cloud

Si necesitas tanto desarrollo como producción, en Google Cloud agrega AMBAS:

```
http://localhost:3001/api/google-fit/callback
https://habit-track-two.vercel.app/api/google-fit/callback
```

---

## 🔄 Flujo Completo de Autenticación

### En Desarrollo Local
```
Usuario en http://localhost:5173
  ↓
Haz clic en "Conectar Google Fit"
  ↓
GET http://localhost:3001/api/google-fit/auth
  ↓
Redirige a Google OAuth
  ↓
Usuario autoriza
  ↓
Google redirige a: http://localhost:3001/api/google-fit/callback?code=CODE
  ↓
Intercambia código por tokens
  ↓
Guarda en Supabase
  ↓
✅ Conectado
```

### En Vercel (Producción)
```
Usuario en https://habit-track-two.vercel.app
  ↓
Haz clic en "Conectar Google Fit"
  ↓
GET https://habit-track-two.vercel.app/api/google-fit/auth
  ↓
Redirige a Google OAuth
  ↓
Usuario autoriza
  ↓
Google redirige a: https://habit-track-two.vercel.app/api/google-fit/callback?code=CODE
  ↓
Intercambia código por tokens
  ↓
Guarda en Supabase
  ↓
✅ Conectado
```

---

## 🚀 Deploy en Vercel

### Para que funcione correctamente:

1. **Variables de Entorno** - Agrega en Vercel Settings
2. **Redeploy** - Después de agregar variables
3. **Google Cloud** - Agrega la URI `https://habit-track-two.vercel.app/api/google-fit/callback`

### Comandos Útiles

```bash
# Ver variables locales
cat .env

# Verificar que Vercel tiene las variables
# Ir a: https://vercel.com/dashboard/project-name/settings/environment-variables

# Para probar localmente con la URL de Vercel (no funciona):
# GOOGLE_FIT_REDIRECT_URI no puede ser vercel.app en localhost
# Usa http://localhost:3001/api/google-fit/callback para desarrollo
```

---

## ⚠️ Errores Comunes

### Error 1: "REDIRECT_URI_MISMATCH"
```
Cause: La URI en Google Cloud no coincide con GOOGLE_FIT_REDIRECT_URI
Solution: Verifica que sean EXACTAMENTE iguales
```

**Cómo revisar:**
1. Google Cloud: Credenciales → Tu OAuth client → Ver exact URIs
2. Tu `.env`: Copiar exactamente la misma URI
3. Vercel: Environment Variables → Copiar exactamente la misma URI

### Error 2: "Failed to verify authorization code"
```
Cause: El código expiró o la URI es incorrecta
Solution: Intenta de nuevo, asegúrate que Google redirige a la URI correcta
```

### Error 3: Página en blanco después de autorizar
```
Cause: La ruta /api/google-fit/callback no está registrada en Vercel
Solution: Revisa que las rutas Express estén correctamente importadas
```

---

## ✅ Checklist para Vercel

- [ ] Google Cloud tiene: `https://habit-track-two.vercel.app/api/google-fit/callback`
- [ ] Vercel tiene en Environment Variables todas las variables
- [ ] Vercel fue redeployado después de agregar variables
- [ ] Tu `.env` local tiene la URI de localhost
- [ ] Las rutas Express están importadas en `scripts/dev-api.js`
- [ ] `npm run dev:api` y `npm run dev` funcionan localmente
- [ ] Pruebas localmente en http://localhost:5173

---

## 📝 Script de Verificación

Abre console del navegador (F12) y ejecuta:

```javascript
// Verificar que el endpoint está disponible
fetch('https://habit-track-two.vercel.app/api/google-fit/auth')
  .then(res => res.json())
  .then(data => console.log('✅ Endpoint funciona:', data))
  .catch(err => console.error('❌ Error:', err.message));
```

Deberías ver:
```json
{
  "authUrl": "https://accounts.google.com/..."
}
```

---

## 🎯 URL Exactas a Usar

### Google Cloud Console
```
https://habit-track-two.vercel.app/api/google-fit/callback
```

### Archivo .env (desarrollo local)
```env
GOOGLE_FIT_REDIRECT_URI=http://localhost:3001/api/google-fit/callback
```

### Vercel Environment Variables
```
GOOGLE_FIT_REDIRECT_URI=https://habit-track-two.vercel.app/api/google-fit/callback
```

---

## 📞 Soporte

Si aún tienes problemas:

1. **Verifica cada paso** arriba
2. **Revisa logs** en Vercel → Deployments → Logs
3. **Revisa Google Cloud** → APIs y servicios → Credenciales
4. **Comprueba** que `https://habit-track-two.vercel.app` es accesible

---

## Resumen

| Paso | Acción |
|------|--------|
| 1 | Google Cloud: Agrega URI exacta |
| 2 | Vercel: Agrega Environment Variables |
| 3 | Vercel: Redeploy |
| 4 | Prueba: Haz login en Google Fit |
| 5 | ✅ Funciona |

¡Listo! 🚀
