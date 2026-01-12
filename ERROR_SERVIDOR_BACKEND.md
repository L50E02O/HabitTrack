# ⚠️ IMPORTANTE: Servidor Backend Requerido

## El Error que Estás Viendo

El error `"Unexpected token '<', "<!DOCTYPE "... is not valid JSON"` significa que **el servidor backend NO está corriendo**.

## ✅ Solución (2 pasos simples)

### Paso 1: Abrir una Nueva Terminal

Abre una **NUEVA terminal** (no cierres la que ya tienes con `npm run dev`).

### Paso 2: Ejecutar el Servidor Backend

En la nueva terminal, ejecuta:

```bash
npm run dev:api
```

Deberías ver algo como:

```
🔧 Iniciando servidor...
📍 SUPABASE_URL: Configurado ✓
🔑 SUPABASE_SERVICE_ROLE_KEY: Configurado ✓
🏋️ GOOGLE_FIT_CLIENT_ID: Configurado ✓
📦 Cargando rutas de Google Fit...

✅ Servidor corriendo exitosamente!
🌐 URL: http://localhost:3001
🏋️ Google Fit API: http://localhost:3001/api/google-fit
```

### Paso 3: Recargar la Página

Recarga la página en tu navegador (F5) y el error debería desaparecer.

---

## 🎯 Resumen

Para que Google Fit funcione, necesitas **DOS terminales abiertas**:

1. **Terminal 1**: `npm run dev` (Frontend - Puerto 5173) ✅ Ya la tienes
2. **Terminal 2**: `npm run dev:api` (Backend - Puerto 3001) ❌ Falta esta

---

## 🚀 Atajo Rápido (Windows)

Si estás en Windows, puedes hacer doble clic en:

```
start-servers.bat
```

Esto abrirá ambas terminales automáticamente.

---

## ❓ ¿Por Qué Necesito Dos Servidores?

- **Frontend (Puerto 5173)**: La interfaz de usuario que ves en el navegador
- **Backend (Puerto 3001)**: Maneja la comunicación con Google Fit API y Supabase

El frontend necesita el backend para:
- Autenticarse con Google Fit
- Obtener datos de pasos, calorías y distancia
- Guardar tokens de autenticación en Supabase

---

## 🐛 Si Aún No Funciona

1. Verifica que el puerto 3001 no esté en uso
2. Verifica que tu archivo `.env` tenga las variables de Google Fit
3. Ejecuta `npm install` por si faltan dependencias
4. Cierra ambas terminales y vuelve a ejecutar los comandos

---

**¿Necesitas más ayuda?** Revisa `GOOGLE_FIT_START_HERE.md` para instrucciones detalladas.
