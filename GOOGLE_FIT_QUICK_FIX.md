# 🔧 SOLUCIÓN RÁPIDA - Error URI en Google Cloud

## ❌ El Error

```
Redireccionamiento no válido: debe terminar con un dominio público de nivel superior 
(como .com o .org). Debes usar un dominio que sea un Dominio privado principal válido.
```

---

## ✅ La Solución

### El Problema
Tu URI tenía formato incorrecto (posiblemente con doble `https://`):
```
❌ https://https://habit-track-two.vercel.app/api/google-fit/callback
```

### La URI Correcta
```
✅ https://habit-track-two.vercel.app/api/google-fit/callback
```

---

## 🚀 Pasos para Arreglarlo (3 minutos)

### 1️⃣ Google Cloud Console
1. Abre [Google Cloud Console](https://console.cloud.google.com/)
2. Ve a **APIs y servicios** → **Credenciales**
3. Haz clic en tu OAuth 2.0 credential
4. Haz clic en **EDITAR**
5. En **URIs de redirección autorizados**, reemplaza todo con:
   ```
   http://localhost:3001/api/google-fit/callback
   https://habit-track-two.vercel.app/api/google-fit/callback
   ```
6. Haz clic en **GUARDAR**

### 2️⃣ Vercel Environment Variables
1. Abre [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `habit-track-two`
3. Ve a **Settings** → **Environment Variables**
4. Agrega estas variables:
   ```
   GOOGLE_FIT_CLIENT_ID=tu_client_id.apps.googleusercontent.com
   GOOGLE_FIT_CLIENT_SECRET=tu_client_secret
   GOOGLE_FIT_REDIRECT_URI=https://habit-track-two.vercel.app/api/google-fit/callback
   VITE_SUPABASE_URL=https://pahegdcyadnndhbtzaps.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
   ```
5. Haz clic en **Save**

### 3️⃣ Redeploy en Vercel
1. Ve a **Deployments**
2. Haz clic en el deployment más reciente
3. Haz clic en **⋮** (tres puntos)
4. Selecciona **Redeploy**
5. Espera a que termine

### 4️⃣ Archivo .env Local (para desarrollo)
```env
GOOGLE_FIT_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=tu_client_secret
GOOGLE_FIT_REDIRECT_URI=http://localhost:3001/api/google-fit/callback
```

---

## ✅ Verificación

Después de los pasos anteriores, abre:
```
https://habit-track-two.vercel.app
```

Y prueba el login con Google Fit. Debería funcionar.

---

## 📋 Checklist

- [ ] Google Cloud tiene ambas URIs correctas
- [ ] Vercel tiene todas las Environment Variables
- [ ] Vercel fue redeployado
- [ ] Tu `.env` local tiene la URI de localhost
- [ ] Pruebas en http://localhost:5173 con `npm run dev`

---

## 🆘 Si Aún No Funciona

1. **Revisa Google Cloud** - Copia exactamente: `https://habit-track-two.vercel.app/api/google-fit/callback`
2. **Revisa Vercel** - Copia exactamente: `https://habit-track-two.vercel.app/api/google-fit/callback`
3. **Verifica Redeploy** - Si cambiaste variables, DEBE haber nuevo deployment
4. **Borra caché** - Presiona Ctrl+Shift+R en navegador

---

## 📚 Documentación Completa

Para más detalles, lee: **[docs/GOOGLE_FIT_VERCEL_SETUP.md](./docs/GOOGLE_FIT_VERCEL_SETUP.md)**

---

## Resumen

| Lugar | URI |
|-------|-----|
| **Google Cloud** | `https://habit-track-two.vercel.app/api/google-fit/callback` |
| **Vercel Env Var** | `https://habit-track-two.vercel.app/api/google-fit/callback` |
| **Local .env** | `http://localhost:3001/api/google-fit/callback` |

✅ ¡Listo!
