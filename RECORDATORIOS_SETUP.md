# 🔔 Configuración del Sistema de Recordatorios por Email

Este sistema envía recordatorios automáticos por email usando **Supabase Edge Functions** y **Resend**.

## 📋 Requisitos Previos

1. ✅ Cuenta de Supabase (ya tienes el proyecto configurado)
2. ✅ Cuenta de Resend para enviar emails
3. ✅ Supabase CLI instalado
4. ✅ Git para manejar el código

---

## 🚀 Configuración Paso a Paso

### **Paso 1: Crear Cuenta en Resend**

1. Ve a [resend.com](https://resend.com)
2. Crea una cuenta gratuita (incluye 100 emails/día gratis)
3. Verifica tu email
4. Ve a **API Keys** → **Create API Key**
5. Copia tu API key (empieza con `re_...`)

### **Paso 2: Configurar Dominio en Resend (Importante)**

Para que los emails no vayan a spam:

1. En Resend, ve a **Domains** → **Add Domain**
2. Agrega tu dominio (ej: `habittrack.app`) o usa el de prueba `onboarding.resend.dev`
3. Si usas dominio propio, configura los registros DNS que Resend te indique
4. Espera verificación (5-10 minutos)

**Para pruebas**: Usa `onboarding@resend.dev` como remitente

### **Paso 3: Instalar Supabase CLI**

Si no lo tienes instalado:

**Windows (PowerShell):**
\`\`\`powershell
# Usando Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# O descarga directamente desde:
# https://github.com/supabase/cli/releases
\`\`\`

**Verificar instalación:**
\`\`\`powershell
supabase --version
\`\`\`

### **Paso 4: Conectar con tu Proyecto Supabase**

\`\`\`powershell
# En la carpeta del proyecto
cd "C:\Users\jvice\Downloads\HabitTrack-master\HabitTrack-master"

# Login a Supabase
supabase login

# Linkear tu proyecto (usa el ID de tu proyecto)
supabase link --project-ref pahegdcyadnndhbtzaps
\`\`\`

### **Paso 5: Configurar Variables de Entorno en Supabase**

Necesitas agregar tu API key de Resend como secret:

\`\`\`powershell
# Configurar RESEND_API_KEY
supabase secrets set RESEND_API_KEY=re_tu_api_key_aqui
\`\`\`

**Alternativamente, desde el Dashboard:**
1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Settings → Edge Functions → Secrets
3. Agregar nuevo secret:
   - **Name:** `RESEND_API_KEY`
   - **Value:** tu API key de Resend

### **Paso 6: Desplegar la Edge Function**

\`\`\`powershell
# Desplegar la función
supabase functions deploy send-daily-reminders

# Verificar que se desplegó correctamente
supabase functions list
\`\`\`

### **Paso 7: Configurar Base de Datos**

Ejecutar las migraciones SQL:

**Opción A - Desde Supabase Dashboard:**
1. Ve a tu proyecto → SQL Editor
2. Copia el contenido de `supabase/migrations/20250106_improve_recordatorio_table.sql`
3. Pégalo y ejecuta (RUN)
4. Repite con `supabase/migrations/20250106_setup_reminders_cron.sql`

**Opción B - Desde CLI:**
\`\`\`powershell
# Aplicar migraciones
supabase db push
\`\`\`

### **Paso 8: Activar Extensión pg_cron**

1. Ve a Supabase Dashboard → Database → Extensions
2. Busca **pg_cron**
3. Haz clic en **Enable**
4. Espera 1-2 minutos a que se active

### **Paso 9: Configurar el Cron Job**

**IMPORTANTE:** Edita el archivo `supabase/migrations/20250106_setup_reminders_cron.sql` y reemplaza la URL:

\`\`\`sql
-- Línea 19, cambiar a tu URL real:
function_url := 'https://pahegdcyadnndhbtzaps.supabase.co/functions/v1/send-daily-reminders';
\`\`\`

Luego ejecuta el script en SQL Editor o:

\`\`\`powershell
supabase db reset
\`\`\`

### **Paso 10: Verificar que Funciona**

**Probar manualmente la función:**

\`\`\`powershell
# Invocar la función directamente
supabase functions invoke send-daily-reminders --method POST
\`\`\`

**O desde navegador/Postman:**
\`\`\`
POST https://pahegdcyadnndhbtzaps.supabase.co/functions/v1/send-daily-reminders
Authorization: Bearer tu_supabase_anon_key
\`\`\`

**Ver logs:**
\`\`\`powershell
# Ver logs en tiempo real
supabase functions logs send-daily-reminders --tail
\`\`\`

---

## 🧪 Cómo Probar el Sistema

### **1. Crear un Recordatorio de Prueba**

Ve a tu app → Dashboard → Selecciona un hábito → ⋮ → Recordatorio

Configura:
- **Mensaje:** "¡Es hora de hacer ejercicio!"
- **Hora:** La hora actual + 2 minutos (ej: si son las 14:30, pon 14:32)
- **Activo:** ✅ Marcado

### **2. Esperar el Email**

Espera 2-3 minutos. Deberías recibir el email en la cuenta registrada en tu perfil.

### **3. Verificar Logs**

\`\`\`powershell
# Ver ejecuciones del cron
supabase db remote exec "SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;"

# Ver logs de la función
supabase functions logs send-daily-reminders --limit 20
\`\`\`

---

## 🔧 Configuración Avanzada

### **Cambiar Frecuencia del Cron**

Edita la línea del cron en `20250106_setup_reminders_cron.sql`:

\`\`\`sql
-- Cada minuto (actual)
SELECT cron.schedule('send-daily-reminders', '* * * * *', ...);

-- Cada 5 minutos
SELECT cron.schedule('send-daily-reminders', '*/5 * * * *', ...);

-- Cada hora
SELECT cron.schedule('send-daily-reminders', '0 * * * *', ...);

-- Cada día a las 9 AM
SELECT cron.schedule('send-daily-reminders', '0 9 * * *', ...);
\`\`\`

### **Personalizar Email**

Edita la función \`generateEmailHTML()\` en \`supabase/functions/send-daily-reminders/index.ts\`

Cambia:
- Colores
- Textos
- Logo (agrega \`<img src="...">\`)
- Footer

### **Cambiar Remitente del Email**

En \`index.ts\`, línea ~120:

\`\`\`typescript
from: 'HabitTrack <recordatorios@tudominio.com>',
// O usa el de prueba:
from: 'HabitTrack <onboarding@resend.dev>',
\`\`\`

---

## 📊 Monitoreo y Debugging

### **Ver Estado de Cron Jobs**

\`\`\`sql
-- Desde SQL Editor
SELECT * FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
\`\`\`

### **Ver Recordatorios Activos**

\`\`\`sql
SELECT 
  r.id_recordatorio,
  r.mensaje,
  r.intervalo_recordar,
  r.activo,
  p.email,
  h.nombre_habito
FROM recordatorio r
JOIN perfil p ON r.id_perfil = p.id
JOIN habito h ON r.id_habito = h.id_habito
WHERE r.activo = true
ORDER BY r.intervalo_recordar;
\`\`\`

### **Desactivar Cron Temporalmente**

\`\`\`sql
SELECT cron.unschedule('send-daily-reminders');
\`\`\`

### **Reactivar Cron**

\`\`\`sql
SELECT cron.schedule(
  'send-daily-reminders',
  '* * * * *',
  'SELECT invoke_send_reminders();'
);
\`\`\`

---

## 🛠️ Solución de Problemas

### **❌ "RESEND_API_KEY no está configurada"**

\`\`\`powershell
# Verificar secrets
supabase secrets list

# Si no está, agregarla:
supabase secrets set RESEND_API_KEY=re_tu_api_key
\`\`\`

### **❌ Emails no se envían**

1. Verificar que el dominio está verificado en Resend
2. Verificar que el email del usuario está en la tabla \`perfil\`
3. Ver logs: \`supabase functions logs send-daily-reminders\`
4. Probar manualmente: \`supabase functions invoke send-daily-reminders\`

### **❌ "function invoke_send_reminders() does not exist"**

Ejecuta de nuevo el script \`20250106_setup_reminders_cron.sql\`

### **❌ El cron no se ejecuta**

1. Verificar que pg_cron está habilitado
2. Ver: \`SELECT * FROM cron.job;\`
3. Reiniciar: \`SELECT cron.unschedule('send-daily-reminders');\` y volver a crear

---

## 💰 Costos

### **Resend (Email)**
- **Gratis:** 100 emails/día, 3,000/mes
- **Pro:** $20/mes → 50,000 emails/mes
- **Scale:** Desde $80/mes

### **Supabase**
- **Gratis:** Incluye Edge Functions (500,000 invocaciones/mes)
- **Pro:** $25/mes → Incluye más recursos

**Estimación:** Con 50 usuarios activos y 2 recordatorios c/u = ~3,000 emails/mes → **Plan gratuito suficiente**

---

## 📦 Archivos Creados

\`\`\`
HabitTrack-master/
├── supabase/
│   ├── functions/
│   │   └── send-daily-reminders/
│   │       └── index.ts              ← Edge Function principal
│   └── migrations/
│       ├── 20250106_improve_recordatorio_table.sql  ← Mejoras a tabla
│       └── 20250106_setup_reminders_cron.sql        ← Configuración cron
└── RECORDATORIOS_SETUP.md           ← Esta guía
\`\`\`

---

## ✅ Checklist Final

- [ ] Cuenta de Resend creada y API key obtenida
- [ ] Dominio verificado en Resend (o usando onboarding.resend.dev)
- [ ] Supabase CLI instalado
- [ ] Proyecto linkeado con \`supabase link\`
- [ ] Secret RESEND_API_KEY configurado
- [ ] Edge Function desplegada
- [ ] Extensión pg_cron activada
- [ ] Migraciones SQL ejecutadas
- [ ] Cron job creado y activo
- [ ] Recordatorio de prueba creado
- [ ] Email recibido exitosamente

---

## 🎯 Próximos Pasos

Una vez configurado:

1. **Crear panel de gestión** en frontend para ver/editar recordatorios
2. **Agregar notificaciones push** (usando Firebase Cloud Messaging)
3. **Estadísticas** de emails enviados/abiertos
4. **Templates múltiples** para diferentes tipos de hábitos
5. **Recordatorios inteligentes** basados en rachas

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: \`supabase functions logs send-daily-reminders\`
2. Verifica configuración de Resend
3. Prueba manualmente la función
4. Revisa que el email del usuario esté en la tabla \`perfil\`

---

¡Listo! Tu sistema de recordatorios está configurado 🎉
