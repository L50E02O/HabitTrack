# 📧 Configurar Gmail SMTP para Enviar Emails

## 🎯 Ventajas de usar Gmail SMTP

- ✅ **Gratis** - No necesitas comprar dominio
- ✅ **Fácil** - Usa tu cuenta de Gmail existente
- ✅ **500 emails/día** - Suficiente para la mayoría de apps
- ✅ **Sin configuración de DNS** - Funciona inmediatamente

---

## ✅ Paso 1: Configurar Gmail

### 1.1. Habilitar "Contraseñas de Aplicación"

1. Ve a tu cuenta de Google: [myaccount.google.com](https://myaccount.google.com)
2. En el menú lateral, selecciona **"Seguridad"**
3. Busca **"Verificación en dos pasos"**
4. Si NO está habilitada:
   - Haz clic en **"Verificación en dos pasos"**
   - Sigue los pasos para activarla (necesitarás tu teléfono)

### 1.2. Crear Contraseña de Aplicación

Una vez que tengas la verificación en 2 pasos:

1. Vuelve a **"Seguridad"**
2. Busca **"Contraseñas de aplicaciones"** (al final de la sección)
3. Haz clic para crear una nueva
4. Selecciona:
   - **App:** Otro (nombre personalizado)
   - **Nombre:** "HabitTrack"
5. Click en **"Generar"**
6. **⚠️ COPIA la contraseña generada** (16 caracteres, sin espacios)
   - Ejemplo: `abcd efgh ijkl mnop`
   - Guárdala en un lugar seguro

---

## ✅ Paso 2: Configurar Supabase Edge Function

Vamos a crear una nueva función que use Gmail SMTP en lugar de Resend.

### 2.1. Crear archivo de configuración

Crea un archivo `.env.local` en tu proyecto con:

```env
GMAIL_USER=tumail@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

### 2.2. Configurar variables en Supabase

```bash
# Configurar variables de entorno en Supabase
supabase secrets set GMAIL_USER=tumail@gmail.com
supabase secrets set GMAIL_APP_PASSWORD=abcdefghijklmnop
```

---

## ✅ Paso 3: Actualizar la Edge Function

La función ahora usará Gmail SMTP en lugar de Resend API.

**Ventajas:**
- ✅ No necesitas API key de Resend
- ✅ No necesitas dominio verificado
- ✅ Emails desde tu Gmail personal
- ✅ Funciona inmediatamente

---

## ✅ Paso 4: Desplegar

```bash
# Desplegar la función actualizada
cd supabase/functions
supabase functions deploy send-daily-reminders
```

---

## 🎯 Resultado

Ahora puedes enviar emails:
- ✅ Desde tu cuenta de Gmail: `tumail@gmail.com`
- ✅ A cualquier destinatario
- ✅ Hasta **500 emails por día**
- ✅ **Sin costo** adicional

---

## 📊 Límites de Gmail

| Plan | Emails/día | Costo |
|------|-----------|-------|
| Gmail Personal | 500 | Gratis |
| Google Workspace | 2,000 | $6/mes |

---

## 🚨 Notas Importantes

1. **Los emails se verán como enviados desde tu Gmail personal**
2. Gmail tiene límite de **500 emails/día** (suficiente para la mayoría)
3. Si necesitas más, considera:
   - Google Workspace ($6/mes, 2000 emails/día)
   - O comprar un dominio y usar Resend ($0, 3000 emails/mes)

---

## ✅ Ventajas vs Desventajas

### Ventajas ✅
- Gratis
- Sin configuración compleja
- Funciona inmediatamente
- Usa infraestructura de Google (confiable)

### Desventajas ❌
- Emails desde tu Gmail personal (no profesional)
- Límite de 500/día
- Puede ir a spam más fácilmente

---

¿Procedemos con esta opción usando Gmail?
