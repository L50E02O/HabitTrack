# 📧 Configurar Dominio en Resend para Enviar Emails

## 🎯 Objetivo
Configurar un dominio verificado en Resend para poder enviar emails a cualquier usuario (no solo a tu email).

---

## ✅ Paso 1: Obtener un Dominio

Necesitas un dominio propio. Opciones:

### Opción A: Ya tienes un dominio
Si ya tienes un dominio (ej: `miapp.com`), úsalo directamente o crea un subdominio para emails.

### Opción B: Comprar un dominio
Proveedores recomendados:
- **Namecheap**: ~$10/año - [namecheap.com](https://namecheap.com)
- **Cloudflare**: ~$10/año - [cloudflare.com](https://www.cloudflare.com/products/registrar/)
- **Google Domains**: ~$12/año - [domains.google](https://domains.google)
- **GoDaddy**: ~$15/año - [godaddy.com](https://godaddy.com)

### Opción C: Dominio Gratuito (para pruebas)
- **Freenom**: Dominios .tk, .ml, .ga, .cf gratis - [freenom.com](https://www.freenom.com)
- **⚠️ Nota**: No recomendado para producción, solo para pruebas

---

## ✅ Paso 2: Crear Cuenta en Resend

1. Ve a [resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Plan gratuito incluye:
   - ✅ 100 emails/día
   - ✅ 3,000 emails/mes
   - ✅ Dominios ilimitados

---

## ✅ Paso 3: Agregar tu Dominio en Resend

### 3.1. Ir a Dominios
1. En el dashboard de Resend, ve a [Domains](https://resend.com/domains)
2. Haz clic en **"Add Domain"**

### 3.2. Elegir Configuración

**Opción Recomendada: Subdominio**
```
mail.tudominio.com
```
Beneficios:
- ✅ No afecta el dominio principal
- ✅ Mejor organización
- ✅ Fácil de configurar

**Alternativa: Dominio Completo**
```
tudominio.com
```

### 3.3. Copiar Registros DNS
Resend te mostrará 3 registros DNS para configurar:

```
📝 TXT Record (Verificación)
Tipo: TXT
Nombre: @ (o vacío)
Valor: resend-verification=xxxxxxxxxxxxx

📬 MX Record (Recepción de respuestas)
Tipo: MX
Nombre: @ (o vacío)
Prioridad: 10
Valor: feedback-smtp.resend.com

🔐 CNAME Record (DKIM - Autenticación)
Tipo: CNAME
Nombre: resend._domainkey
Valor: xxxxxxxxxxxx.uxxxxxxxx.wl.resend.com
```

---

## ✅ Paso 4: Configurar DNS en tu Proveedor

### Ejemplo: Cloudflare

1. Inicia sesión en [Cloudflare](https://dash.cloudflare.com)
2. Selecciona tu dominio
3. Ve a **DNS** → **Records**
4. Agrega cada registro:

#### Record 1: TXT
```
Type: TXT
Name: @ (o tu subdominio: mail)
Content: resend-verification=xxxxx
TTL: Auto
Proxy: DNS Only (gris)
```

#### Record 2: MX
```
Type: MX
Name: @ (o tu subdominio: mail)
Mail server: feedback-smtp.resend.com
Priority: 10
TTL: Auto
```

#### Record 3: CNAME
```
Type: CNAME
Name: resend._domainkey (o mail.resend._domainkey)
Target: xxxxx.uxxxxx.wl.resend.com
TTL: Auto
Proxy: DNS Only (gris)
```

### Ejemplo: Namecheap

1. Ve a [Namecheap Dashboard](https://ap.www.namecheap.com/domains/list)
2. Click en **Manage** junto a tu dominio
3. Ve a **Advanced DNS**
4. Click **Add New Record**

#### Record 1: TXT
```
Type: TXT Record
Host: @ (o tu subdominio)
Value: resend-verification=xxxxx
TTL: Automatic
```

#### Record 2: MX
```
Type: MX Record
Host: @ (o tu subdominio)
Value: feedback-smtp.resend.com
Priority: 10
TTL: Automatic
```

#### Record 3: CNAME
```
Type: CNAME Record
Host: resend._domainkey (o mail.resend._domainkey)
Value: xxxxx.uxxxxx.wl.resend.com
TTL: Automatic
```

### Ejemplo: Google Domains

1. Ve a [Google Domains](https://domains.google.com)
2. Selecciona tu dominio
3. Ve a **DNS** en el menú lateral
4. Scroll hasta **Custom records**

Agrega los 3 registros siguiendo el mismo formato.

---

## ✅ Paso 5: Verificar Dominio

### 5.1. Esperar Propagación DNS
⏱️ **Tiempo:** 5 minutos - 48 horas (usualmente 15-30 minutos)

### 5.2. Verificar en Resend
1. Vuelve a [resend.com/domains](https://resend.com/domains)
2. Click en **"Verify Domain"**
3. Si está correctamente configurado, verás: ✅ **Verified**

### 5.3. Comprobar DNS (opcional)
Puedes verificar manualmente con herramientas:
- [MXToolbox](https://mxtoolbox.com/SuperTool.aspx)
- [DNS Checker](https://dnschecker.org/)

---

## ✅ Paso 6: Actualizar el Código

Una vez verificado tu dominio, actualiza el archivo:

**Archivo:** `supabase/functions/send-daily-reminders/index.ts`

```typescript
// ANTES (modo prueba):
from: 'HabitTrack <onboarding@resend.dev>',

// DESPUÉS (tu dominio verificado):
from: 'HabitTrack <noreply@tudominio.com>',
// O si usas subdominio:
from: 'HabitTrack <noreply@mail.tudominio.com>',
```

### Opciones de Email "From":
```typescript
// Opción 1: No-Reply (recomendado)
from: 'HabitTrack <noreply@tudominio.com>',

// Opción 2: Support
from: 'HabitTrack <support@tudominio.com>',

// Opción 3: Notifications
from: 'HabitTrack <notifications@tudominio.com>',

// Opción 4: Hello
from: 'HabitTrack <hello@tudominio.com>',
```

---

## ✅ Paso 7: Desplegar Cambios

```bash
# Navegar a la carpeta de funciones
cd supabase/functions

# Desplegar la función actualizada
supabase functions deploy send-daily-reminders
```

---

## ✅ Paso 8: Probar Envío de Emails

### Prueba Manual
1. Ve a tu dashboard de HabitTrack
2. Configura un recordatorio para otro usuario (no tu email)
3. Espera la hora del recordatorio o ejecuta manualmente:

```sql
-- En Supabase SQL Editor
SELECT cron.schedule(
  'send-reminders-test',
  '* * * * *', -- Cada minuto (solo para prueba)
  $$SELECT send_daily_reminders()$$
);
```

### Verificar en Resend Dashboard
1. Ve a [resend.com/emails](https://resend.com/emails)
2. Verás todos los emails enviados con su estado:
   - ✅ **Delivered** - Entregado correctamente
   - ⏳ **Queued** - En cola
   - ❌ **Bounced** - Email no válido

---

## 🎯 Resultado Final

Ahora puedes:
- ✅ Enviar emails a **cualquier usuario**
- ✅ Emails desde tu **dominio personalizado**
- ✅ **100 emails/día gratis** (3,000/mes)
- ✅ Dashboard de Resend para ver **estadísticas**
- ✅ **Confiabilidad** profesional

---

## 🚨 Troubleshooting

### Problema 1: "Domain not verified"
**Solución:**
- Verifica que los DNS records estén correctos
- Espera 15-30 minutos más
- Usa [DNS Checker](https://dnschecker.org/) para verificar propagación

### Problema 2: "validation_error"
**Causa:** El dominio aún no está verificado
**Solución:** Completa los pasos de verificación

### Problema 3: Emails no llegan
**Revisar:**
1. ✅ Dominio verificado en Resend
2. ✅ Email "from" usa el dominio verificado
3. ✅ Función desplegada con cambios
4. ✅ Revisar spam/junk del destinatario
5. ✅ Verificar en Resend dashboard el estado del email

### Problema 4: DNS Records no se propagan
**Solución:**
- Desactiva Cloudflare Proxy (🟠 → ☁️ gris)
- Espera más tiempo (hasta 48h en casos raros)
- Contacta soporte de tu proveedor DNS

---

## 📚 Recursos Adicionales

- 📖 [Resend Documentation](https://resend.com/docs)
- 🎥 [Resend Video Tutorial](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
- 💬 [Resend Discord Community](https://discord.gg/resend)
- 📧 [Resend Support](mailto:support@resend.com)

---

## 💡 Mejores Prácticas

1. **Usa subdominio** para emails (`mail.tudominio.com`)
2. **No-reply email** para notificaciones automáticas
3. **Monitorea estadísticas** en Resend dashboard
4. **Configura SPF/DKIM** (Resend lo hace automáticamente)
5. **Evita spam**: No envíes emails masivos sin opt-in

---

## ✅ Checklist Final

- [ ] Dominio adquirido
- [ ] Cuenta Resend creada
- [ ] Dominio agregado en Resend
- [ ] 3 DNS records configurados
- [ ] Dominio verificado (✅ verde)
- [ ] Código actualizado con nuevo email
- [ ] Función desplegada en Supabase
- [ ] Email de prueba enviado exitosamente

---

¡Listo! Ahora tu app puede enviar emails profesionales desde tu propio dominio 🚀
